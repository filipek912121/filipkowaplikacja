import Link from "next/link";
import { Calendar, Camera, CircleCheck, Users, Zap } from "lucide-react";
import { CategoryChip, DifficultyBadge } from "@/components/ui/badges";
import { cn } from "@/components/ui/cn";
import { DIFFICULTY_META } from "@/lib/config/taxonomy";
import type { ChallengeCard as Card } from "@/lib/services/challenges";

export function durationLabel(days: number) {
  if (days === 1) return "1 day";
  if (days === 7) return "1 week";
  if (days === 30) return "30 days";
  return `${days} days`;
}

export function ChallengeCard({ c, index = 0 }: { c: Card; index?: number }) {
  const m = DIFFICULTY_META[c.difficulty];
  return (
    <Link
      href={`/challenges/${c.id}`}
      className="group glass relative flex flex-col overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:bg-white/[0.06] animate-rise"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
    >
      <span className={cn("pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40", m.dot)} aria-hidden />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={c.difficulty} />
        <CategoryChip category={c.category} />
        {c.joined && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-green-300">
            <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Joined
          </span>
        )}
      </div>
      <h3 className="font-display text-lg font-bold leading-snug tracking-tight">{c.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{c.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-xs text-muted">
        <span className={cn("inline-flex items-center gap-1 font-bold", m.text)}>
          <Zap className="h-3.5 w-3.5" aria-hidden /> {c.xpReward} XP/day
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" aria-hidden /> {durationLabel(c.durationDays)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden /> {c.participants}
        </span>
        {c.requiresProof && (
          <span className="inline-flex items-center gap-1">
            <Camera className="h-3.5 w-3.5" aria-hidden /> Proof
          </span>
        )}
        <span className="ml-auto truncate text-subtle">by {c.creatorName ?? "a member"}</span>
      </div>
    </Link>
  );
}
