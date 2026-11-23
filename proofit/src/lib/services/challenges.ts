import "server-only";
import { LIMITS } from "@/lib/config/game";
import { DuplicateError, getStore } from "@/lib/data";
import { addDays, dayKey } from "@/lib/engine/dates";
import { levelFromXp } from "@/lib/engine/levels";
import { screenChallengeText } from "@/lib/engine/safety";
import { clampXpReward, nextStreak } from "@/lib/engine/xp";
import type { Category, Challenge, Completion, Difficulty, Participation, ProofKind, ProofSubmission } from "@/lib/types";
import type { CreateChallengeInput } from "@/lib/validation";
import { getEntitlements } from "./entitlements";
import { AppError } from "./errors";
import { evaluateAchievements, grantCompletion, participationWindow, refreshParticipation } from "./progress";

export interface ChallengeCard extends Challenge {
  participants: number;
  creatorName: string | null;
  joined: boolean;
}

async function viewerSquadIds(userId: string) {
  return (await getStore().listSquadMembers({ userId })).map((m) => m.squadId);
}

export async function canViewChallenge(ch: Challenge, userId: string): Promise<boolean> {
  if (ch.creatorId === userId) return true;
  const store = getStore();
  if (ch.squadId) return (await viewerSquadIds(userId)).includes(ch.squadId);
  if (ch.visibility === "public") return true;
  if (await store.getParticipation(userId, ch.id)) return true;
  const invites = await store.listInvites({ toUserId: userId, targetId: ch.id });
  return invites.length > 0;
}

export async function decorate(challenges: Challenge[], userId: string): Promise<ChallengeCard[]> {
  const store = getStore();
  if (!challenges.length) return [];
  const ids = challenges.map((c) => c.id);
  const [counts, mine, creators] = await Promise.all([
    store.countParticipants(ids),
    store.listParticipations({ userId }),
    store.listProfiles([...new Set(challenges.map((c) => c.creatorId).filter(Boolean) as string[])]),
  ]);
  const active = new Set(mine.filter((p) => p.status === "active").map((p) => p.challengeId));
  return challenges.map((c) => ({
    ...c,
    participants: counts[c.id] ?? 0,
    creatorName: c.isOfficial ? "PROOFIT" : (creators.find((p) => p.id === c.creatorId)?.displayName ?? null),
    joined: active.has(c.id),
  }));
}

export interface ExploreFilters {
  q?: string;
  difficulty?: Difficulty;
  category?: Category;
  sort?: "popular" | "new" | "xp";
}

export async function exploreChallenges(userId: string, f: ExploreFilters): Promise<ChallengeCard[]> {
  const store = getStore();
  const squadIds = await viewerSquadIds(userId);
  let list = await store.listChallenges({ publicOnly: true, creatorId: userId, squadIds });
  list = list.filter((c) => !c.isTemplate || c.creatorId === userId);
  if (f.difficulty) list = list.filter((c) => c.difficulty === f.difficulty);
  if (f.category) list = list.filter((c) => c.category === f.category);
  if (f.q) {
    const q = f.q.toLowerCase();
    list = list.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }
  const cards = await decorate(list, userId);
  const sort = f.sort ?? "popular";
  return cards.sort((a, b) =>
    sort === "new" ? b.createdAt.localeCompare(a.createdAt) : sort === "xp" ? b.xpReward - a.xpReward : b.participants - a.participants,
  );
}

/** A deterministic "challenge of the day" from the official 1-day challenges. */
export async function dailyChallenge(userId: string): Promise<ChallengeCard | null> {
  const list = (await getStore().listChallenges({ publicOnly: true })).filter((c) => c.isOfficial && c.durationDays === 1);
  if (!list.length) return null;
  const today = dayKey();
  const hash = [...today].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const pick = [...list].sort((a, b) => a.id.localeCompare(b.id))[hash % list.length];
  return (await decorate([pick], userId))[0];
}

export interface ActiveChallenge {
  challenge: Challenge;
  participation: Participation;
  checkedInToday: boolean;
  todayStatus: Completion["status"] | null;
  dayNumber: number;
  daysLeft: number;
}

