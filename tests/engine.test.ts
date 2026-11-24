import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { qualifyingAchievements } from "@/lib/config/achievements";
import { XP_RULES } from "@/lib/config/game";
import { addDays, diffDays, startOfMonth, startOfWeek } from "@/lib/engine/dates";
import { levelFromXp, totalXpForLevel, xpForNextLevel } from "@/lib/engine/levels";
import { planFromSubscription } from "@/lib/engine/plan";
import { screenChallengeText } from "@/lib/engine/safety";
import { clampXpReward, computeCheckinXp, liveStreak, nextStreak, streakBonusFor } from "@/lib/engine/xp";

describe("levels", () => {
  it("starts at level 1 with 0 XP", () => {
    assert.equal(levelFromXp(0).level, 1);
    assert.equal(levelFromXp(-50).level, 1);
  });
  it("uses an increasing curve", () => {
    assert.equal(xpForNextLevel(1), 30);
    assert.equal(xpForNextLevel(2), 40);
    assert.equal(totalXpForLevel(3), 70);
    assert.equal(levelFromXp(29).level, 1);
    assert.equal(levelFromXp(30).level, 2);
    assert.equal(levelFromXp(70).level, 3);
  });
  it("reports progress to next level", () => {
    const lv = levelFromXp(50);
    assert.equal(lv.level, 2);
    assert.equal(lv.xpIntoLevel, 20);
    assert.equal(lv.xpToNext, 20);
    assert.equal(lv.progress, 0.5);
  });
});

describe("xp rules", () => {
  it("clamps rewards into the difficulty band", () => {
    assert.equal(clampXpReward("easy", 50), 3);
    assert.equal(clampXpReward("extreme", 1), 13);
    assert.equal(clampXpReward("medium", null), 6);
    for (const d of ["easy", "medium", "hard", "extreme"] as const) {
      const r = XP_RULES.difficultyRange[d];
      const v = clampXpReward(d, null);
      assert.ok(v >= r.min && v <= r.max);
    }
  });
  it("streak bonus starts on day 3 and is capped", () => {
    assert.equal(streakBonusFor(1), 0);
    assert.equal(streakBonusFor(2), 0);
    assert.equal(streakBonusFor(3), 1);
    assert.equal(streakBonusFor(5), 3);
    assert.equal(streakBonusFor(100), XP_RULES.streakBonus.max);
  });
  it("never exceeds the daily cap", () => {
    const r = computeCheckinXp({ xpReward: 20, difficulty: "extreme", soloPrivate: false, earnedToday: XP_RULES.dailyXpCap - 5, streakBonus: 5 });
    assert.equal(r.total, 5);
    assert.equal(r.capped, true);
    const none = computeCheckinXp({ xpReward: 20, difficulty: "extreme", soloPrivate: false, earnedToday: XP_RULES.dailyXpCap, streakBonus: 5 });
    assert.equal(none.total, 0);
  });
  it("halves XP for solo private challenges", () => {
    const r = computeCheckinXp({ xpReward: 12, difficulty: "hard", soloPrivate: true, earnedToday: 0, streakBonus: 0 });
    assert.equal(r.base, 6);
  });
});

describe("streaks", () => {
  const today = "2026-11-23";
  it("continues, resets and is idempotent within a day", () => {
    const base = { currentStreak: 4, longestStreak: 6, lastActiveDay: "2026-11-22" };
    const next = nextStreak(base, today);
    assert.equal(next.currentStreak, 5);
    assert.equal(next.isFirstActivityToday, true);
    const again = nextStreak(next, today);
    assert.equal(again.currentStreak, 5);
    assert.equal(again.isFirstActivityToday, false);
    const broken = nextStreak({ ...base, lastActiveDay: "2026-11-20" }, today);
    assert.equal(broken.currentStreak, 1);
    assert.equal(broken.longestStreak, 6);
  });
  it("live streak expires after a missed day", () => {
    assert.equal(liveStreak({ currentStreak: 5, longestStreak: 5, lastActiveDay: "2026-11-22" }, today), 5);
    assert.equal(liveStreak({ currentStreak: 5, longestStreak: 5, lastActiveDay: "2026-11-21" }, today), 0);
  });
});

describe("dates", () => {
  it("does day arithmetic across months", () => {
    assert.equal(addDays("2026-11-30", 1), "2026-12-01");
    assert.equal(diffDays("2026-11-01", "2026-11-23"), 22);
    assert.equal(startOfWeek("2026-11-23"), "2026-11-23"); // Monday
    assert.equal(startOfWeek("2026-11-29"), "2026-11-23"); // Sunday
    assert.equal(startOfMonth("2026-11-23"), "2026-11-01");
  });
});

describe("safety screen", () => {
  it("allows the official example challenges", () => {
    for (const t of ["Walk for 10 minutes", "Read for 30 minutes", "Complete a 5 km walk", "Complete a 7-day digital detox challenge"]) assert.deepEqual(screenChallengeText(t), { ok: true });
  });
  it("blocks unsafe challenges", () => {
    const cases: [string, string][] = [
      ["No sleep for 48 hours", "sleep deprivation"],
      ["Stay awake for 30 hours", "sleep deprivation"],
      ["5 day water fast", "starvation or extreme fasting"],
      ["Run without water all day", "dehydration"],
      ["Drink 10 shots of vodka", "substance use"],
      ["Do 500 push-ups", "dangerous exercise"],
      ["Run until you pass out", "dangerous exercise"],
    ];
    for (const [text, reason] of cases) {
      const r = screenChallengeText(text);
      assert.equal(r.ok, false, text);
      if (!r.ok) assert.equal(r.reason, reason, text);
    }
  });
});

describe("plans", () => {
  const sub = { userId: "u", plan: "premium" as const, status: "active" as const, currentPeriodEnd: null, stripeCustomerId: null, stripeSubscriptionId: null };
  it("resolves premium only for active, unexpired subscriptions", () => {
    assert.equal(planFromSubscription(null), "free");
    assert.equal(planFromSubscription(sub), "premium");
    assert.equal(planFromSubscription({ ...sub, status: "past_due" }), "free");
    assert.equal(planFromSubscription({ ...sub, currentPeriodEnd: "2020-01-01T00:00:00Z" }), "free");
    assert.equal(planFromSubscription({ ...sub, plan: "free" }), "free");
  });
});

describe("achievements", () => {
  it("unlocks based on stats", () => {
    const base = { totalCheckins: 0, longestStreak: 0, challengesCompleted: 0, extremeCompleted: 0, duelsWon: 0, squads: 0, challengesCreated: 0, level: 1, approvedProofs: 0 };
    assert.deepEqual(qualifyingAchievements(base), []);
    const got = qualifyingAchievements({ ...base, totalCheckins: 1, longestStreak: 7, extremeCompleted: 1 });
    assert.deepEqual(got.sort(), ["extreme_finisher", "first_challenge", "streak_7"]);
  });
});
