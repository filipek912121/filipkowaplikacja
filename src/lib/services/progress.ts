import "server-only";
import { ACHIEVEMENTS, qualifyingAchievements } from "@/lib/config/achievements";
import { XP_RULES } from "@/lib/config/game";
import { DuplicateError, getStore } from "@/lib/data";
import { addDays, dayKey } from "@/lib/engine/dates";
import { levelFromXp } from "@/lib/engine/levels";
import { challengeCompletionBonus, computeCheckinXp, liveStreak, streakBonusFor } from "@/lib/engine/xp";
import type { Achievement, Challenge, Completion, Participation, XpEvent } from "@/lib/types";

/** Insert an XP ledger entry; returns 0 if this exact reward was already claimed. */
export async function awardXp(e: Omit<XpEvent, "id" | "createdAt">): Promise<number> {
  if (e.amount <= 0) return 0;
  try {
    await getStore().insertXpEvent(e);
    return e.amount;
  } catch (err) {
    if (err instanceof DuplicateError) return 0;
    throw err;
  }
}

/** XP already earned today from sources that count towards the daily cap. */
export async function xpEarnedOn(userId: string, day: string): Promise<number> {
  const events = await getStore().listXpEvents({ userId, day });
  return events.filter((e) => e.reason !== "achievement" && e.reason !== "duel_win").reduce((s, e) => s + e.amount, 0);
}

export function participationWindow(p: Participation, ch: Challenge) {
  const startDay = dayKey(new Date(p.joinedAt));
  const lastDay = addDays(startDay, ch.durationDays - 1);
  return { startDay, lastDay };
}

/** Lazily close participations whose window is over. */
export async function refreshParticipation(p: Participation, ch: Challenge): Promise<Participation> {
  if (p.status !== "active") return p;
  const today = dayKey();
  const { lastDay } = participationWindow(p, ch);
  if (today <= lastDay) return p;
  const pending = await getStore().listCompletions({ participationId: p.id, status: "pending" });
  if (pending.length) return p; // wait for proof review
  if (p.checkins >= ch.durationDays) return p; // completion handled in grant
  return getStore().updateParticipation(p.id, { status: "failed" });
}

export interface GrantResult {
  base: number;
  streakBonus: number;
  completionBonus: number;
  capped: boolean;
  challengeCompleted: boolean;
}

/**
 * Turn an approved check-in into XP. Safe to call once per completion:
 * the ledger's unique (user, reason, ref) key makes repeated calls no-ops.
 */
export async function grantCompletion(completion: Completion, ch: Challenge): Promise<GrantResult> {
  const store = getStore();
  const today = dayKey();
  const userId = completion.userId;
  const profile = (await store.getProfile(userId))!;

  const participants = (await store.countParticipants([ch.id]))[ch.id] ?? 0;
  const soloPrivate = ch.visibility === "private" && !ch.isOfficial && ch.creatorId === userId && participants <= 1;

  const dayEvents = await store.listXpEvents({ userId, day: today });
  const earnedToday = dayEvents.filter((e) => e.reason !== "achievement" && e.reason !== "duel_win").reduce((s, e) => s + e.amount, 0);
  const streakRef = `streak:${completion.day}`;
  const alreadyBonus = (await store.listXpEvents({ userId, sinceDay: completion.day })).some(
    (e) => e.reason === "streak_bonus" && e.refId === streakRef,
  );
  const bonus = alreadyBonus ? 0 : streakBonusFor(liveStreak(profile, today));

  const xp = computeCheckinXp({ xpReward: ch.xpReward, difficulty: ch.difficulty, soloPrivate, earnedToday, streakBonus: bonus });
  const base = await awardXp({ userId, amount: xp.base, reason: "completion", refId: completion.id, day: today });
  const streakBonus = await awardXp({ userId, amount: xp.streakBonus, reason: "streak_bonus", refId: streakRef, day: today });
  await store.updateCompletion(completion.id, { status: "approved", xpAwarded: base });

  // Progress the participation
  let p = (await store.getParticipationById(completion.participationId))!;
  p = await store.updateParticipation(p.id, { checkins: p.checkins + 1 });
  let completionBonus = 0;
  let challengeCompleted = false;
  if (p.checkins >= ch.durationDays && p.status === "active") {
    await store.updateParticipation(p.id, { status: "completed", completedAt: new Date().toISOString() });
    challengeCompleted = true;
    const room = Math.max(0, XP_RULES.dailyXpCap - (earnedToday + base + streakBonus));
    completionBonus = await awardXp({
      userId,
      amount: Math.min(room, challengeCompletionBonus(ch.xpReward)),
      reason: "challenge_complete",
      refId: `${p.id}:${p.joinedAt}`,
      day: today,
    });
  }
  return { base, streakBonus, completionBonus, capped: xp.capped, challengeCompleted };
}

/** Recalculate stats and unlock any newly earned achievements. */
export async function evaluateAchievements(userId: string): Promise<Achievement[]> {
  const store = getStore();
  const [profile, owned, completions, participations, duels, memberships, created, approvedProofs, catalogue] = await Promise.all([
    store.getProfile(userId),
    store.listUserAchievements(userId),
    store.listCompletions({ userId }),
    store.listParticipations({ userId }),
    store.listDuels(userId),
    store.listSquadMembers({ userId }),
    store.listChallenges({ creatorId: userId }),
    store.listProofs({ userId, status: "approved" }),
    store.listAchievements(),
  ]);
  if (!profile) return [];
  const completed = participations.filter((p) => p.status === "completed");
  const completedChallenges = completed.length ? await store.listChallenges({ ids: completed.map((p) => p.challengeId) }) : [];

  const qualifying = qualifyingAchievements({
    totalCheckins: completions.filter((c) => c.status !== "rejected").length,
    longestStreak: profile.longestStreak,
    challengesCompleted: completed.length,
    extremeCompleted: completedChallenges.filter((c) => c.difficulty === "extreme").length,
    duelsWon: duels.filter((d) => d.winnerId === userId).length,
    squads: memberships.length,
    challengesCreated: created.filter((c) => c.creatorId === userId).length,
    level: levelFromXp(profile.xp).level,
    approvedProofs: approvedProofs.length,
  });
  const have = new Set(owned.map((o) => o.achievementId));
  const unlocked: Achievement[] = [];
  for (const id of qualifying) {
    if (have.has(id)) continue;
    try {
      await store.insertUserAchievement({ userId, achievementId: id, unlockedAt: new Date().toISOString() });
    } catch (err) {
      if (err instanceof DuplicateError) continue;
      throw err;
    }
    const a = catalogue.find((x) => x.id === id) ?? ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) continue;
    unlocked.push(a);
    await awardXp({ userId, amount: a.xpBonus, reason: "achievement", refId: `ach:${id}`, day: dayKey() });
  }
  return unlocked;
}
