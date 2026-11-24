"use client";

import { useT } from "@/lib/i18n/client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Bell,
  CirclePlus,
  Compass,
  Crown,
  House,
  LogOut,
  type LucideIcon,
  ShieldCheck,
  Swords,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import { ProgressBar } from "@/components/ui/progress";
import { BOTTOM_NAV, NAV } from "./nav-items";
import { LanguageSwitcher } from "@/components/language-switcher";

const ICONS: Record<string, LucideIcon> = { House, Compass, CirclePlus, Swords, Users, Trophy, Award, ShieldCheck, User };

export interface ShellUser {
  displayName: string;
  username: string;
  avatarColor: string;
  level: number;
  levelProgress: number;
  xp: number;
  isPremium: boolean;
  reviewCount: number;
  inviteCount: number;
}

function useActive() {
  const pathname = usePathname();
  return (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/explore" && pathname.startsWith("/challenges")) ||
    (href === "/profile" && pathname.startsWith("/settings"));
}

export function Sidebar({ user, signOut, demo }: { user: ShellUser; signOut: () => Promise<void>; demo: boolean }) {
  const t = useT();
  const isActive = useActive();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-ink/70 px-4 py-6 backdrop-blur-xl lg:flex">
      <Link href="/dashboard" className="mb-8 px-2" aria-label={t("PROOFIT home")}>
        <Logo />
      </Link>
      <nav aria-label={t("Main")} className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {NAV.map((item) => {
          const I = ICONS[item.icon];
          const active = isActive(item.href);
          const badge = item.href === "/review" ? user.reviewCount : item.href === "/dashboard" ? user.inviteCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active ? "bg-gradient-to-r from-violet/20 to-electric/5 text-fg" : "text-muted hover:bg-white/5 hover:text-fg",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-2 to-electric shadow-[0_0_12px_#8b5cf6]" />}
              <I className={cn("h-[18px] w-[18px] transition-colors", active ? "text-violet-2" : "group-hover:text-fg")} aria-hidden />
              {t(item.label)}
              {badge > 0 && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-violet px-1.5 text-[10px] font-bold text-white" aria-label={t("{n} pending", { n: badge })}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <LanguageSwitcher className="mb-3 self-start" />
      <Link
        href="/premium"
        className={cn(
          "mb-4 flex items-center gap-3 rounded-2xl p-3 text-sm transition",
          user.isPremium ? "bg-gold/10 ring-1 ring-gold/25" : "bg-gradient-to-br from-violet/25 to-electric/10 ring-1 ring-violet/30 hover:ring-violet/60",
        )}
      >
        <Crown className={cn("h-5 w-5", user.isPremium ? "text-gold" : "text-violet-2")} aria-hidden />
        <div>
          <p className="font-semibold">{user.isPremium ? t("Premium active") : t("Go Premium")}</p>
          <p className="text-xs text-muted">{user.isPremium ? t("Thanks for your support") : t("More challenges & stats")}</p>
        </div>
      </Link>

      <div className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <Avatar name={user.displayName} color={user.avatarColor} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.displayName}</p>
            <p className="text-xs text-muted">
              {t("Lv {n}", { n: user.level })} · {user.xp} XP
            </p>
          </div>
          <form action={signOut}>
            <button className="rounded-lg p-2 text-subtle transition hover:bg-white/5 hover:text-fg" aria-label={t("Log out")}>
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
        <ProgressBar value={user.levelProgress} className="mt-3 h-1.5" label={t("Level progress")} />
        {demo && <p className="mt-2 text-[10px] uppercase tracking-wider text-subtle">{t("Demo mode")}</p>}
      </div>
    </aside>
  );
}

export function MobileTopBar({ user }: { user: ShellUser }) {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-[#0b0b13]/90 px-4 backdrop-blur-xl lg:hidden">
      <Link href="/dashboard" aria-label={t("PROOFIT home")}>
        <Logo size={26} />
      </Link>
      <div className="flex items-center gap-1">
        <Link href="/duels" className="rounded-xl p-2 text-muted hover:text-fg" aria-label={t("Duels")}>
          <Swords className="h-5 w-5" />
        </Link>
        <Link href="/squads" className="rounded-xl p-2 text-muted hover:text-fg" aria-label={t("Squads")}>
          <Users className="h-5 w-5" />
        </Link>
        <Link href="/review" className="relative rounded-xl p-2 text-muted hover:text-fg" aria-label={`${t("Verify proofs")}${user.reviewCount ? `, ${t("{n} pending", { n: user.reviewCount })}` : ""}`}>
          <ShieldCheck className="h-5 w-5" />
          {user.reviewCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-2 shadow-[0_0_8px_#a78bfa]" />}
        </Link>
        <Link href="/dashboard#invites" className="relative rounded-xl p-2 text-muted hover:text-fg" aria-label={`${t("Invites")}${user.inviteCount ? `, ${t("{n} pending", { n: user.inviteCount })}` : ""}`}>
          <Bell className="h-5 w-5" />
          {user.inviteCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-extreme shadow-[0_0_8px_#ef4444]" />}
        </Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  const t = useT();
  const isActive = useActive();
  return (
    <nav aria-label={t("Primary")} className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[#0b0b13]/95 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2 pt-1.5">
        {BOTTOM_NAV.map((href) => {
          const item = NAV.find((n) => n.href === href)!;
          const I = ICONS[item.icon];
          const active = isActive(href);
          if (href === "/create")
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  aria-label={t("Create challenge")}
                  aria-current={active ? "page" : undefined}
                  className="-mt-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white shadow-[0_10px_30px_-6px_rgb(124_58_237/0.9)] ring-4 ring-ink transition active:scale-95"
                >
                  <CirclePlus className="h-6 w-6" aria-hidden />
                </Link>
              </li>
            );
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition", active ? "text-fg" : "text-subtle")}
              >
                <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-violet/20")}>
                  <I className={cn("h-5 w-5", active && "text-violet-2")} aria-hidden />
                </span>
                {t(item.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
