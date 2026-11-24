import type { Category, Difficulty } from "@/lib/types";
import { XP_RULES } from "./game";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "extreme"];

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; blurb: string; text: string; bg: string; ring: string; dot: string; glow: string }
> = {
  easy: {
    label: "Easy",
    blurb: "Beginner-friendly",
    text: "text-easy",
    bg: "bg-easy/12",
    ring: "ring-easy/35",
    dot: "bg-easy",
    glow: "shadow-[0_0_24px_-6px_var(--color-easy)]",
  },
  medium: {
    label: "Medium",
    blurb: "Moderate effort",
    text: "text-medium",
    bg: "bg-medium/12",
    ring: "ring-medium/35",
    dot: "bg-medium",
    glow: "shadow-[0_0_24px_-6px_var(--color-medium)]",
  },
  hard: {
    label: "Hard",
    blurb: "Serious commitment",
    text: "text-hard",
    bg: "bg-hard/12",
    ring: "ring-hard/35",
    dot: "bg-hard",
    glow: "shadow-[0_0_24px_-6px_var(--color-hard)]",
  },
  extreme: {
    label: "Extreme",
    blurb: "Advanced — but always safe",
    text: "text-extreme",
    bg: "bg-extreme/12",
    ring: "ring-extreme/35",
    dot: "bg-extreme",
    glow: "shadow-[0_0_24px_-6px_var(--color-extreme)]",
  },
};

export function xpRangeLabel(d: Difficulty) {
  const r = XP_RULES.difficultyRange[d];
  return `${r.min}–${r.max} XP`;
}

export const CATEGORIES: Category[] = [
  "fitness",
  "productivity",
  "discipline",
  "lifestyle",
  "learning",
  "money",
  "social",
];

export const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  fitness: { label: "Fitness", icon: "Dumbbell" },
  productivity: { label: "Productivity", icon: "Target" },
  discipline: { label: "Discipline", icon: "ShieldCheck" },
  lifestyle: { label: "Lifestyle", icon: "Leaf" },
  learning: { label: "Learning", icon: "BookOpen" },
  money: { label: "Money habits", icon: "Wallet" },
  social: { label: "Social", icon: "HeartHandshake" },
};

export function isDifficulty(v: unknown): v is Difficulty {
  return typeof v === "string" && (DIFFICULTIES as string[]).includes(v);
}
export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as string[]).includes(v);
}
