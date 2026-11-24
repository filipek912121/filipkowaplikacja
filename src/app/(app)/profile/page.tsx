import { getT } from "@/lib/i18n/server";
import { ChartColumn, Crown, LogOut } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/social/profile-view";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button, LinkButton } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { profileOverview } from "@/lib/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Profile") };
}

export default async function ProfilePage() {
  const t = await getT();
  const me = await requireUser();
  const o = await profileOverview(me.id, me.id);
  if (!o) notFound();
  return (
    <>
      <ProfileView o={o} />
      <div className="mt-6 flex flex-wrap gap-2">
        <LinkButton href="/stats" variant="secondary" icon={o.isPremium ? <ChartColumn className="h-4 w-4" /> : <Crown className="h-4 w-4 text-gold" />}>
          {t("Advanced stats")}
        </LinkButton>
        <LinkButton href="/premium" variant="secondary" icon={<Crown className="h-4 w-4 text-gold" />}>
          {o.isPremium ? t("Manage Premium") : t("Go Premium")}
        </LinkButton>
        <LanguageSwitcher className="lg:hidden" />
        <form action={signOutAction} className="lg:hidden">
          <Button variant="ghost" icon={<LogOut className="h-4 w-4" />}>
            {t("Log out")}
          </Button>
        </form>
      </div>
    </>
  );
}
