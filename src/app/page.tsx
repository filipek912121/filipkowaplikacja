import { getT } from "@/lib/i18n/server";
import { ArrowRight, Camera, Crown, Flame, ShieldCheck, Swords, Trophy, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { DifficultyBadge } from "@/components/ui/badges";
import { Button, LinkButton } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { enterDemoAction } from "@/lib/actions/auth";
import { getSessionUserId } from "@/lib/auth";
import { PLAN_LIMITS, PREMIUM_PRICE } from "@/lib/config/game";
import { DIFFICULTIES, DIFFICULTY_META, xpRangeLabel } from "@/lib/config/taxonomy";
import { isDemoMode } from "@/lib/env";

const EXAMPLES = {
  easy: "Walk for 10 minutes",
  medium: "Read for 30 minutes",
  hard: "Complete a 5 km walk",
  extreme: "7-day digital detox",
} as const;

export default async function Landing() {
  const t = await getT();
  const signedIn = Boolean(await getSessionUserId());
  const demo = isDemoMode();
  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2" aria-label={t("Account")}>
          <LanguageSwitcher className="hidden sm:inline-flex" />
          {signedIn ? (
            <LinkButton href="/dashboard" size="sm">
              {t("Open app")}
            </LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                {t("Log in")}
              </LinkButton>
              <LinkButton href="/signup" size="sm">
                {t("Sign up")}
              </LinkButton>
            </>
          )}
        </nav>
      </header>

      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div className="animate-rise">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-2 ring-1 ring-violet/30">
              <Flame className="h-3.5 w-3.5" aria-hidden />{" "}{t("The social challenge platform")}
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              {t("Challenge.")}
              <br />
              {t("Compete.")}
              <br />
              <span className="text-gradient">{t("Win.")}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted">
              {t("Daily, weekly and monthly challenges with friends. Prove your progress, earn XP, climb the ranks — and build habits that actually stick.")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {signedIn ? (
                <LinkButton href="/dashboard" size="lg" icon={<ArrowRight className="h-5 w-5" />}>
                  {t("Continue your streak")}
                </LinkButton>
              ) : demo ? (
                <form action={enterDemoAction}>
                  <Button size="lg" icon={<Zap className="h-5 w-5" />}>
                    {t("Try the live demo")}
                  </Button>
                </form>
              ) : (
                <LinkButton href="/signup" size="lg" icon={<ArrowRight className="h-5 w-5" />}>
                  {t("Start for free")}
                </LinkButton>
              )}
              <LinkButton href={signedIn ? "/explore" : "/signup"} variant="secondary" size="lg">
                {signedIn ? t("Browse challenges") : t("Create account")}
              </LinkButton>
            </div>
            <p className="mt-4 text-xs text-subtle">{t("Free forever plan · No credit card required")}</p>
          </div>

          {/* Product preview */}
          <div className="relative animate-rise [animation-delay:120ms]">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-tr from-violet/30 via-indigo-500/10 to-electric/25 blur-3xl animate-glow" aria-hidden />
            <div className="glass-strong neon-border relative rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">{t("Level 12 · Contender")}</p>
                  <p className="font-display text-2xl font-bold">{t("Welcome back, Maja")}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-hard/15 px-3 py-1.5 text-sm font-bold text-orange-300">
                  <Flame className="h-4 w-4" aria-hidden /> 23
                </span>
              </div>
              <ProgressBar value={0.68} className="mt-4" label={t("Level progress example")} />
              <div className="mt-5 space-y-3">
                {DIFFICULTIES.map((d, i) => (
                  <div key={d} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-line" style={{ animationDelay: `${200 + i * 80}ms` }}>
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${DIFFICULTY_META[d].bg} ${DIFFICULTY_META[d].text}`}>
                      <Zap className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t(EXAMPLES[d])}</p>
                      <p className="text-xs text-muted">{t("{range} per check-in", { range: xpRangeLabel(d) })}</p>
                    </div>
                    <DifficultyBadge difficulty={d} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby="features">
          <h2 id="features" className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("Built for people who")}{" "}<span className="text-gradient">{t("finish")}</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { I: Swords, title: "1v1 Duels", d: "Challenge a friend, pick a duration, and see who checks in more." },
              { I: Users, title: "Squads", d: "Private or public groups with their own challenges and weekly leaderboards." },
              { I: Camera, title: "Proof uploads", d: "Photos, links or write-ups — reviewed by real people before XP lands." },
              { I: Trophy, title: "Fair XP", d: "One check-in per challenge per day, a daily cap, and streak bonuses that can't be farmed." },
            ].map(({ I, title, d }, i) => (
              <div key={title} className="glass rounded-2xl p-6 transition hover:-translate-y-1 hover:border-line-strong animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet/30 to-electric/20 text-violet-2 ring-1 ring-violet/30">
                  <I className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="font-display text-lg font-bold">{t(title)}</h3>
                <p className="mt-1.5 text-sm text-muted">{t(d)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby="safety">
          <div className="glass flex flex-col items-start gap-6 rounded-3xl p-8 sm:flex-row sm:items-center">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-easy/12 text-easy ring-1 ring-easy/30">
              <ShieldCheck className="h-7 w-7" aria-hidden />
            </span>
            <div>
              <h2 id="safety" className="font-display text-2xl font-bold">
                {t("Hard, never harmful")}
              </h2>
              <p className="mt-1 max-w-2xl text-muted">
                {t("Even Extreme challenges stay safe. PROOFIT blocks challenges that promote dangerous exercise, sleep deprivation, starvation, dehydration, substance use or self-harm.")}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-16" aria-labelledby="pricing">
          <h2 id="pricing" className="text-center font-display text-3xl font-bold tracking-tight">
            {t("Simple pricing")}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="glass rounded-3xl p-7">
              <p className="font-display text-xl font-bold">{t("Free")}</p>
              <p className="mt-1 font-display text-4xl font-bold">{t("0 PLN")}</p>
              <ul className="mt-5 space-y-2 text-sm text-muted">
                <li>{t("Up to {n} active challenges", { n: PLAN_LIMITS.free.maxActiveChallenges })}</li>
                <li>{t("Duels, squads & leaderboards")}</li>
                <li>{t("Achievements & streaks")}</li>
              </ul>
            </div>
            <div className="glass neon-border relative rounded-3xl p-7">
              <p className="flex items-center gap-2 font-display text-xl font-bold">
                <Crown className="h-5 w-5 text-gold" aria-hidden />{" "}{t("Premium")}
              </p>
              <p className="mt-1 font-display text-4xl font-bold">
                {PREMIUM_PRICE.amount.toFixed(2).replace(".", ",")} <span className="text-lg text-muted">{t("PLN / month")}</span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-muted">
                <li>{t("Up to {n} active challenges", { n: PLAN_LIMITS.premium.maxActiveChallenges })}</li>
                <li>{t("Advanced statistics")}</li>
                <li>{t("Private squads & custom templates")}</li>
                <li>{t("Extra profile customization")}</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-line px-5 py-8 text-sm text-subtle sm:flex-row">
        <Logo size={22} />
        <LanguageSwitcher />
        <p>© {new Date().getFullYear()} PROOFIT · Challenge. Compete. Win.</p>
        <Link href={signedIn ? "/dashboard" : "/login"} className="hover:text-fg">
          {signedIn ? t("Dashboard") : t("Log in")}
        </Link>
      </footer>
    </div>
  );
}