export async function activeChallenges(userId: string): Promise<ActiveChallenge[]> {
  const store = getStore();
  const parts = await store.listParticipations({ userId });
  const chs = await store.listChallenges({ ids: parts.map((p) => p.challengeId) });
  const today = dayKey();
  const todays = await store.listCompletions({ userId, day: today });
  const out: ActiveChallenge[] = [];
  for (const p0 of parts) {
    const ch = chs.find((c) => c.id === p0.challengeId);
    if (!ch) continue;
    const p = await refreshParticipation(p0, ch);
    if (p.status !== "active") continue;
    const { startDay, lastDay } = participationWindow(p, ch);
    const t = todays.find((c) => c.participationId === p.id && c.status !== "rejected");
    out.push({
      challenge: ch,
      participation: p,
      checkedInToday: Boolean(t),
      todayStatus: t?.status ?? null,
      dayNumber: Math.min(ch.durationDays, Math.max(1, Math.round((Date.parse(today) - Date.parse(startDay)) / 86_400_000) + 1)),
      daysLeft: Math.max(0, Math.round((Date.parse(lastDay) - Date.parse(today)) / 86_400_000)),
    });
  }
  return out.sort((a, b) => Number(a.checkedInToday) - Number(b.checkedInToday));
}

export async function challengeDetail(challengeId: string, userId: string) {
  const store = getStore();
  const ch = await store.getChallenge(challengeId);
  if (!ch || !(await canViewChallenge(ch, userId))) return null;
  const [card] = await decorate([ch], userId);
  let participation = await store.getParticipation(userId, ch.id);
  if (participation) participation = await refreshParticipation(participation, ch);
  const myCompletions = participation ? await store.listCompletions({ participationId: participation.id }) : [];
  const today = dayKey();
  const todayCompletion = myCompletions.find((c) => c.day === today && c.status !== "rejected") ?? null;
  const participants = await store.listParticipations({ challengeId: ch.id });
  const profiles = await store.listProfiles(participants.map((p) => p.userId));
  const roster = participants
    .filter((p) => p.status !== "left")
    .map((p) => ({ participation: p, profile: profiles.find((x) => x.id === p.userId)! }))
    .filter((r) => r.profile)
    .sort((a, b) => b.participation.checkins - a.participation.checkins)
    .slice(0, 12);
  const window = participation ? participationWindow(participation, ch) : null;
  const ent = await getEntitlements(userId);
  const activeCount = (await store.listParticipations({ userId })).filter((p) => p.status === "active").length;
  return {
    challenge: card,
    participation,
    myCompletions,
    todayCompletion,
    roster,
    window,
    canCheckIn: Boolean(participation?.status === "active" && window && today >= window.startDay && today <= window.lastDay && !todayCompletion),
    slotsLeft: Math.max(0, ent.limits.maxActiveChallenges - activeCount),
    plan: ent.plan,
    isCreator: ch.creatorId === userId,
  };
}

