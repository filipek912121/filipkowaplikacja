import { getT } from "@/lib/i18n/server";
import { ChartColumn, Crown, Flame, Lock, Target, TrendingUp, Zap } from "lucide-react";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { CATEGORY_META, DIFFICULTY_META } from "@/lib/config/taxonomy";
import { getEntitlements } from "@/lib/services/entitlements";
import { advancedStats } from "@/lib/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Advanced stats") };
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SOURCE_LABEL: Record<string, string> = {
  completion: "Check-ins",
  streak_bonus: "Streak bonus",
  challenge_complete: "Finish bonus",
  duel_win: "Duel wins",
  achievement: "Achievements",
};

export default async function StatsPage() {
  const t = await getT();
  const me = await requireUser();
  const ent = await getEntitlements(me.id);
  // Server-side gate: non-premium users never receive the computed data.
  if (!ent.isPremium)
    return (
      <>
        <PageHeader eyebrow={t("Premium")} title={t("Advanced statistics")} />
        <Card glow className="relative overflow-hidden p-8 text-center">
          <div className="pointer-events-none absolute inset-0 grid grid-cols-12 items-end gap-1 px-8 pb-8 opacity-15 blur-[2px]" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="rounded-t bg-violet" style={{ height: `${20 + ((i * 37) % 70)}%` }} />
            ))}
          </div>
          <Lock className="relative mx-auto h-10 w-10 text-gold" aria-hidden />
          <h2 className="relative mt-3 font-display text-2xl font-bold">{t("Unlock your full picture")}</h2>
          <p className="relative mx-auto mt-2 max-w-md text-muted">{t("30-day XP trends, best days, category and difficulty breakdowns and success rate — included in PROOFIT Premium.")}</p>
          <LinkButton href="/premium" variant="gold" className="relative mt-6" icon={<Crown className="h-4 w-4" />}>
            {t("See Premium")}
          </LinkButton>
        </Card>
      </>
    );

  const s = await advancedStats(me.id);
  const max = Math.max(1, ...s.daily.map((d) => d.xp));
  const maxCat = Math.max(1, ...s.byCategory.map((c) => c.checkins));
  const maxWd = Math.max(1, ...s.weekday);
  const sourceTotal = Math.max(1, Object.values(s.bySource).reduce((a, b) => a + b, 0));

  return (
    <>
      <PageHeader eyebrow={t("Premium")} title={t("Advanced statistics")} subtitle={t("Your last 30 days in numbers.")} />
      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { I: Zap, k: t("XP (30 days)"), v: s.total30, c: "text-violet-2" },
          { I: Flame, k: t("Active days"), v: `${s.activeDays}/30`, c: "text-hard" },
          { I: TrendingUp, k: t("Best day"), v: `${s.bestDay.xp} XP`, c: "text-easy" },
          { I: Target, k: t("Success rate"), v: s.successRate == null ? "—" : `${Math.round(s.successRate * 100)}%`, c: "text-gold" },
        ].map(({ I, k, v, c }) => (
          <Card key={k} className="p-4">
            <I className={cn("h-5 w-5", c)} aria-hidden />
            <p className="mt-2 font-display text-2xl font-bold">{v}</p>
            <p className="text-xs text-muted">{k}</p>
          </Card>
        ))}
      </section>

      <Card className="mb-6 p-5">
        <SectionTitle title={t("Daily XP")} subtitle={t("Last 30 days")} />
        <div className="flex h-44 items-end gap-[3px]" role="img" aria-label={t("Daily XP over 30 days, best day {n} XP", { n: s.bestDay.xp })}>
          {s.daily.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div className={cn("w-full rounded-t-[4px] transition-all", d.xp ? "bg-gradient-to-t from-violet to-electric group-hover:from-violet-2" : "bg-white/[0.06]")} style={{ height: `${d.xp ? Math.max(6, (d.xp / max) * 100) : 3}%` }} />
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-3 px-2 py-1 text-[10px] ring-1 ring-line group-hover:block">
                {d.day.slice(5)} · {d.xp} XP
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-subtle">
          <span>{s.daily[0].day.slice(5)}</span>
          <span>{t("Today")}</span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle title={t("By category")} subtitle={t("Approved check-ins")} />
          <ul className="space-y-3">
            {s.byCategory.map((c) => (
              <li key={c.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Icon name={CATEGORY_META[c.category].icon} className="h-4 w-4 text-muted" /> {t(CATEGORY_META[c.category].label)}
                  </span>
                  <span className="tabular-nums text-muted">{c.checkins}</span>
                </div>
                <ProgressBar value={c.checkins / maxCat} className="h-1.5" label={t(CATEGORY_META[c.category].label)} />
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle title={t("Best weekdays")} />
          <div className="flex h-40 items-end gap-2">
            {s.weekday.map((n, i) => (
              <div key={WEEKDAYS[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] tabular-nums text-subtle">{n}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-electric/60 to-cyan/80" style={{ height: `${Math.max(4, (n / maxWd) * 85)}%` }} />
                <span className="text-xs text-muted">{t(WEEKDAYS[i])}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title={t("XP sources")} subtitle={t("Last 30 days")} />
          <ul className="space-y-3">
            {Object.entries(s.bySource).map(([k, v]) => (
              <li key={k}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{t(SOURCE_LABEL[k] ?? k)}</span>
                  <span className="tabular-nums text-muted">{v} XP</span>
                </div>
                <ProgressBar value={v / sourceTotal} tone="gold" className="h-1.5" label={t(SOURCE_LABEL[k] ?? k)} />
              </li>
            ))}
          </ul>
          <SectionTitle title={t("Completed by difficulty")} />
          <div className="grid grid-cols-4 gap-2">
            {s.byDifficulty.map((d) => (
              <div key={d.difficulty} className={cn("rounded-xl p-2 text-center ring-1", DIFFICULTY_META[d.difficulty].bg, DIFFICULTY_META[d.difficulty].ring)}>
                <p className={cn("font-display text-xl font-bold", DIFFICULTY_META[d.difficulty].text)}>{d.completed}</p>
                <p className="text-[10px] uppercase text-muted">{t(DIFFICULTY_META[d.difficulty].label)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <p className="mt-6 flex items-center gap-2 text-xs text-subtle">
        <ChartColumn className="h-4 w-4" aria-hidden />{" "}{t("Stats are computed on the server from your XP ledger.")}
      </p>
    </>
  );
}
