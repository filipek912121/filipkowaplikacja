import type { Achievement } from "@/lib/types";

/** Catalogue of unlockable badges. Mirrored into the `achievements` table by the seed migration. */
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_challenge", name: "First Challenge", description: "Log your very first check-in.", icon: "Rocket", tier: "bronze", xpBonus: 2, premiumOnly: false },
  { id: "streak_7", name: "7-Day Streak", description: "Stay active 7 days in a row.", icon: "Flame", tier: "silver", xpBonus: 5, premiumOnly: false },
  { id: "streak_30", name: "30-Day Streak", description: "Stay active 30 days in a row.", icon: "Flame", tier: "gold", xpBonus: 15, premiumOnly: false },
  { id: "challenge_master", name: "Challenge Master", description: "Fully complete 10 challenges.", icon: "Crown", tier: "gold", xpBonus: 15, premiumOnly: false },
  { id: "duel_winner", name: "Duel Winner", description: "Win your first duel.", icon: "Swords", tier: "silver", xpBonus: 5, premiumOnly: false },
  { id: "extreme_finisher", name: "Extreme Finisher", description: "Fully complete an Extreme challenge.", icon: "Mountain", tier: "legend", xpBonus: 20, premiumOnly: false },
  { id: "squad_up", name: "Squad Up", description: "Join or create a squad.", icon: "Users", tier: "bronze", xpBonus: 2, premiumOnly: false },
  { id: "creator", name: "Architect", description: "Create your first challenge.", icon: "Sparkles", tier: "bronze", xpBonus: 2, premiumOnly: false },
  { id: "level_10", name: "Double Digits", description: "Reach level 10.", icon: "Star", tier: "silver", xpBonus: 5, premiumOnly: false },
  { id: "proof_pro", name: "Proof Pro", description: "Get 5 proofs approved.", icon: "ShieldCheck", tier: "silver", xpBonus: 5, premiumOnly: false },
];

export interface AchievementStats {
  totalCheckins: number;
  longestStreak: number;
  challengesCompleted: number;
  extremeCompleted: number;
  duelsWon: number;
  squads: number;
  challengesCreated: number;
  level: number;
  approvedProofs: number;
}

export function qualifyingAchievements(s: AchievementStats): string[] {
  const out: string[] = [];
  if (s.totalCheckins >= 1) out.push("first_challenge");
  if (s.longestStreak >= 7) out.push("streak_7");
  if (s.longestStreak >= 30) out.push("streak_30");
  if (s.challengesCompleted >= 10) out.push("challenge_master");
  if (s.duelsWon >= 1) out.push("duel_winner");
  if (s.extremeCompleted >= 1) out.push("extreme_finisher");
  if (s.squads >= 1) out.push("squad_up");
  if (s.challengesCreated >= 1) out.push("creator");
  if (s.level >= 10) out.push("level_10");
  if (s.approvedProofs >= 5) out.push("proof_pro");
  return out;
}