export async function createChallenge(userId: string, input: CreateChallengeInput): Promise<Challenge> {
  const store = getStore();
  const safety = screenChallengeText(input.title, input.description, ...input.tasks);
  if (!safety.ok)
    throw new AppError(
      `PROOFIT doesn't allow challenges involving ${safety.reason}. Keep it challenging, but safe.`,
      { description: "This challenge may encourage unsafe behaviour." },
    );
  const ent = await getEntitlements(userId);
  if (input.isTemplate && !ent.limits.customTemplates) throw new AppError("Custom challenge templates are a Premium feature.");
  if (input.visibility === "private") {
    const mine = await store.listChallenges({ creatorId: userId });
    const privateCount = mine.filter((c) => c.creatorId === userId && c.visibility === "private").length;
    if (privateCount >= ent.limits.maxPrivateChallenges)
      throw new AppError(`Free accounts can have ${ent.limits.maxPrivateChallenges} private challenge. Upgrade to Premium for more.`);
  }
  if (input.squadId) {
    const member = (await store.listSquadMembers({ squadId: input.squadId, userId })).length > 0;
    if (!member) throw new AppError("You can only create challenges for squads you belong to.");
  }
  const ch = await store.insertChallenge({
    title: input.title,
    description: input.description,
    difficulty: input.difficulty as Difficulty,
    category: input.category as Category,
    durationDays: input.durationDays,
    xpReward: clampXpReward(input.difficulty as Difficulty, input.xpReward),
    tasks: input.tasks,
    visibility: input.squadId ? "private" : input.visibility,
    requiresProof: input.requiresProof,
    creatorId: userId,
    squadId: input.squadId,
    isOfficial: false,
    isTemplate: input.isTemplate,
  });

  // Invite only people the creator follows (prevents spamming strangers).
  if (input.inviteUserIds.length) {
    const following = new Set((await store.listFollows({ followerId: userId })).map((f) => f.followingId));
    for (const to of input.inviteUserIds.filter((id) => following.has(id) && id !== userId)) {
      try {
        await store.insertInvite({ kind: "challenge", targetId: ch.id, fromUserId: userId, toUserId: to, status: "pending" });
      } catch (e) {
        if (!(e instanceof DuplicateError)) throw e;
      }
    }
  }
  if (input.joinNow && !input.isTemplate) {
    try {
      await joinChallenge(userId, ch.id);
    } catch (e) {
      if (!(e instanceof AppError)) throw e; // slot limit reached — challenge still created
    }
  }
  await evaluateAchievements(userId);
  return ch;
}

export async function joinChallenge(userId: string, challengeId: string): Promise<Participation> {
  const store = getStore();
  const ch = await store.getChallenge(challengeId);
  if (!ch || !(await canViewChallenge(ch, userId))) throw new AppError("Challenge not found.");
  if (ch.isTemplate) throw new AppError("Templates can't be joined directly — create a challenge from it.");

  const ent = await getEntitlements(userId);
  const mine = await store.listParticipations({ userId });
  const chs = await store.listChallenges({ ids: mine.map((p) => p.challengeId) });
  let active = 0;
  for (const p of mine) {
    const c = chs.find((x) => x.id === p.challengeId);
    if (c && (await refreshParticipation(p, c)).status === "active") active++;
  }
  const existing = mine.find((p) => p.challengeId === challengeId);
  if (existing && (await refreshParticipation(existing, ch)).status === "active") throw new AppError("You're already in this challenge.");
  if (active >= ent.limits.maxActiveChallenges)
    throw new AppError(
      ent.isPremium
        ? `You're at the ${ent.limits.maxActiveChallenges} active challenge limit. Finish one first.`
        : `Free plan allows ${ent.limits.maxActiveChallenges} active challenges. Finish one or upgrade to Premium.`,
    );

  const joinedAt = new Date().toISOString();
  const endsAt = new Date(`${addDays(dayKey(), ch.durationDays)}T00:00:00Z`).toISOString();
  let p: Participation;
  if (existing) {
    p = await store.updateParticipation(existing.id, { status: "active", joinedAt, endsAt, checkins: 0, completedAt: null });
  } else {
    try {
      p = await store.insertParticipation({ challengeId, userId, status: "active", joinedAt, endsAt, checkins: 0, completedAt: null });
    } catch (e) {
      if (e instanceof DuplicateError) throw new AppError("You're already in this challenge.");
      throw e;
    }
  }
  // Accept any pending invite for this challenge.
  for (const inv of await store.listInvites({ toUserId: userId, targetId: challengeId, status: "pending" }))
    await store.updateInvite(inv.id, { status: "accepted" });
  return p;
}

export async function leaveChallenge(userId: string, challengeId: string) {
  const store = getStore();
  const p = await store.getParticipation(userId, challengeId);
  if (!p || p.status !== "active") throw new AppError("You're not in this challenge.");
  await store.updateParticipation(p.id, { status: "left" });
}

export interface CheckInInput {
  challengeId: string;
  note: string;
  tasksDone: string[];
  proof: { kind: ProofKind; file?: File | null; url?: string | null; text?: string | null } | null;
}

