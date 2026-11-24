import { getT } from "@/lib/i18n/server";
import { ArrowLeft, Calendar, Camera, CircleCheck, Crown, PartyPopper, ShieldCheck, Swords, Users, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { durationLabel } from "@/components/challenges/challenge-card";
import { STATUS_LABEL } from "@/components/social/profile-view";
import { CheckInForm } from "@/components/challenges/check-in-form";
import { ActionButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { CategoryChip, DifficultyBadge, Pill, VisibilityChip } from "@/components/ui/badges";
import { LinkButton } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { ProgressBar } from "@/components/ui/progress";
import { joinChallengeAction, leaveChallengeAction } from "@/lib/actions/challenges";
import { requireUser } from "@/lib/auth";
import { DIFFICULTY_META } from "@/lib/config/taxonomy";
import { addDays, dayKey } from "@/lib/engine/dates";
import { challengeDetail } from "@/lib/services/challenges";
import { getStore } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ch = await getStore().getChallenge(id.slice(0, 64));
  const t = await getT();
  return { title: ch && ch.visibility === "public" ? t(ch.title) : t("Challenge") };
}

export default async function ChallengePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const t = await getT();
  const me = await requireUser();
  const { id } = await params;
  const { created } = await searchParams;
  const d = await challengeDetail(id.slice(0, 64), me.id);
  if (!d) notFound();
  const c = d.challenge;
  const p = d.participation;
  const m = DIFFICULTY_META[c.difficulty];
  const today = dayKey();
  const days = d.window ? Array.from({ length: c.durationDays }, (_, i) => addDays(d.window!.startDay, i)) : [];
  const byDay = new Map(d.myCompletions.filter((x) => x.status !== "rejected").map((x) => [x.day, x.status]));
  const isActive = p?.status === "active";

  return (
    <div className="space-y-6">
      <Link href="/explore" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" aria-hidden />{" "}{t("Explore")}
      </Link>

      {created && (
        <Card glow className="flex items-center gap-3 p-4 animate-pop" role="status">
          <PartyPopper className="h-6 w-6 text-violet-2" aria-hidden />
          <p className="text-sm">
            <span className="font-semibold">{t("Challenge launched!")}</span> {c.isTemplate ? t("Saved as a template — use it from the Create page.") : t("Share it with friends or start a duel on it.")}
          </p>
        </Card>
      )}

      <section className="glass neon-border relative overflow-hidden rounded-3xl p-6 sm:p-8 animate-rise">
        <span className={cn("pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-25 blur-3xl", m.dot)} aria-hidden />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={c.difficulty} size="md" />
            <CategoryChip category={c.category} />
            <VisibilityChip visibility={c.visibility} squad={Boolean(c.squadId)} />
            {c.isTemplate && <Pill tone="gold">{t("Template")}</Pill>}
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t(c.title)}</h1>
          <p className="mt-3 max-w-2xl text-muted">{t(c.description)}</p>
          <p className="mt-3 text-sm text-subtle">
            {t("Created by")}{" "}<span className="text-fg">{c.creatorName ?? t("a member")}</span>
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { I: Zap, k: t("XP per day"), v: `${c.xpReward} XP`, cls: m.text },
              { I: Calendar, k: t("Duration"), v: durationLabel(c.durationDays, t) },
              { I: Users, k: t("Participants"), v: String(c.participants) },
              { I: c.requiresProof ? Camera : CircleCheck, k: t("Verification"), v: c.requiresProof ? t("Proof required") : t("Self check-in") },
            ].map(({ I, k, v, cls }) => (
              <div key={k} className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-line">
                <dt className="flex items-center gap-1.5 text-xs text-muted">
                  <I className="h-3.5 w-3.5" aria-hidden /> {k}
                </dt>
                <dd className={cn("mt-1 font-display text-lg font-bold", cls)}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6" id="checkin">
            {isActive && d.window ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold">{t("Today's check-in")}</h2>
                  <span className="text-sm text-muted tabular-nums">
                    {t("{done}/{total} done", { done: p!.checkins, total: c.durationDays })}
                  </span>
                </div>
                <ProgressBar value={p!.checkins / c.durationDays} tone={c.difficulty} label={t("Challenge progress")} />
                <ol className="my-5 flex flex-wrap gap-1.5" aria-label={t("Daily progress")}>
                  {days.map((day, i) => {
                    const st = byDay.get(day);
                    const isToday = day === today;
                    const past = day < today;
                    return (
                      <li
                        key={day}
                        title={`${t("Day {n}", { n: i + 1 })} · ${day}`}
                        aria-label={`${t("Day {n}", { n: i + 1 })}: ${t(st === "approved" ? "done" : st === "pending" ? "pending" : past ? "missed" : isToday ? "today" : "upcoming")}`}
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg text-[11px] font-bold ring-1",
                          st === "approved" && cn(m.dot, "text-black ring-transparent"),
                          st === "pending" && "bg-electric/20 text-blue-200 ring-electric/40",
                          !st && past && "bg-extreme/10 text-red-300/70 ring-extreme/25",
                          !st && isToday && "text-fg ring-2 ring-violet-2",
                          !st && !past && !isToday && "text-subtle ring-line",
                        )}
                      >
                        {i + 1}
                      </li>
                    );
                  })}
                </ol>
                {d.canCheckIn || d.todayCompletion ? (
                  <CheckInForm
                    challengeId={c.id}
                    tasks={c.tasks}
                    requiresProof={c.requiresProof}
                    today={d.todayCompletion && d.todayCompletion.status !== "rejected" ? { status: d.todayCompletion.status, xp: d.todayCompletion.xpAwarded } : null}
                  />
                ) : (
                  <p className="text-sm text-muted">{t("Check-ins are closed for this window.")}</p>
                )}
              </>
            ) : (
              <div className="text-center">
                {p?.status === "completed" ? (
                  <>
                    <CircleCheck className="mx-auto mb-2 h-10 w-10 text-easy" aria-hidden />
                    <h2 className="font-display text-xl font-bold">{t("You completed this challenge!")}</h2>
                    <p className="mt-1 text-sm text-muted">{t("Run it again to keep the habit going.")}</p>
                  </>
                ) : p?.status === "failed" ? (
                  <>
                    <h2 className="font-display text-xl font-bold">{t("This run ended")}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {t("You checked in {done} of {total} days. Every attempt counts — try again.", { done: p.checkins, total: c.durationDays })}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-xl font-bold">{c.isTemplate ? t("This is a template") : t("Ready to commit?")}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {c.isTemplate ? t("Templates can't be joined. Create a live challenge from it.") : t("Check in once a day for {duration}. Starts today.", { duration: durationLabel(c.durationDays, t) })}
                    </p>
                  </>
                )}
                <div className="mt-5 flex flex-col items-center gap-2">
                  {c.isTemplate ? (
                    <LinkButton href={`/create?template=${c.id}`}>{t("Use template")}</LinkButton>
                  ) : d.slotsLeft > 0 ? (
                    <ActionButton size="lg" action={joinChallengeAction.bind(null, c.id)} successTitle={t("Challenge joined!")} icon={<Zap className="h-5 w-5" />}>
                      {p ? t("Start again") : t("Join challenge")}
                    </ActionButton>
                  ) : (
                    <>
                      <p className="text-sm text-orange-300">{t("You've hit your active challenge limit.")}</p>
                      {d.plan === "free" && (
                        <LinkButton href="/premium" variant="gold" icon={<Crown className="h-4 w-4" />}>
                          {t("Upgrade for more slots")}
                        </LinkButton>
                      )}
                    </>
                  )}
                  {!c.isTemplate && d.slotsLeft > 0 && <p className="text-xs text-subtle">{t.p(d.slotsLeft, "{n} free slot on your {plan} plan", "{n} free slots on your {plan} plan", { plan: d.plan === "premium" ? "Premium" : t("Free") })}</p>}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionTitle title={t("Daily tasks")} />
            <ul className="space-y-2">
              {c.tasks.map((task, i) => (
                <li key={task} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 text-sm ring-1 ring-line">
                  <span className={cn("grid h-6 w-6 place-items-center rounded-md text-xs font-bold", m.bg, m.text)}>{i + 1}</span>
                  {t(task)}
                </li>
              ))}
            </ul>
            {c.requiresProof && (
              <p className="mt-4 flex items-start gap-2 text-xs text-subtle">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Proof is reviewed by the creator{c.isOfficial ? " or verified finishers" : ""}. XP is only awarded after approval.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {!c.isTemplate && (
            <Card className="space-y-2 p-5">
              <LinkButton href={`/duels?challenge=${c.id}`} variant="secondary" className="w-full" icon={<Swords className="h-4 w-4" />}>
                {t("Duel a friend on this")}
              </LinkButton>
              {d.isCreator && c.requiresProof && (
                <LinkButton href="/review" variant="secondary" className="w-full" icon={<ShieldCheck className="h-4 w-4" />}>
                  {t("Review submitted proofs")}
                </LinkButton>
              )}
              {isActive && (
                <ActionButton variant="ghost" className="w-full" action={leaveChallengeAction.bind(null, c.id)} confirm={t("Leave this challenge? Your current run will end.")}>
                  {t("Leave challenge")}
                </ActionButton>
              )}
            </Card>
          )}
          <Card className="p-5">
            <SectionTitle title={t("Participants")} subtitle={t("{n} in total", { n: c.participants })} />
            {d.roster.length ? (
              <ul className="space-y-1">
                {d.roster.map((r) => (
                  <li key={r.profile.id}>
                    <Link href={r.profile.id === me.id ? "/profile" : `/u/${r.profile.username}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
                      <Avatar name={r.profile.displayName} color={r.profile.avatarColor} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {r.profile.displayName} {r.profile.id === me.id && <span className="text-subtle">{t("(you)")}</span>}
                        </span>
                        <span className="block text-xs text-subtle">{t(STATUS_LABEL[r.participation.status])}</span>
                      </span>
                      <span className="text-sm tabular-nums text-muted">{r.participation.checkins} ✓</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t("Nobody yet — be the first.")}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
