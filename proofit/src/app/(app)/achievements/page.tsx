import { formatDate, formatNumber } from "@/lib/i18n/core";
import { getT } from "@/lib/i18n/server";
import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { TIER_STYLE } from "@/components/social/profile-view";
import { Pill } from "@/components/ui/badges";
import { PageHeader } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { profileOverview } from "@/lib/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Achievements") };
}

export default async function AchievementsPage() {
  const t = await getT();
  const me = await requireUser();
  const o = (await profileOverview(me.id, me.id))!;
  const unlocked = o.achievements.filter((a) => a.unlockedAt).length;
  return (
    <>
      <PageHeader eyebrow={t("Achievements")} title={t("Your trophy case")} subtitle={t("{n} of {total} badges unlocked. Each one adds a one-time XP bonus.", { n: unlocked, total: o.achievements.length })} />
      <ProgressBar value={unlocked / o.achievements.length} tone="gold" className="mb-8 h-2.5" label={t("Achievements unlocked")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {o.achievements.map((a, i) => (
          <div
            key={a.id}
            className={cn(
              "relative flex items-center gap-4 overflow-hidden rounded-2xl p-5 ring-1 animate-rise",
              a.unlockedAt ? cn("bg-gradient-to-br", TIER_STYLE[a.tier]) : "glass text-subtle",
            )}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1", a.unlockedAt ? "bg-black/20 ring-white/15" : "bg-white/[0.03] ring-line")}>
              {a.unlockedAt ? <Icon name={a.icon} className="h-7 w-7" /> : <Lock className="h-6 w-6 opacity-60" aria-hidden />}
            </span>
            <div className="min-w-0">
              <p className={cn("font-display font-bold", a.unlockedAt ? "text-fg" : "text-muted")}>{t(a.name)}</p>
              <p className="text-sm text-muted">{t(a.description)}</p>
              <div className="mt-2 flex items-center gap-2">
                <Pill>{t(a.tier[0].toUpperCase() + a.tier.slice(1))}</Pill>
                <span className="text-xs text-subtle">+{a.xpBonus} XP</span>
                {a.unlockedAt && <span className="text-xs text-subtle">· {formatDate(a.unlockedAt, t.locale)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
