import { formatDate, formatNumber } from "@/lib/i18n/core";
import { getT } from "@/lib/i18n/server";
import { Crown, Trophy, UserCheck, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { LinkButton } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { followAction } from "@/lib/actions/social";
import { requireUser } from "@/lib/auth";
import { leaderboard, type LeaderboardPeriod, type LeaderboardScope } from "@/lib/services/social";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Rankings") };
}

const PERIODS: { v: LeaderboardPeriod; label: string }[] = [
  { v: "week", label: "This week" },
  { v: "month", label: "This month" },
  { v: "all", label: "All time" },
];

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ scope?: string; period?: string }> }) {
  const t = await getT();
  const me = await requireUser();
  const sp = await searchParams;
  const scope: LeaderboardScope = sp.scope === "friends" ? "friends" : "global";
  const period: LeaderboardPeriod = sp.period === "month" || sp.period === "all" ? sp.period : "week";
  const rows = await leaderboard(me.id, scope, period);
  const podium = rows.slice(0, 3);
  const href = (s: LeaderboardScope, p: LeaderboardPeriod) => `/leaderboard?scope=${s}&period=${p}`;
  const tab = (active: boolean) => cn("rounded-xl px-4 py-2 text-sm font-semibold transition", active ? "bg-white/10 text-fg" : "text-muted hover:text-fg");
  const mine = rows.find((r) => r.isMe);

  return (
    <>
      <PageHeader eyebrow={t("Rankings")} title={t("Leaderboard")} subtitle={t("XP earned from verified check-ins, streaks, completions and wins.")} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="glass inline-flex rounded-2xl p-1" aria-label={t("Scope")}>
          <Link href={href("global", period)} className={tab(scope === "global")} aria-current={scope === "global" ? "page" : undefined}>
            {t("Global")}
          </Link>
          <Link href={href("friends", period)} className={tab(scope === "friends")} aria-current={scope === "friends" ? "page" : undefined}>
            {t("Friends")}
          </Link>
        </nav>
        <nav className="glass inline-flex rounded-2xl p-1" aria-label={t("Period")}>
          {PERIODS.map((p) => (
            <Link key={p.v} href={href(scope, p.v)} className={tab(period === p.v)} aria-current={period === p.v ? "page" : undefined}>
              {t(p.label)}
            </Link>
          ))}
        </nav>
      </div>

      {rows.length <= 1 && scope === "friends" ? (
        <EmptyState icon={Users} title={t("Add friends to compete")} text={t("Follow people from the global leaderboard and they'll show up here.")} action={<LinkButton href={href("global", period)}>{t("Browse global")}</LinkButton>} />
      ) : (
        <>
          {podium.length === 3 && (
            <section className="mx-auto mb-6 grid max-w-2xl grid-cols-3 items-end gap-2 sm:gap-4" aria-label={t("Top three")}>
              {[podium[1], podium[0], podium[2]].map((r, i) => {
                const place = r.rank;
                const h = place === 1 ? "h-36 sm:h-44" : place === 2 ? "h-28 sm:h-36" : "h-24 sm:h-28";
                const tone = place === 1 ? "from-gold/30 to-gold/5 ring-gold/40" : place === 2 ? "from-zinc-300/20 to-zinc-300/5 ring-zinc-300/30" : "from-orange-500/25 to-orange-500/5 ring-orange-500/30";
                return (
                  <Link key={r.profile.id} href={r.isMe ? "/profile" : `/u/${r.profile.username}`} className="flex flex-col items-center gap-2 animate-rise" style={{ animationDelay: `${i * 90}ms` }}>
                    <div className="relative">
                      {place === 1 && <Crown className="absolute -top-6 left-1/2 h-6 w-6 -translate-x-1/2 text-gold drop-shadow-[0_0_10px_#fbbf24]" aria-hidden />}
                      <Avatar name={r.profile.displayName} color={r.profile.avatarColor} size={place === 1 ? 64 : 52} ring={r.isMe} />
                    </div>
                    <p className="max-w-full truncate text-center text-xs font-semibold sm:text-sm">{r.isMe ? t("You") : r.profile.displayName.split(" ")[0]}</p>
                    <div className={cn("flex w-full flex-col items-center justify-start rounded-t-2xl bg-gradient-to-b pt-3 ring-1", h, tone)}>
                      <span className="font-display text-2xl font-bold">{place}</span>
                      <span className="text-xs text-muted tabular-nums">{r.xp} XP</span>
                    </div>
                  </Link>
                );
              })}
            </section>
          )}
          <Card className="divide-y divide-line overflow-hidden">
            {rows.map((r) => (
              <div key={r.profile.id} className={cn("flex items-center gap-3 px-4 py-3", r.isMe && "bg-violet/[0.1]")}>
                <span className={cn("w-7 text-center font-display font-bold tabular-nums", r.rank === 1 ? "text-gold" : r.rank === 2 ? "text-zinc-300" : r.rank === 3 ? "text-orange-400" : "text-subtle")}>{r.rank}</span>
                <Link href={r.isMe ? "/profile" : `/u/${r.profile.username}`} className="flex min-w-0 flex-1 items-center gap-3 hover:underline">
                  <Avatar name={r.profile.displayName} color={r.profile.avatarColor} size={38} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {r.profile.displayName} {r.isMe && <span className="text-violet-2">(you)</span>}
                    </span>
                    <span className="block text-xs text-subtle">
                      {t("Lv {n}", { n: r.level })} · @{r.profile.username}
                    </span>
                  </span>
                </Link>
                <span className="font-display font-bold tabular-nums">{formatNumber(r.xp, t.locale)}</span>
                <span className="hidden text-xs text-subtle sm:inline">{t("XP")}</span>
                {!r.isMe && (
                  <ActionButton
                    size="icon"
                    variant={r.following ? "ghost" : "secondary"}
                    className="h-9 w-9"
                    action={followAction.bind(null, r.profile.id, !r.following)}
                    aria-label={r.following ? t("Unfollow {name}", { name: r.profile.displayName }) : t("Follow {name}", { name: r.profile.displayName })}
                    title={r.following ? t("Following — click to unfollow") : t("Follow")}
                  >
                    {r.following ? <UserCheck className="h-4 w-4 text-green-300" /> : <UserPlus className="h-4 w-4" />}
                  </ActionButton>
                )}
              </div>
            ))}
          </Card>
          {!mine && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Trophy className="h-4 w-4" aria-hidden /> {t(period === "week" ? "Earn XP this week to enter the rankings." : period === "month" ? "Earn XP this month to enter the rankings." : "Earn XP to enter the rankings.")}
            </p>
          )}
        </>
      )}
    </>
  );
}
