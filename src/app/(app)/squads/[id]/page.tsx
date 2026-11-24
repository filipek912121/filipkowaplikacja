import { getT } from "@/lib/i18n/server";
import { ArrowLeft, Crown, Lock, Plus, Target, Trophy, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { CopyCode } from "@/components/social/squad-forms";
import { ActionButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { LinkButton } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { inviteToSquadAction, joinSquadAction, leaveSquadAction } from "@/lib/actions/social";
import { requireUser } from "@/lib/auth";
import { levelFromXp } from "@/lib/engine/levels";
import { squadDetail } from "@/lib/services/squads";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Squad") };
}

export default async function SquadPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const me = await requireUser();
  const { id } = await params;
  const d = await squadDetail(me.id, id.slice(0, 64));
  if (!d) notFound();
  const s = d.squad;
  return (
    <div className="space-y-6">
      <Link href="/squads" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" aria-hidden />{" "}{t("Squads")}
      </Link>
      <Card glow className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-2">
            {t("Squad")} {s.isPrivate && <Lock className="h-3.5 w-3.5" aria-label={t("Private")} />}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold">{s.name}</h1>
          <p className="mt-1 text-muted">{s.description}</p>
          <p className="mt-2 text-sm text-subtle">{t.p(d.leaderboard.length, "{n} member", "{n} members")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {d.isMember ? (
            <>
              <CopyCode code={s.inviteCode} />
              <LinkButton href={`/create?squad=${s.id}`} size="sm" icon={<Plus className="h-4 w-4" />}>
                {t("Squad challenge")}
              </LinkButton>
              {!d.isOwner && (
                <ActionButton size="sm" variant="ghost" action={leaveSquadAction.bind(null, s.id)} confirm={t("Leave {name}?", { name: s.name })}>
                  {t("Leave")}
                </ActionButton>
              )}
            </>
          ) : (
            <ActionButton action={joinSquadAction.bind(null, s.id)}>{t("Join squad")}</ActionButton>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section>
          <SectionTitle title={t("Weekly leaderboard")} subtitle={t("XP earned since Monday")} />
          <Card className="divide-y divide-line">
            {d.leaderboard.map((r, i) => (
              <Link key={r.profile.id} href={r.profile.id === me.id ? "/profile" : `/u/${r.profile.username}`} className={cn("flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]", r.profile.id === me.id && "bg-violet/[0.08]")}>
                <span className={cn("w-6 text-center font-display font-bold tabular-nums", i === 0 ? "text-gold" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-subtle")}>{i + 1}</span>
                <Avatar name={r.profile.displayName} color={r.profile.avatarColor} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {r.profile.displayName}
                    {r.role === "owner" && <Crown className="h-3.5 w-3.5 text-gold" aria-label={t("Owner")} />}
                  </span>
                  <span className="block text-xs text-subtle">{t("Level {n}", { n: levelFromXp(r.profile.xp).level })}</span>
                </span>
                <span className="font-display font-bold tabular-nums">{r.weeklyXp} XP</span>
                {i === 0 && r.weeklyXp > 0 && <Trophy className="h-4 w-4 text-gold" aria-hidden />}
              </Link>
            ))}
          </Card>
          {d.isMember && d.invitable.length > 0 && (
            <Card className="mt-4 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <UserPlus className="h-4 w-4 text-muted" aria-hidden />{" "}{t("Invite friends")}
              </p>
              <ul className="space-y-1">
                {d.invitable.slice(0, 6).map((f) => (
                  <li key={f.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                    <Avatar name={f.displayName} color={f.avatarColor} size={30} />
                    <span className="flex-1 truncate text-sm">{f.displayName}</span>
                    <ActionButton size="sm" variant="secondary" action={inviteToSquadAction.bind(null, s.id, f.id)}>
                      {t("Invite")}
                    </ActionButton>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
        <section>
          <SectionTitle title={t("Squad challenges")} />
          {!d.isMember ? (
            <EmptyState icon={Lock} title={t("Members only")} text={t("Join the squad to see and join its challenges.")} />
          ) : d.challenges.length ? (
            <div className="grid gap-3">{d.challenges.map((c) => <ChallengeCard key={c.id} c={c} />)}</div>
          ) : (
            <EmptyState icon={Target} title={t("No squad challenges yet")} text={t("Create one — only members can see it.")} action={<LinkButton href={`/create?squad=${s.id}`} size="sm">{t("Create squad challenge")}</LinkButton>} />
          )}
        </section>
      </div>
    </div>
  );
}
