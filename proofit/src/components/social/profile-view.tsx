import { getT } from "@/lib/i18n/server";
import { Calendar, CircleCheck, Crown, Flame, Lock, Settings, Target, Trophy, UserCheck, UserPlus, Zap } from "lucide-react";
import Link from "next/link";
import { ActionButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { DifficultyBadge, Pill } from "@/components/ui/badges";
import { LinkButton } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress";
import { followAction } from "@/lib/actions/social";
import { formatDate, formatNumber } from "@/lib/i18n/core";
import { levelFromXp, levelTitle } from "@/lib/engine/levels";
import type { profileOverview } from "@/lib/services/profile";

type Overview = NonNullable<Awaited<ReturnType<typeof profileOverview>>>;

export const STATUS_LABEL = { active: "Active", completed: "Completed", failed: "Failed", left: "Left" } as const;

export const TIER_STYLE = {
  bronze: "from-orange-700/30 to-orange-900/10 text-orange-300 ring-orange-500/30",
  silver: "from-zinc-300/25 to-zinc-500/10 text-zinc-200 ring-zinc-300/30",
  gold: "from-amber-300/30 to-yellow-600/10 text-gold ring-gold/40",
  legend: "from-violet/40 to-electric/20 text-violet-2 ring-violet/50",
} as const;

export async function ProfileView({ o }: { o: Overview }) {
  const t = await getT();
  const p = o.profile;
  const lv = levelFromXp(p.xp);
  const unlocked = o.achievements.filter((a) => a.unlockedAt);
  return (
    <div className="space-y-6">
      <Card glow className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-28 opacity-70" style={{ background: `linear-gradient(120deg, ${p.avatarColor}55, transparent 70%)` }} aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <Avatar name={p.displayName} color={p.avatarColor} size={88} ring={o.isPremium} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-bold">{p.displayName}</h1>
              {o.isPremium && (
                <Pill tone="gold">
                  <Crown className="h-3 w-3" aria-hidden />{" "}{t("Premium")}
                </Pill>
              )}
            </div>
            <p className="text-sm text-muted">
              @{p.username} · {t(levelTitle(lv.level))} · {t.p(o.followers, "{n} follower", "{n} followers")} · {t("{n} following", { n: o.following })}
            </p>
            {p.bio && <p className="mt-2 max-w-xl text-sm">{p.bio}</p>}
          </div>
          <div className="flex gap-2">
            {o.isSelf ? (
              <LinkButton href="/settings" variant="secondary" size="sm" icon={<Settings className="h-4 w-4" />}>
                {t("Edit profile")}
              </LinkButton>
            ) : (
              <>
                <ActionButton size="sm" variant={o.viewerFollows ? "secondary" : "primary"} action={followAction.bind(null, p.id, !o.viewerFollows)} icon={o.viewerFollows ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}>
                  {o.viewerFollows ? t("Following") : t("Follow")}
                </ActionButton>
                <LinkButton href="/duels" size="sm" variant="danger">
                  {t("Duel")}
                </LinkButton>
              </>
            )}
          </div>
        </div>
        <div className="relative mt-6">
          <div className="mb-1.5 flex justify-between text-xs text-muted">
            <span className="font-semibold text-fg">{t("Level {n}", { n: lv.level })}</span>
            <span className="tabular-nums">
              {lv.xpIntoLevel}/{lv.xpForLevel} XP
            </span>
          </div>
          <ProgressBar value={lv.progress} label={t("Level progress")} />
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label={t("Stats")}>
        {[
          { I: Zap, k: t("Total XP"), v: formatNumber(p.xp, t.locale), c: "text-violet-2" },
          { I: Flame, k: t("Streak · best"), v: `${o.streak} · ${p.longestStreak}`, c: "text-hard" },
          { I: Trophy, k: t("Completed"), v: String(o.completedCount), c: "text-gold" },
          { I: CircleCheck, k: t("Check-ins"), v: String(o.totalCheckins), c: "text-easy" },
        ].map(({ I, k, v, c }) => (
          <Card key={k} className="p-4">
            <I className={cn("h-5 w-5", c)} aria-hidden />
            <p className="mt-2 font-display text-2xl font-bold tabular-nums">{v}</p>
            <p className="text-xs text-muted">{k}</p>
          </Card>
        ))}
      </section>

      <section>
        <SectionTitle
          title={`${t("Achievements")} · ${unlocked.length}/${o.achievements.length}`}
          action={
            o.isSelf && (
              <Link href="/achievements" className="text-sm font-semibold text-violet-2 hover:underline">
                {t("View all")}
              </Link>
            )
          }
        />
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
          {o.achievements.slice(0, 10).map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex w-28 shrink-0 flex-col items-center rounded-2xl p-3 text-center ring-1 sm:w-auto",
                a.unlockedAt ? cn("bg-gradient-to-b", TIER_STYLE[a.tier]) : "bg-white/[0.02] text-subtle ring-line",
              )}
              title={t(a.description)}
            >
              {a.unlockedAt ? <Icon name={a.icon} className="h-7 w-7" /> : <Lock className="h-7 w-7 opacity-50" aria-hidden />}
              <p className="mt-2 text-xs font-semibold leading-tight">{t(a.name)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title={t("Challenge history")} />
        {o.history.length ? (
          <Card className="divide-y divide-line">
            {o.history.map(({ participation: pa, challenge: c }) => (
              <Link key={pa.id} href={`/challenges/${c.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]">
                <span className={cn("grid h-9 w-9 place-items-center rounded-xl ring-1", pa.status === "completed" ? "bg-easy/12 text-easy ring-easy/30" : "bg-white/5 text-subtle ring-line")}>
                  {pa.status === "completed" ? <CircleCheck className="h-5 w-5" aria-hidden /> : <Target className="h-5 w-5" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{t(c.title)}</span>
                  <span className="flex items-center gap-1 text-xs text-subtle">
                    <Calendar className="h-3 w-3" aria-hidden /> {formatDate(pa.joinedAt, t.locale)} · {t("{done}/{total} days", { done: pa.checkins, total: c.durationDays })} ·{" "}
                    <span>{t(STATUS_LABEL[pa.status])}</span>
                  </span>
                </span>
                <DifficultyBadge difficulty={c.difficulty} />
              </Link>
            ))}
          </Card>
        ) : (
          <EmptyState icon={Target} title={t("No finished challenges yet")} text={t("Completed and past challenges show up here.")} />
        )}
      </section>
    </div>
  );
}
