import "server-only";
import { randomUUID } from "node:crypto";
import { LIMITS } from "@/lib/config/game";
import type { Achievement } from "@/lib/types";
import { DuplicateError, type Store } from "../store";
import { createSeed, type DemoDb } from "./seed";

/**
 * In-memory implementation used in DEMO MODE only.
 * Data lives in the server process (survives hot reloads via globalThis) and
 * resets on restart. It is never used when Supabase is configured.
 */
const g = globalThis as unknown as { __proofitDemoDb?: DemoDb };
function db(): DemoDb {
  if (!g.__proofitDemoDb) g.__proofitDemoDb = createSeed();
  return g.__proofitDemoDb;
}
export function resetDemoDb() {
  g.__proofitDemoDb = createSeed();
}

const now = () => new Date().toISOString();
const clone = <T>(v: T): T => structuredClone(v);
function patchById<T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T {
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) throw new Error("Not found");
  list[i] = { ...list[i], ...patch, id };
  return clone(list[i]);
}

export const memoryStore: Store = {
  async getProfile(id) {
    return clone(db().profiles.find((p) => p.id === id) ?? null);
  },
  async getProfileByUsername(username) {
    return clone(db().profiles.find((p) => p.username.toLowerCase() === username.toLowerCase()) ?? null);
  },
  async listProfiles(ids) {
    return clone(ids ? db().profiles.filter((p) => ids.includes(p.id)) : db().profiles);
  },
  async updateProfile(id, patch) {
    return patchById(db().profiles, id, patch);
  },

  async getChallenge(id) {
    return clone(db().challenges.find((c) => c.id === id) ?? null);
  },
  async listChallenges(q) {
    let list = db().challenges;
    if (q.ids) list = list.filter((c) => q.ids!.includes(c.id));
    if (q.templatesOnly) list = list.filter((c) => c.isTemplate);
    const pub = (c: (typeof list)[number]) => c.visibility === "public" && !c.squadId;
    if (q.publicOnly || q.creatorId || q.squadIds) {
      list = list.filter(
        (c) =>
          (q.publicOnly && pub(c)) ||
          (q.creatorId && c.creatorId === q.creatorId) ||
          (q.squadIds && c.squadId && q.squadIds.includes(c.squadId)),
      );
    }
    return clone([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async insertChallenge(c) {
    const row = { ...c, id: randomUUID(), createdAt: now() };
    db().challenges.push(row);
    return clone(row);
  },
  async countParticipants(ids) {
    const out: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
    for (const p of db().participations) if (p.challengeId in out && p.status !== "left") out[p.challengeId]++;
    return out;
  },

  async getParticipation(userId, challengeId) {
    return clone(db().participations.find((p) => p.userId === userId && p.challengeId === challengeId) ?? null);
  },
  async getParticipationById(id) {
    return clone(db().participations.find((p) => p.id === id) ?? null);
  },
  async listParticipations(q) {
    return clone(
      db().participations.filter(
        (p) =>
          (!q.userId || p.userId === q.userId) &&
          (!q.challengeId || p.challengeId === q.challengeId) &&
          (!q.userIds || q.userIds.includes(p.userId)),
      ),
    );
  },
  async insertParticipation(p) {
    if (db().participations.some((x) => x.userId === p.userId && x.challengeId === p.challengeId))
      throw new DuplicateError("Already joined");
    const row = { ...p, id: randomUUID() };
    db().participations.push(row);
    return clone(row);
  },
  async updateParticipation(id, patch) {
    return patchById(db().participations, id, patch);
  },

  async listCompletions(q) {
    return clone(
      db()
        .completions.filter(
          (c) =>
            (!q.userId || c.userId === q.userId) &&
            (!q.challengeId || c.challengeId === q.challengeId) &&
            (!q.challengeIds || q.challengeIds.includes(c.challengeId)) &&
            (!q.participationId || c.participationId === q.participationId) &&
            (!q.day || c.day === q.day) &&
            (!q.sinceDay || c.day >= q.sinceDay) &&
            (!q.status || c.status === q.status),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },
  async getCompletion(id) {
    return clone(db().completions.find((c) => c.id === id) ?? null);
  },
  async insertCompletion(c) {
    // Mirrors the DB unique index (participation_id, day).
    if (db().completions.some((x) => x.participationId === c.participationId && x.day === c.day && x.status !== "rejected"))
      throw new DuplicateError("Already checked in today");
    const row = { ...c, id: randomUUID(), createdAt: now() };
    db().completions.push(row);
    return clone(row);
  },
  async updateCompletion(id, patch) {
    return patchById(db().completions, id, patch);
  },
  async insertProof(p) {
    const row = { ...p, id: randomUUID(), createdAt: now() };
    db().proofs.push(row);
    return clone(row);
  },
  async getProof(id) {
    return clone(db().proofs.find((p) => p.id === id) ?? null);
  },
  async listProofs(q) {
    return clone(
      db()
        .proofs.filter(
          (p) =>
            (!q.userId || p.userId === q.userId) &&
            (!q.challengeIds || q.challengeIds.includes(p.challengeId)) &&
            (!q.completionIds || q.completionIds.includes(p.completionId)) &&
            (!q.status || p.status === q.status),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },
  async updateProof(id, patch) {
    return patchById(db().proofs, id, patch);
  },
  async uploadProofFile(userId, file) {
    if (file.size > LIMITS.proofMaxBytes) throw new Error("File too large");
    const buf = Buffer.from(await file.arrayBuffer());
    const path = `${userId}/${randomUUID()}`;
    db().files[path] = `data:${file.type};base64,${buf.toString("base64")}`;
    return path;
  },
  async proofFileUrl(path) {
    return db().files[path] ?? null;
  },

  async insertXpEvent(e) {
    // Mirrors the DB unique index (user_id, reason, ref_id) that blocks double XP claims.
    if (e.refId && db().xpEvents.some((x) => x.userId === e.userId && x.reason === e.reason && x.refId === e.refId))
      throw new DuplicateError("XP already claimed");
    const row = { ...e, id: randomUUID(), createdAt: now() };
    db().xpEvents.push(row);
    // Mirrors the DB trigger that keeps profiles.xp in sync with the ledger.
    const profile = db().profiles.find((p) => p.id === e.userId);
    if (profile) profile.xp += e.amount;
    return clone(row);
  },
  async listXpEvents(q) {
    return clone(
      db().xpEvents.filter(
        (e) => (!q.userId || e.userId === q.userId) && (!q.sinceDay || e.day >= q.sinceDay) && (!q.day || e.day === q.day),
      ),
    );
  },
  async xpTotals(q) {
    const totals = new Map<string, number>();
    const users = q.userIds ?? db().profiles.map((p) => p.id);
    for (const id of users) totals.set(id, 0);
    for (const e of db().xpEvents) {
      if (q.sinceDay && e.day < q.sinceDay) continue;
      if (!totals.has(e.userId)) continue;
      totals.set(e.userId, (totals.get(e.userId) ?? 0) + e.amount);
    }
    return [...totals.entries()]
      .map(([userId, xp]) => ({ userId, xp }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, q.limit ?? 100);
  },

  async getDuel(id) {
    return clone(db().duels.find((d) => d.id === id) ?? null);
  },
  async listDuels(userId) {
    return clone(
      db()
        .duels.filter((d) => d.challengerId === userId || d.opponentId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },
  async insertDuel(d) {
    const row = { ...d, id: randomUUID(), createdAt: now() };
    db().duels.push(row);
    return clone(row);
  },
  async updateDuel(id, patch) {
    return patchById(db().duels, id, patch);
  },

  async getSquad(id) {
    return clone(db().squads.find((s) => s.id === id) ?? null);
  },
  async getSquadByInviteCode(code) {
    return clone(db().squads.find((s) => s.inviteCode.toUpperCase() === code.toUpperCase()) ?? null);
  },
  async listSquads(q) {
    return clone(
      db().squads.filter((s) => (!q.ids || q.ids.includes(s.id)) && (!q.publicOnly || !s.isPrivate)),
    );
  },
  async insertSquad(s) {
    const row = { ...s, id: randomUUID(), createdAt: now() };
    db().squads.push(row);
    return clone(row);
  },
  async listSquadMembers(q) {
    return clone(
      db().squadMembers.filter((m) => (!q.squadId || m.squadId === q.squadId) && (!q.userId || m.userId === q.userId)),
    );
  },
  async insertSquadMember(m) {
    if (db().squadMembers.some((x) => x.squadId === m.squadId && x.userId === m.userId))
      throw new DuplicateError("Already a member");
    db().squadMembers.push({ ...m });
    return clone(m);
  },
  async deleteSquadMember(squadId, userId) {
    db().squadMembers = db().squadMembers.filter((m) => !(m.squadId === squadId && m.userId === userId));
  },

  async listAchievements(): Promise<Achievement[]> {
    return clone(db().achievements);
  },
  async listUserAchievements(userId) {
    return clone(db().userAchievements.filter((u) => u.userId === userId));
  },
  async insertUserAchievement(ua) {
    if (db().userAchievements.some((u) => u.userId === ua.userId && u.achievementId === ua.achievementId))
      throw new DuplicateError();
    db().userAchievements.push({ ...ua });
  },

  async getSubscription(userId) {
    return clone(db().subscriptions.find((s) => s.userId === userId) ?? null);
  },
  async upsertSubscription(s) {
    const list = db().subscriptions;
    const i = list.findIndex((x) => x.userId === s.userId);
    if (i >= 0) list[i] = { ...s };
    else list.push({ ...s });
    return clone(s);
  },

  async listFollows(q) {
    return clone(
      db().follows.filter(
        (f) => (!q.followerId || f.followerId === q.followerId) && (!q.followingId || f.followingId === q.followingId),
      ),
    );
  },
  async insertFollow(f) {
    if (db().follows.some((x) => x.followerId === f.followerId && x.followingId === f.followingId)) return;
    db().follows.push({ ...f });
  },
  async deleteFollow(f) {
    db().follows = db().follows.filter((x) => !(x.followerId === f.followerId && x.followingId === f.followingId));
  },
  async listInvites(q) {
    return clone(
      db()
        .invites.filter(
          (i) =>
            (!q.toUserId || i.toUserId === q.toUserId) &&
            (!q.fromUserId || i.fromUserId === q.fromUserId) &&
            (!q.targetId || i.targetId === q.targetId) &&
            (!q.status || i.status === q.status),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },
  async getInvite(id) {
    return clone(db().invites.find((i) => i.id === id) ?? null);
  },
  async insertInvite(i) {
    if (db().invites.some((x) => x.kind === i.kind && x.targetId === i.targetId && x.toUserId === i.toUserId && x.status === "pending"))
      throw new DuplicateError("Invite already sent");
    const row = { ...i, id: randomUUID(), createdAt: now() };
    db().invites.push(row);
    return clone(row);
  },
  async updateInvite(id, patch) {
    return patchById(db().invites, id, patch);
  },
};

/** Demo-only helper: create a brand-new demo account. */
export function createDemoProfile(username: string, displayName: string) {
  const id = randomUUID();
  const colors = ["#8b5cf6", "#3b82f6", "#06b6d4", "#ec4899", "#f59e0b", "#22c55e"];
  db().profiles.push({
    id,
    username,
    displayName,
    bio: "",
    avatarColor: colors[Math.floor(Math.random() * colors.length)],
    avatarUrl: null,
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: null,
    isAdmin: false,
    createdAt: now(),
  });
  db().subscriptions.push({
    userId: id,
    plan: "free",
    status: "active",
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  });
  return id;
}
