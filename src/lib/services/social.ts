import "server-only";
import { getStore } from "@/lib/data";
import { dayKey, startOfMonth, startOfWeek } from "@/lib/engine/dates";
import { levelFromXp } from "@/lib/engine/levels";
import type { Challenge, Invite, Profile, Squad } from "@/lib/types";
import { AppError } from "./errors";
import { joinChallenge } from "./challenges";
import { joinSquad } from "./squads";

export type LeaderboardScope = "global" | "friends";
export type LeaderboardPeriod = "week" | "month" | "all";

export interface LeaderRow {
  rank: number;
  profile: Profile;
  xp: number;
  level: number;
  isMe: boolean;
  following: boolean;
}

export async function leaderboard(userId: string, scope: LeaderboardScope, period: LeaderboardPeriod): Promise<LeaderRow[]> {
  const store = getStore();
  const today = dayKey();
  const following = (await store.listFollows({ followerId: userId })).map((f) => f.followingId);
  const userIds = scope === "friends" ? [userId, ...following] : undefined;
  const sinceDay = period === "week" ? startOfWeek(today) : period === "month" ? startOfMonth(today) : undefined;
  const totals = await store.xpTotals({ sinceDay, userIds, limit: 50 });
  const profiles = await store.listProfiles(totals.map((t) => t.userId));
  return totals
    .map((t, i) => {
      const profile = profiles.find((p) => p.id === t.userId)!;
      return {
        rank: i + 1,
        profile,
        xp: period === "all" ? profile?.xp ?? t.xp : t.xp,
        level: levelFromXp(profile?.xp ?? 0).level,
        isMe: t.userId === userId,
        following: following.includes(t.userId),
      };
    })
    .filter((r) => r.profile);
}

export async function myRank(userId: string, period: LeaderboardPeriod) {
  const rows = await leaderboard(userId, "global", period);
  return rows.find((r) => r.isMe)?.rank ?? null;
}

export async function setFollow(userId: string, targetId: string, follow: boolean) {
  if (userId === targetId) throw new AppError("You can't follow yourself.");
  const store = getStore();
  if (!(await store.getProfile(targetId))) throw new AppError("User not found.");
  if (follow) await store.insertFollow({ followerId: userId, followingId: targetId });
  else await store.deleteFollow({ followerId: userId, followingId: targetId });
}

export async function friends(userId: string): Promise<Profile[]> {
  const store = getStore();
  const ids = (await store.listFollows({ followerId: userId })).map((f) => f.followingId);
  return store.listProfiles(ids);
}

export interface InviteView {
  invite: Invite;
  from: Profile | null;
  challenge: Challenge | null;
  squad: Squad | null;
}

export async function pendingInvites(userId: string): Promise<InviteView[]> {
  const store = getStore();
  const invites = await store.listInvites({ toUserId: userId, status: "pending" });
  const from = await store.listProfiles([...new Set(invites.map((i) => i.fromUserId))]);
  return Promise.all(
    invites.map(async (invite) => ({
      invite,
      from: from.find((p) => p.id === invite.fromUserId) ?? null,
      challenge: invite.kind === "challenge" ? await store.getChallenge(invite.targetId) : null,
      squad: invite.kind === "squad" ? await store.getSquad(invite.targetId) : null,
    })),
  );
}

export async function respondToInvite(userId: string, inviteId: string, accept: boolean) {
  const store = getStore();
  const inv = await store.getInvite(inviteId);
  if (!inv || inv.toUserId !== userId || inv.status !== "pending") throw new AppError("Invite not found.");
  if (!accept) return store.updateInvite(inv.id, { status: "declined" });
  if (inv.kind === "challenge") await joinChallenge(userId, inv.targetId);
  else await joinSquad(userId, { squadId: inv.targetId });
  return store.updateInvite(inv.id, { status: "accepted" });
}