export interface CheckInResult {
  status: Completion["status"];
  xp: number;
  streakBonus: number;
  completionBonus: number;
  capped: boolean;
  challengeCompleted: boolean;
  streak: number;
  levelUp: number | null;
  achievements: string[];
}

export async function checkIn(userId: string, input: CheckInInput): Promise<CheckInResult> {
  const store = getStore();
  const ch = await store.getChallenge(input.challengeId);
  if (!ch || !(await canViewChallenge(ch, userId))) throw new AppError("Challenge not found.");
  let p = await store.getParticipation(userId, ch.id);
  if (!p) throw new AppError("Join the challenge before checking in.");
  p = await refreshParticipation(p, ch);
  if (p.status !== "active") throw new AppError("This challenge run has ended. Rejoin to start again.");

  const today = dayKey();
  const { startDay, lastDay } = participationWindow(p, ch);
  if (today < startDay || today > lastDay) throw new AppError("Check-ins are closed for this challenge window.");

  const missing = ch.tasks.filter((t) => !input.tasksDone.includes(t));
  if (missing.length) throw new AppError("Complete every daily task before checking in.", { tasks: `Still to do: ${missing[0]}` });

  // Validate proof
  if (ch.requiresProof) {
    const pr = input.proof;
    if (!pr) throw new AppError("This challenge requires proof.", { proof: "Add a photo, link or description." });
    if (pr.kind === "photo") {
      if (!pr.file || pr.file.size === 0) throw new AppError("Choose a photo to upload.", { proof: "No photo selected." });
      if (pr.file.size > LIMITS.proofMaxBytes) throw new AppError("Photo must be 5 MB or smaller.", { proof: "File too large." });
      if (!(LIMITS.proofMimeTypes as readonly string[]).includes(pr.file.type))
        throw new AppError("Upload a JPG, PNG, WEBP or HEIC image.", { proof: "Unsupported file type." });
    }
    if (pr.kind === "link" && !pr.url) throw new AppError("Paste a link to your proof.", { proof: "Link required." });
    if (pr.kind === "text" && (!pr.text || pr.text.length < 10))
      throw new AppError("Describe what you did (10+ characters).", { proof: "Description too short." });
  }

  const before = (await store.getProfile(userId))!;
  let completion: Completion;
  try {
    completion = await store.insertCompletion({
      participationId: p.id,
      challengeId: ch.id,
      userId,
      day: today,
      status: ch.requiresProof ? "pending" : "approved",
      xpAwarded: 0,
      note: input.note,
      tasksDone: input.tasksDone.filter((t) => ch.tasks.includes(t)),
    });
  } catch (e) {
    if (e instanceof DuplicateError) throw new AppError("You've already checked in today. Come back tomorrow!");
    throw e;
  }

  // Streak counts real activity (pending proofs included). Applied before XP so today's bonus uses it.
  const s = nextStreak(before, today);
  await store.updateProfile(userId, { currentStreak: s.currentStreak, longestStreak: s.longestStreak, lastActiveDay: s.lastActiveDay });

  let grant = { base: 0, streakBonus: 0, completionBonus: 0, capped: false, challengeCompleted: false };
  if (ch.requiresProof && input.proof) {
    let storagePath: string | null = null;
    if (input.proof.kind === "photo" && input.proof.file) {
      try {
        storagePath = await store.uploadProofFile(userId, input.proof.file);
      } catch (e) {
        await store.updateCompletion(completion.id, { status: "rejected", note: "Upload failed" });
        throw new AppError(e instanceof Error ? e.message : "Upload failed.");
      }
    }
    await store.insertProof({
      completionId: completion.id,
      challengeId: ch.id,
      userId,
      kind: input.proof.kind,
      storagePath,
      url: input.proof.kind === "link" ? (input.proof.url ?? null) : null,
      text: input.proof.text ?? null,
      status: "pending",
      reviewerId: null,
      reviewNote: null,
      reviewedAt: null,
    });
  } else {
    grant = await grantCompletion(completion, ch);
  }

  const unlocked = await evaluateAchievements(userId);
  const after = (await store.getProfile(userId))!;
  const lvBefore = levelFromXp(before.xp).level;
  const lvAfter = levelFromXp(after.xp).level;
  return {
    status: completion.status,
    xp: grant.base,
    streakBonus: grant.streakBonus,
    completionBonus: grant.completionBonus,
    capped: grant.capped,
    challengeCompleted: grant.challengeCompleted,
    streak: s.currentStreak,
    levelUp: lvAfter > lvBefore ? lvAfter : null,
    achievements: unlocked.map((a) => a.name),
  };
}

