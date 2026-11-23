import { Lock, Globe, Users } from "lucide-react";
import { CATEGORY_META, DIFFICULTY_META } from "@/lib/config/taxonomy";
import type { Category, Difficulty } from "@/lib/types";
import { cn } from "./cn";
import { Icon } from "./icon";

export function DifficultyBadge({ difficulty, size = "sm", className }: { difficulty: Difficulty; size?: "sm" | "md"; className?: string }) {
  const m = DIFFICULTY_META[difficulty];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider ring-1",
        m.bg,
        m.text,
        m.ring,
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} aria-hidden />
      {m.label}
    </span>
  );
}

export function CategoryChip({ category, className }: { category: Category; className?: string }) {
  const m = CATEGORY_META[category];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted ring-1 ring-line", className)}>
      <Icon name={m.icon} className="h-3.5 w-3.5" />
      {m.label}
    </span>
  );
}

export function VisibilityChip({ visibility, squad }: { visibility: "public" | "private"; squad?: boolean }) {
  const I = squad ? Users : visibility === "private" ? Lock : Globe;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted ring-1 ring-line">
      <I className="h-3.5 w-3.5" aria-hidden />
      {squad ? "Squad" : visibility === "private" ? "Private" : "Public"}
    </span>
  );
}

export function Pill({ children, className, tone = "default" }: { children: React.ReactNode; className?: string; tone?: "default" | "violet" | "gold" | "green" | "orange" | "red" | "blue" }) {
  const tones = {
    default: "bg-white/5 text-muted ring-line",
    violet: "bg-violet/15 text-violet-2 ring-violet/30",
    gold: "bg-gold/15 text-gold ring-gold/30",
    green: "bg-easy/12 text-green-300 ring-easy/30",
    orange: "bg-hard/12 text-orange-300 ring-hard/30",
    red: "bg-extreme/12 text-red-300 ring-extreme/30",
    blue: "bg-electric/12 text-blue-300 ring-electric/30",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1", tones[tone], className)}>{children}</span>;
}
