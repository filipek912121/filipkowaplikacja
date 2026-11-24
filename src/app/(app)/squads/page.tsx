import { getT } from "@/lib/i18n/server";
import { Lock, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateSquadForm, JoinByCodeForm } from "@/components/social/squad-forms";
import { ActionButton } from "@/components/ui/action-button";
import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { joinSquadAction } from "@/lib/actions/social";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/services/entitlements";
import { listSquadsFor } from "@/lib/services/squads";
import type { Squad } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Squads") };
}

async function SquadTile({ s, count, joinable }: { s: Squad; count: number; joinable?: boolean }) {
  const t = await getT();
  const hue = [...s.name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <div className="glass group flex flex-col rounded-2xl p-5 transition hover:border-line-strong">
      <Link href={`/squads/${s.id}`} className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl font-display text-lg font-bold text-white ring-1 ring-white/10" style={{ background: `linear-gradient(135deg, hsl(${hue} 80% 55%), hsl(${(hue + 50) % 360} 80% 45%))` }} aria-hidden>
          {s.name[0]}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 font-display font-bold group-hover:underline">
            {s.name} {s.isPrivate && <Lock className="h-3.5 w-3.5 text-muted" aria-label={t("Private")} />}
          </span>
          <span className="block text-xs text-muted">
            {t.p(count, "{n} member", "{n} members")}
          </span>
        </span>
      </Link>
      <p className="mt-3 line-clamp-2 text-sm text-muted">{s.description || t("No description yet.")}</p>
      {joinable && (
        <ActionButton size="sm" variant="secondary" className="mt-4 self-start" action={joinSquadAction.bind(null, s.id)}>
          {t("Join squad")}
        </ActionButton>
      )}
    </div>
  );
}

export default async function SquadsPage() {
  const t = await getT();
  const me = await requireUser();
  const [{ mine, discover, counts }, ent] = await Promise.all([listSquadsFor(me.id), getEntitlements(me.id)]);
  return (
    <>
      <PageHeader eyebrow={t("Squads")} title={t("Stronger together")} subtitle={t("Groups with shared challenges and weekly leaderboards.")} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section>
            <SectionTitle title={t("Your squads")} />
            {mine.length ? (
              <div className="grid gap-3 sm:grid-cols-2">{mine.map((s) => <SquadTile key={s.id} s={s} count={counts[s.id]} />)}</div>
            ) : (
              <EmptyState icon={Users} title={t("No squad yet")} text={t("Create one for your friends or join a public squad below.")} />
            )}
          </section>
          <section>
            <SectionTitle title={t("Discover")} subtitle={t("Public squads you can join")} />
            {discover.length ? (
              <div className="grid gap-3 sm:grid-cols-2">{discover.map((s) => <SquadTile key={s.id} s={s} count={counts[s.id]} joinable />)}</div>
            ) : (
              <p className="text-sm text-muted">{t("No other public squads right now.")}</p>
            )}
          </section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Card className="p-5">
            <h2 className="mb-3 font-display font-bold">{t("Have an invite code?")}</h2>
            <JoinByCodeForm />
          </Card>
          <Card glow className="p-5">
            <h2 className="mb-4 font-display text-lg font-bold">{t("Create a squad")}</h2>
            <CreateSquadForm isPremium={ent.isPremium} />
          </Card>
        </aside>
      </div>
    </>
  );
}
