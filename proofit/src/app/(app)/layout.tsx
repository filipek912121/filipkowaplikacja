import { BottomNav, MobileTopBar, Sidebar, type ShellUser } from "@/components/layout/app-nav";
import { DemoBanner } from "@/components/layout/demo-banner";
import { signOutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { levelFromXp } from "@/lib/engine/levels";
import { reviewQueue } from "@/lib/services/challenges";
import { getEntitlements } from "@/lib/services/entitlements";
import { pendingInvites } from "@/lib/services/social";
import { getStore } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();
  const [ent, reviews, invites, duels] = await Promise.all([
    getEntitlements(profile.id),
    reviewQueue(profile.id),
    pendingInvites(profile.id),
    getStore().listDuels(profile.id),
  ]);
  const lv = levelFromXp(profile.xp);
  const user: ShellUser = {
    displayName: profile.displayName,
    username: profile.username,
    avatarColor: profile.avatarColor,
    level: lv.level,
    levelProgress: lv.progress,
    xp: profile.xp,
    isPremium: ent.isPremium,
    reviewCount: reviews.length,
    inviteCount: invites.length + duels.filter((d) => d.status === "pending" && d.opponentId === profile.id).length,
  };
  const demo = isDemoMode();
  return (
    <div className="min-h-dvh">
      <Sidebar user={user} signOut={signOutAction} demo={demo} />
      <div className="lg:pl-64">
        <MobileTopBar user={user} />
        {demo && <DemoBanner />}
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
