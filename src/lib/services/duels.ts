import "server-only";
import { XP_RULES } from "@/lib/config/game";
import { getStore } from "@/lib/data";
import { dayKey } from "@/lib/engine/dates";
import type { Challenge, Duel, Profile } from "@/lib/types";
import { canViewChallenge, joinChallenge } from "./challenges";
import { AppError } from "./errors";
import { awardXp, evaluateAchievements } from "./progress";

export interface DuelView {
  duel: Duel;
  challenge: Challenge | null;
  me: Profile;
  opponent: Profile;
  myScore: number;
  theirScore: number;
  iAmChallenger: boolean;
}

async function scores(d: Duel) {
  if (!d.startsAt) return { challenger: 0, opponent: 0 };
  const store = getStore();
  const startDay = dayKey(new Date(d.startsAt));
  const endDay = d.endsAt ? dayKey(new Date(d.endsAt)) : "9999-12-31";
  const list = await store.listCompletions({ challengeId: d.challengeId, sinceDay: startDay, status: "approved" });
  const count = (uid: string) => list.filter((c) => c.userId === uid && c.day < endDay).length;
  return { challenger: count(d.challengerId), opponent: count(d.opponentId) };
}

/** Close duels whose time is up and pay the winner. Idempotent. */
async function finalize(d: Duel): Promise<Duel> {
  if (d.status !== "active" || !d.endsAt || new Date(d.endsAt) > new Date()) return d;
  const s = await scores(d);
  const isDraw = s.challenger === s.opponent;
  const winnerId = isDraw ? null : s.challenger > s.opponent ? d.challengerId : d.opponentId;
  const updated = await getStore().updateDuel(d.id, { status: "completed", winnerId, isDraw });
  if (winnerId) {
    await awardXp({ userId: winnerId, amount: XP_RULES.duelWinBonus, reason: "duel_win", refId: d.id, day: dayKey() });
    await evaluateAchievements(winnerId);
  }
  return updated;
}

export async function listDuels(userId: string): Promise<DuelView[]> {
  const store = getStore();
  const duels = await Promise.all((await store.listDuels(userId)).map(finalize));
  const profiles = await store.listProfiles([...new Set(duels.flatMap((d) => [d.challengerId, d.opponentId]))]);
  const chs = await store.listChallenges({ ids: [...new Set(duels.map((d) => d.challengeId))] });
  return Promise.all(
    duels.map(async (duel) => {
      const s = await scores(duel);
      const iAmChallenger = duel.challengerId === userId;
      return {
        duel,
        challenge: chs.find((c) => c.id === duel.challengeId) ?? null,
        me: profiles.find((p) => p.id === userId)!,
        opponent: profiles.find((p) => p.id === (iAmChallenger ? duel.opponentId : duel.challengerId))!,
        myScore: iAmChallenger ? s.challenger : s.opponent,
        theirScore: iAmChallenger ? s.opponent : s.challenger,
        iAmChallenger,
      };
    }),
  );
}

export async function getDuelView(userId: string, duelId: string): Promise<DuelView | null> {
  return (await listDuels(userId)).find((v) => v.duel.id === duelId) ?? null;
}

export async function createDuel(userId: string, input: { opponentId: string; challengeId: string; durationDays: number }) {
  const store = getStore();
  if (input.opponentId === userId) throw new AppError("You can't duel yourself.");
  const opponent = await store.getProfile(input.opponentId);
  if (!opponent) throw new AppError("Opponent not found.");
  const ch = await store.getChallenge(input.challengeId);
  if (!ch || !(await canViewChallenge(ch, userId)) || !(await canViewChallenge(ch, opponent.id)))
    throw new AppError("Pick a challenge you can both access.");
  if (ch.durationDays < input.durationDays)
    throw new AppError("This challenge lasts {n} day(s). Pick a shorter duel or a longer challenge.", undefined, { n: ch.durationDays });
  const open = (await store.listDuels(userId)).find(
    (d) =>
      (d.status === "pending" || d.status === "active") &&
      [d.challengerId, d.opponentId].includes(opponent.id),
  );
  if (open) throw new AppError("You already have an open duel with {name}.", undefined, { name: opponent.displayName });
  return store.insertDuel({
    challengerId: userId,
    opponentId: opponent.id,
    challengeId: ch.id,
    durationDays: input.durationDays,
    status: "pending",
    startsAt: null,
    endsAt: null,
    winnerId: null,
    isDraw: false,
  });
}

async function ensureJoined(userId: string, challengeId: string) {
  const p = await getStore().getParticipation(userId, challengeId);
  if (p?.status === "active") return;
  await joinChallenge(userId, challengeId);
}

export async function respondToDuel(userId: string, duelId: string, accept: boolean) {
  const store = getStore();
  const d = await store.getDuel(duelId);
  if (!d || d.opponentId !== userId) throw new AppError("Duel not found.");
  if (d.status !== "pending") throw new AppError("This duel is no longer pending.");
  if (!accept) return store.updateDuel(d.id, { status: "declined" });
  await ensureJoined(userId, d.challengeId); // may throw slot-limit AppError — duel stays pending
  try {
    await ensureJoined(d.challengerId, d.challengeId);
  } catch {
    // Challenger has no free slot: they can still join manually; progress counts once they check in.
  }
  const startsAt = new Date();
  return store.updateDuel(d.id, {
    status: "active",
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + d.durationDays * 86_400_000).toISOString(),
  });
}

export async function cancelDuel(userId: string, duelId: string) {
  const store = getStore();
  const d = await store.getDuel(duelId);
  if (!d || d.challengerId !== userId || d.status !== "pending") throw new AppError("Only pending duels you created can be cancelled.");
  return store.updateDuel(d.id, { status: "cancelled" });
}
