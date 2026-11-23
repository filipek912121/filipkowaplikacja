import type { Difficulty } from "@/lib/types";

/**
 * Central, configurable game rules. Every XP / level / streak / limit
 * decision in the app reads from here (server-side), so balancing the
 * game is a one-file change.
 */
export const XP_RULES = {
  /** Allowed XP per single daily completion, by difficulty. */
  difficultyRange: {
    easy: { min: 1, max: 3 },
    medium: { min: 4, max: 7 },
    hard: { min: 8, max: 12 },
    extreme: { min: 13, max: 20 },
  } satisfies Record<Difficulty, { min: number; max: number }>,

  /** One check-in per challenge per day — enforced in code AND by a DB unique index. */
  maxCompletionsPerChallengePerDay: 1,

  /** Hard ceiling on XP per day from check-ins, streak and completion bonuses (achievements & duel wins are one-off and excluded). */
  dailyXpCap: 60,

  /** Streak bonus: awarded once per day on the first valid check-in. */
  streakBonus: {
    startsAtDay: 3, // bonus begins on the 3rd consecutive day
    perDay: 1, // +1 XP per streak day beyond the start…
    max: 5, // …capped at +5 XP per day
  },

  /** Bonus for finishing every check-in of a multi-day challenge. */
  challengeCompletionBonusRatio: 0.5, // 50% of a single check-in, rounded, min 1
  /** Bonus to the winner of a duel. */
  duelWinBonus: 10,

  /**
   * Challenges created by users that only the creator has joined grant
   * reduced XP to stop "farm my own private challenge" abuse.
   */
  soloPrivateChallengeMultiplier: 0.5,
} as const;

/**
 * Level curve: reaching level L+1 from L costs base + (L-1) * step XP.
 * L1→2: 30, L2→3: 40, L3→4: 50 … gentle but always increasing.
 */
export const LEVEL_RULES = { base: 30, step: 10, maxLevel: 100 } as const;

export const PLAN_LIMITS = {
  free: {
    maxActiveChallenges: 3,
    maxSquadsOwned: 1,
    privateSquads: false,
    customTemplates: false,
    advancedStats: false,
    profileCustomization: false,
    maxPrivateChallenges: 1,
  },
  premium: {
    maxActiveChallenges: 15,
    maxSquadsOwned: 10,
    privateSquads: true,
    customTemplates: true,
    advancedStats: true,
    profileCustomization: true,
    maxPrivateChallenges: 50,
  },
} as const;

export const PREMIUM_PRICE = { amount: 19.99, currency: "PLN", interval: "month" } as const;

export const DURATION_OPTIONS = [
  { days: 1, label: "Daily", hint: "1 day" },
  { days: 3, label: "Sprint", hint: "3 days" },
  { days: 7, label: "Weekly", hint: "7 days" },
  { days: 14, label: "Fortnight", hint: "14 days" },
  { days: 30, label: "Monthly", hint: "30 days" },
] as const;

export const DUEL_DURATIONS = [3, 7, 14] as const;

export const LIMITS = {
  titleMin: 4,
  titleMax: 80,
  descriptionMax: 600,
  taskMax: 120,
  maxTasks: 6,
  noteMax: 400,
  proofMaxBytes: 5 * 1024 * 1024,
  proofMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
} as const;
