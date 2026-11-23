import { ChevronRight, CircleCheck, Hourglass } from "lucide-react";
import Link from "next/link";
import { DifficultyBadge } from "@/components/ui/badges";
import { cn } from "@/components/ui/cn";
import { ProgressBar } from "@/components/ui/progress";
import type { ActiveChallenge } from "@/lib/services/challenges";

export function ActiveChallengeRow({ a }: { a: ActiveChallenge }) {
  const { challenge: c, participation: p } = a;
  return (
    <Link
      href={`/challenges/${c.id}${a.checkedInToday ? "" : "#checkin"}`}
      className="glass group flex items-center gap-4 rounded-2xl p-4 transition hover:border-line-strong hover:bg-white/[0.06]"
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1",
          a.todayStatus === "approved" ? "bg-easy/15 text-easy ring-easy/30" : a.todayStatus === "pending" ? "bg-electric/15 text-blue-300 ring-electric/30" : "bg-white/5 text-muted ring-line",
        )}
        aria-hidden
      >
        {a.todayStatus === "pending" ? <Hourglass className="h-5 w-5" /> : <CircleCheck className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{c.title}</p>
          <DifficultyBadge difficulty={c.difficulty} className="hidden sm:inline-flex" />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <ProgressBar value={p.checkins / c.durationDays} tone={c.difficulty} className="h-1.5" label={`${c.title} progress`} />
          <span className="shrink-0 text-xs tabular-nums text-muted">
            {p.checkins}/{c.durationDays}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-subtle">
          {a.todayStatus === "approved"
            ? "Done for today ✓"
            : a.todayStatus === "pending"
              ? "Proof pending verification"
              : `Day ${a.dayNumber} of ${c.durationDays} · ${a.daysLeft === 0 ? "last day!" : `${a.daysLeft} day${a.daysLeft === 1 ? "" : "s"} left`}`}
        </p>
      </div>
      {!a.checkedInToday ? (
        <span className="hidden shrink-0 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white sm:inline">Check in</span>
      ) : (
        <ChevronRight className="h-5 w-5 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden />
      )}
    </Link>
  );
}
