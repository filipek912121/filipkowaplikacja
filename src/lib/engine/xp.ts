import { XP_RULES } from "@/lib/config/game";
import type { Difficulty } from "@/lib/types";
import { addDays } from "./dates";

export function clampXpReward(difficulty: Difficulty, requested?: number | null): number {
  const { min, max } = XP_RULES.difficultyRange[difficulty];
  if (requested == null || Number.isNaN(requested)) return Math.round((min + max) / 2);
  return Math.min(max, Math.max(min, Math.round(requested)));
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string | null;
}

/** Apply "user was active on `today`" to a streak. Idempotent within a day. */
export function nextStreak(state: StreakState, today: string): StreakState & { isFirstActivityToday: boolean } {
  if (state.lastActiveDay === today) return { ...state, isFirstActivityToday: false };
  const current = state.lastActiveDay === addDays(today, -1) ? state.currentStreak + 1 : 1;
  return {
    currentStreak: current,
    longestStreak: Math.max(state.longestStreak, current),
    lastActiveDay: today,
    isFirstActivityToday: true,
  };
}

/** A streak is only "alive" if the user was active today or yesterday. */
export function liveStreak(state: StreakState, today: string): number {
  if (!state.lastActiveDay) return 0;
  if (state.lastActiveDay === today || state.lastActiveDay === addDays(today, -1)) return state.currentStreak;
  return 0;
}

export function streakBonusFor(streakDays: number): number {
  const { startsAtDay, perDay, max } = XP_RULES.streakBonus;
  if (streakDays < startsAtDay) return 0;
  return Math.min(max, (streakDays - startsAtDay + 1) * perDay);
}

export interface CheckinXpInput {
  xpReward: number;
  difficulty: Difficulty;
  soloPrivate: boolean;
  earnedToday: number;
  streakBonus: number;
}

export interface CheckinXp {
  base: number;
  streakBonus: number;
  total: number;
  capped: boolean;
}

/** Pure XP calculation for one check-in, honouring the daily cap. */
export function computeCheckinXp(input: CheckinXpInput): CheckinXp {
  let base = clampXpReward(input.difficulty, input.xpReward);
  if (input.soloPrivate) base = Math.max(1, Math.floor(base * XP_RULES.soloPrivateChallengeMultiplier));
  const room = Math.max(0, XP_RULES.dailyXpCap - input.earnedToday);
  const cappedBase = Math.min(base, room);
  const cappedBonus = Math.min(input.streakBonus, room - cappedBase);
  return {
    base: cappedBase,
    streakBonus: cappedBonus,
    total: cappedBase + cappedBonus,
    capped: cappedBase + cappedBonus < base + input.streakBonus,
  };
}

export function challengeCompletionBonus(xpReward: number): number {
  return Math.max(1, Math.round(xpReward * XP_RULES.challengeCompletionBonusRatio));
}
