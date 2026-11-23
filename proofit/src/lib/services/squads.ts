import "server-only";
import { randomInt } from "node:crypto";
import { DuplicateError, getStore } from "@/lib/data";
import { dayKey, startOfWeek } from "@/lib/engine/dates";
import type { Profile, Squad } from "@/lib/types";
import { decorate } from "./challenges";
import { getEntitlements } from "./entitlements";
import { AppError } from "./errors";
import { evaluateAchievements } from "./progress";

function inviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 7 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export async function listSquadsFor(userId: string) {
  const store = getStore();
  const memberships = await store.listSquadMembers({ userId });
  const mine = await store.listSquads({ ids: memberships.map((m) => m.squadId) });
  const discover = (await store.listSquads({ publicOnly: true })).filter((s) => !mine.some((m) => m.id === s.id));
  const all = [...mine, ...discover];
  const counts: Record<string, number> = {};
  await Promise.all(all.map(async (s) => (counts[s.id] = (await store.listSquadMembers({ squadId: s.id })).length)));
  return { mine, discover, counts };
}

export async function squadDetail(userId: string, squadId: string) {
  const store = getStore();
  const squad = await store.getSquad(squadId);
  if (!squad) return null;
  const members = await store.listSquadMembers({ squadId });
  const isMember = members.some((m) => m.userId === userId);
  if (squad.isPrivate && !isMember) return null;
  const profiles = await store.listProfiles(members.map((m) => m.userId));
  const weekly = await store.xpTotals({ sinceDay: startOfWeek(dayKey()), userIds: members.map((m) => m.userId) });
  const leaderboard = weekly
    .map((w) => ({ profile: profiles.find((p) => p.id === w.userId)!, weeklyXp: w.xp, role: members.find((m) => m.userId === w.userId)!.role }))
    .filter((r) => r.profile);
  const challenges = isMember ? await decorate(await store.listChallenges({ squadIds: [squadId] }), userId) : [];
  const following = isMember ? (await store.listFollows({ followerId: userId })).map((f) => f.followingId) : [];
  const invitable = (await store.listProfiles(following)).filter((p) => !members.some((m) => m.userId === p.id));
  return { squad, isMember, isOwner: squad.ownerId === userId, leaderboard, challenges, invitable };
}

export async function createSquad(userId: string, input: { name: string; description: string; isPrivate: boolean }): Promise<Squad> {
  const store = getStore();
  const ent = await getEntitlements(userId);
  if (input.isPrivate && !ent.limits.privateSquads) throw new AppError("Private squads are a Premium feature.");
  const owned = (await store.listSquadMembers({ userId })).filter((m) => m.role === "owner").length;
  if (owned >= ent.limits.maxSquadsOwned)
    throw new AppError(`Your plan allows ${ent.limits.maxSquadsOwned} squad${ent.limits.maxSquadsOwned > 1 ? "s" : ""}. Upgrade for more.`);
  let squad: Squad | null = null;
  for (let i = 0; i < 5 && !squad; i++) {
    try {
      squad = await store.insertSquad({ ...input, ownerId: userId, inviteCode: inviteCode() });
    } catch (e) {
      if (!(e instanceof DuplicateError)) throw e;
    }
  }
  if (!squad) throw new AppError("Couldn't create the squad. Try again.");
  await store.insertSquadMember({ squadId: squad.id, userId, role: "owner", joinedAt: new Date().toISOString() });
  await evaluateAchievements(userId);
  return squad;
}

export async function joinSquad(userId: string, opts: { squadId?: string; code?: string }) {
  const store = getStore();
  const squad = opts.code ? await store.getSquadByInviteCode(opts.code) : opts.squadId ? await store.getSquad(opts.squadId) : null;
  if (!squad) throw new AppError(opts.code ? "No squad matches that invite code." : "Squad not found.");
  if (squad.isPrivate && !opts.code) {
    const invited = (await store.listInvites({ toUserId: userId, targetId: squad.id, status: "pending" })).length > 0;
    if (!invited) throw new AppError("This squad is private — you need an invite or code.");
  }
  try {
    await store.insertSquadMember({ squadId: squad.id, userId, role: "member", joinedAt: new Date().toISOString() });
  } catch (e) {
    if (e instanceof DuplicateError) throw new AppError("You're already in this squad.");
    throw e;
  }
  for (const inv of await store.listInvites({ toUserId: userId, targetId: squad.id, status: "pending" }))
    await store.updateInvite(inv.id, { status: "accepted" });
  await evaluateAchievements(userId);
  return squad;
}

export async function leaveSquad(userId: string, squadId: string) {
  const store = getStore();
  const squad = await store.getSquad(squadId);
  if (!squad) throw new AppError("Squad not found.");
  if (squad.ownerId === userId) throw new AppError("Owners can't leave their own squad.");
  await store.deleteSquadMember(squadId, userId);
}

export async function inviteToSquad(userId: string, squadId: string, toUserId: string) {
  const store = getStore();
  const members = await store.listSquadMembers({ squadId });
  if (!members.some((m) => m.userId === userId)) throw new AppError("Only members can invite.");
  if (members.some((m) => m.userId === toUserId)) throw new AppError("Already a member.");
  const follows = await store.listFollows({ followerId: userId });
  if (!follows.some((f) => f.followingId === toUserId)) throw new AppError("You can only invite friends you follow.");
  try {
    await store.insertInvite({ kind: "squad", targetId: squadId, fromUserId: userId, toUserId, status: "pending" });
  } catch (e) {
    if (e instanceof DuplicateError) throw new AppError("Invite already sent.");
    throw e;
  }
}

export type SquadLeaderRow = { profile: Profile; weeklyXp: number; role: "owner" | "member" };
