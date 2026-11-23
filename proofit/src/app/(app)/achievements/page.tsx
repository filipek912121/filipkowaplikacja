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

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const me = await requireUser();
  const o = (await profileOverview(me.id, me.id))!;
  const unlocked = o.achievements.filter((a) => a.unlockedAt).length;
  return (
    <>
      <PageHeader eyebrow="Achievements" title="Your trophy case" subtitle={`${unlocked} of ${o.achievements.length} badges unlocked. Each one adds a one-time XP bonus.`} />
      <ProgressBar value={unlocked / o.achievements.length} tone="gold" className="mb-8 h-2.5" label="Achievements unlocked" />
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
              <p className={cn("font-display font-bold", a.unlockedAt ? "text-fg" : "text-muted")}>{a.name}</p>
              <p className="text-sm text-muted">{a.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <Pill className="capitalize">{a.tier}</Pill>
                <span className="text-xs text-subtle">+{a.xpBonus} XP</span>
                {a.unlockedAt && <span className="text-xs text-subtle">· {new Date(a.unlockedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