/** Who may verify a proof: challenge creator, squad owner, admins, or verified finishers of official challenges. */
async function canReview(reviewerId: string, ch: Challenge): Promise<boolean> {
  const store = getStore();
  if (ch.creatorId === reviewerId) return true;
  const reviewer = await store.getProfile(reviewerId);
  if (reviewer?.isAdmin) return true;
  if (ch.squadId) {
    const squad = await store.getSquad(ch.squadId);
    if (squad?.ownerId === reviewerId) return true;
  }
  if (ch.isOfficial) {
    const p = await store.getParticipation(reviewerId, ch.id);
    const completedBefore = (await store.listCompletions({ userId: reviewerId, challengeId: ch.id, status: "approved" })).length > 0;
    return Boolean(p && (p.status === "completed" || completedBefore));
  }
  return false;
}

export interface ReviewItem {
  proof: ProofSubmission;
  challenge: Challenge;
  submitter: { id: string; displayName: string; username: string; avatarColor: string; avatarUrl: string | null };
  fileUrl: string | null;
  completion: Completion | null;
}

export async function reviewQueue(reviewerId: string): Promise<ReviewItem[]> {
  const store = getStore();
  const pending = await store.listProofs({ status: "pending" });
  const chs = await store.listChallenges({ ids: [...new Set(pending.map((p) => p.challengeId))] });
  const allowed: ProofSubmission[] = [];
  for (const pr of pending) {
    const ch = chs.find((c) => c.id === pr.challengeId);
    if (ch && pr.userId !== reviewerId && (await canReview(reviewerId, ch))) allowed.push(pr);
  }
  const profiles = await store.listProfiles([...new Set(allowed.map((p) => p.userId))]);
  return Promise.all(
    allowed.map(async (proof) => ({
      proof,
      challenge: chs.find((c) => c.id === proof.challengeId)!,
      submitter: profiles.find((p) => p.id === proof.userId)!,
      fileUrl: proof.storagePath ? await store.proofFileUrl(proof.storagePath) : null,
      completion: await store.getCompletion(proof.completionId),
    })),
  );
}

export async function myProofs(userId: string) {
  const store = getStore();
  const proofs = await store.listProofs({ userId });
  const chs = await store.listChallenges({ ids: [...new Set(proofs.map((p) => p.challengeId))] });
  return Promise.all(
    proofs.slice(0, 20).map(async (proof) => ({
      proof,
      challenge: chs.find((c) => c.id === proof.challengeId) ?? null,
      fileUrl: proof.storagePath ? await store.proofFileUrl(proof.storagePath) : null,
    })),
  );
}

export async function reviewProof(reviewerId: string, proofId: string, decision: "approve" | "reject", note: string) {
  const store = getStore();
  const proof = await store.getProof(proofId);
  if (!proof || proof.status !== "pending") throw new AppError("This proof was already reviewed.");
  if (proof.userId === reviewerId) throw new AppError("You can't review your own proof.");
  const ch = await store.getChallenge(proof.challengeId);
  if (!ch || !(await canReview(reviewerId, ch))) throw new AppError("You're not allowed to review this proof.");
  const completion = await store.getCompletion(proof.completionId);
  if (!completion) throw new AppError("Check-in not found.");

  const reviewedAt = new Date().toISOString();
  await store.updateProof(proof.id, { status: decision === "approve" ? "approved" : "rejected", reviewerId, reviewNote: note || null, reviewedAt });
  if (decision === "approve") {
    await grantCompletion(completion, ch);
    await evaluateAchievements(proof.userId);
  } else {
    await store.updateCompletion(completion.id, { status: "rejected" });
  }
}
