import { getT } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/i18n/core";
import { Compass, Flame, PartyPopper, Plus, Swords, Target, Trophy, Users, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActiveChallengeRow } from "@/components/challenges/active-challenge-row";
import { InvitesPanel } from "@/components/social/invites-panel";
import { Avatar } from "@/components/ui/avatar";
import { DifficultyBadge } from "@/components/ui/badges";
import { LinkButton } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { ActionButton } from "@/components/ui/action-button";
import { joinChallengeAction } from "@/lib/actions/challenges";
import { requireUser } from "@/lib/auth";
import { XP_RULES } from "@/lib/config/game";
import { appTimeZone, dayKey } from "@/lib/engine/dates";
import { levelFromXp, levelTitle } from "@/lib/engine/levels";
import { liveStreak, streakBonusFor } from "@/lib/engine/xp";
import { activeChallenges, dailyChallenge } from "@/lib/services/challenges";
import { listDuels } from "@/lib/services/duels";
import { getEntitlements } from "@/lib/services/entitlements";
import { xpEarnedOn } from "@/lib/services/progress";
import { myRank, pendingInvites } from "@/lib/services/social";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Dashboard") };
}

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: appTimeZone() }).format(new Date()));
  return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; // translated at call site
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const t = await getT();
  const me = await requireUser();
  const today = dayKey();
  const [active, daily, duels, invites, rank, earnedToday, ent] = await Promise.all([
    activeChallenges(me.id),
    dailyChallenge(me.id),
    listDuels(me.id),
    pendingInvites(me.id),
    myRank(me.id, "week"),
    xpEarnedOn(me.id, today),
    getEntitlements(me.id),
  ]);
  const { welcome } = await searchParams;
  const lv = levelFromXp(me.xp);
  const streak = liveStreak(me, today);
  const todo = active.filter((a) => !a.checkedInToday).length;
  const activeDuels = duels.filter((d) => d.duel.status === "active");
  const duelInvites = duels.filter((d) => d.duel.status === "pending" && !d.iAmChallenger);
  const nextBonus = streakBonusFor(streak + 1);

  return (
    <div className="space-y-8">
      {welcome && (
        <Card glow className="flex items-center gap-4 p-5 animate-pop">
          <PartyPopper className="h-8 w-8 shrink-0 text-violet-2" aria-hidden />
          <div>
            <p className="font-display text-lg font-bold">{t("Welcome to PROOFIT, {name}!", { name: me.displayName.split(" ")[0] })}</p>
            <p className="text-sm text-muted">{t("Join your first challenge below — your first check-in unlocks an achievement.")}</p>
          </div>
        </Card>
      )}

      <header className="animate-rise">
        <p className="text-sm text-muted">
          {t(greeting())}, <span className="text-fg">{me.displayName.split(" ")[0]}</span> 👋
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {todo > 0 ? (
            <>
              {t.p(todo, "{n} check-in", "{n} check-ins")} <span className="text-gradient">{t("left today")}</span>
            </>
          ) : active.length ? (
            <>
              {t("All done today.")}{" "}<span className="text-gradient">{t("Legend.")}</span>
            </>
          ) : (
            <>
              {t("Ready for a")}{" "}<span className="text-gradient">{t("challenge?")}</span>
            </>
          )}
        </h1>
      </header>

      {/* Stats hero */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[1.3fr_1fr_1fr]" aria-label={t("Your stats")}>
        <Card glow className="col-span-2 flex items-center gap-5 p-5 animate-rise md:col-span-1">
          <ProgressRing value={lv.progress} size={112} label={t("Level {n}, {pct}% to next", { n: lv.level, pct: Math.round(lv.progress * 100) })}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{t("Level")}</p>
              <p className="font-display text-3xl font-bold leading-none">{lv.level}</p>
            </div>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-2">{t(levelTitle(lv.level))}</p>
            <p className="mt-1 font-display text-2xl font-bold">{formatNumber(me.xp, t.locale)} XP</p>
            <p className="mt-1 text-sm text-muted">
              {t("{xp} XP to level {n}", { xp: lv.xpToNext, n: lv.level + 1 })}
            </p>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-subtle">
                <span>{t("Today")}</span>
                <span className="tabular-nums">
                  {earnedToday}/{XP_RULES.dailyXpCap} XP
                </span>
              </div>
              <ProgressBar value={earnedToday / XP_RULES.dailyXpCap} tone="gold" className="h-1.5" label={t("Daily XP")} />
            </div>
          </div>
        </Card>
        <Card className="relative overflow-hidden p-4 animate-rise [animation-delay:60ms] sm:p-5">
          <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-hard/25 blur-2xl" aria-hidden />
          <Flame className="h-7 w-7 text-hard drop-shadow-[0_0_10px_rgb(249_115_22/.8)]" aria-hidden />
          <p className="mt-2 font-display text-3xl font-bold sm:mt-3 sm:text-4xl">{streak}</p>
          <p className="text-sm text-muted">{t("day streak · best {n}", { n: me.longestStreak })}</p>
          <p className="mt-2 hidden text-xs text-subtle sm:block">{nextBonus > 0 ? t("Tomorrow's streak bonus: +{n} XP", { n: nextBonus }) : t("Bonus XP starts on day {n}", { n: XP_RULES.streakBonus.startsAtDay })}</p>
        </Card>
        <Card className="relative overflow-hidden p-4 animate-rise [animation-delay:120ms] sm:p-5">
          <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gold/20 blur-2xl" aria-hidden />
          <Trophy className="h-7 w-7 text-gold drop-shadow-[0_0_10px_rgb(251_191_36/.7)]" aria-hidden />
          <p className="mt-2 font-display text-3xl font-bold sm:mt-3 sm:text-4xl">{rank ? `#${rank}` : "—"}</p>
          <p className="text-sm text-muted">{t("weekly global rank")}</p>
          <Link href="/leaderboard" className="mt-2 inline-block text-xs font-semibold text-violet-2 hover:underline">
            {t("View rankings →")}
          </Link>
        </Card>
      </section>

      {/* Quick actions */}
      <section aria-label={t("Quick actions")} className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { href: "/create", label: "Create", I: Plus },
          { href: "/duels", label: "Duel", I: Swords },
          { href: "/squads", label: "Squads", I: Users },
          { href: "/explore", label: "Explore", I: Compass },
        ].map(({ href, label, I }) => (
          <Link key={href} href={href} className="glass group flex flex-col items-center gap-2 rounded-2xl py-4 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-violet/40 sm:text-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet/25 to-electric/15 text-violet-2 ring-1 ring-violet/25 transition group-hover:shadow-[0_0_20px_-4px_#8b5cf6]">
              <I className="h-5 w-5" aria-hidden />
            </span>
            {t(label)}
          </Link>
        ))}
      </section>

      <InvitesPanel invites={invites} duels={duelInvites} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="active-title">
          <SectionTitle
            title={`${t("Active challenges")} (${active.length}/${ent.limits.maxActiveChallenges})`}
            action={
              <Link href="/explore" className="text-sm font-semibold text-violet-2 hover:underline">
                {t("Find more")}
              </Link>
            }
          />
          {active.length ? (
            <div className="space-y-3">
              {active.map((a) => (
                <ActiveChallengeRow key={a.participation.id} a={a} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Target} title={t("No active challenges")} text={t("Pick something small to start — an easy daily challenge is perfect.")} action={<LinkButton href="/explore">{t("Explore challenges")}</LinkButton>} />
          )}
        </section>

        <div className="space-y-8">
          {daily && (
            <section aria-labelledby="daily-title">
              <SectionTitle title={t("Daily challenge")} subtitle={t("New one every day")} />
              <Card glow className="relative overflow-hidden p-5">
                <span className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-violet/30 blur-3xl animate-glow" aria-hidden />
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gold" aria-hidden />
                  <span className="text-xs font-semibold uppercase tracking-widest text-gold">{t("Today only")}</span>
                  <DifficultyBadge difficulty={daily.difficulty} className="ml-auto" />
                </div>
                <h3 className="mt-3 font-display text-xl font-bold">{t(daily.title)}</h3>
                <p className="mt-1 text-sm text-muted">{t(daily.description)}</p>
                <div className="mt-4 flex items-center gap-3">
                  {daily.joined ? (
                    <LinkButton href={`/challenges/${daily.id}#checkin`} size="sm">
                      {t("Check in")}
                    </LinkButton>
                  ) : (
                    <ActionButton size="sm" action={joinChallengeAction.bind(null, daily.id)} successTitle={t("Joined today's challenge!")}>
                      {t("Join · +{n} XP", { n: daily.xpReward })}
                    </ActionButton>
                  )}
                  <Link href={`/challenges/${daily.id}`} className="text-sm text-muted hover:text-fg">
                    {t("Details")}
                  </Link>
                  <span className="ml-auto text-xs text-subtle">{t("{n} joined", { n: daily.participants })}</span>
                </div>
              </Card>
            </section>
          )}

          <section aria-labelledby="duels-title">
            <SectionTitle
              title={t("Live duels")}
              action={
                <Link href="/duels" className="text-sm font-semibold text-violet-2 hover:underline">
                  {t("All duels")}
                </Link>
              }
            />
            {activeDuels.length ? (
              <div className="space-y-3">
                {activeDuels.slice(0, 3).map((v) => {
                  const lead = v.myScore - v.theirScore;
                  return (
                    <Link key={v.duel.id} href={`/duels/${v.duel.id}`} className="glass flex items-center gap-3 rounded-2xl p-4 transition hover:border-line-strong">
                      <Avatar name={v.opponent.displayName} color={v.opponent.avatarColor} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{t("vs {name}", { name: v.opponent.displayName })}</p>
                        <p className="truncate text-xs text-muted">{v.challenge ? t(v.challenge.title) : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold tabular-nums">
                          {v.myScore}–{v.theirScore}
                        </p>
                        <p className={lead > 0 ? "text-xs text-green-300" : lead < 0 ? "text-xs text-red-300" : "text-xs text-muted"}>{t(lead > 0 ? "Leading" : lead < 0 ? "Behind" : "Tied")}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Swords} title={t("No live duels")} text={t("Challenge a friend head-to-head.")} action={<LinkButton href="/duels" size="sm" variant="secondary">{t("Start a duel")}</LinkButton>} />
            )}
          </section>
        </div>
      </div>

    </div>
  );
}
