import { LEVEL_RULES } from "@/lib/config/game";

/** XP needed to go from `level` to `level + 1`. */
export function xpForNextLevel(level: number): number {
  return LEVEL_RULES.base + (level - 1) * LEVEL_RULES.step;
}

/** Total XP required to *reach* a level (level 1 = 0 XP). */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForNextLevel(l);
  return total;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForLevel: number;
  progress: number; // 0..1
  xpToNext: number;
}

export function levelFromXp(xp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  let remaining = safeXp;
  while (level < LEVEL_RULES.maxLevel && remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
  }
  const need = xpForNextLevel(level);
  return {
    level,
    xpIntoLevel: remaining,
    xpForLevel: need,
    progress: level >= LEVEL_RULES.maxLevel ? 1 : remaining / need,
    xpToNext: Math.max(0, need - remaining),
  };
}

export function levelTitle(level: number): string {
  if (level >= 40) return "Legend";
  if (level >= 25) return "Elite";
  if (level >= 15) return "Champion";
  if (level >= 10) return "Contender";
  if (level >= 5) return "Challenger";
  return "Rookie";
}
