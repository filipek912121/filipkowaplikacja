import { getT } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Card, PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/services/entitlements";
import { FREE_AVATAR_COLORS, PREMIUM_AVATAR_COLORS } from "@/lib/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Settings") };
}

export default async function SettingsPage() {
  const t = await getT();
  const me = await requireUser();
  const ent = await getEntitlements(me.id);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow={t("Settings")} title={t("Edit profile")} subtitle={t("Your XP, level and plan can't be edited — they're earned.")} />
      <Card className="mb-4 flex items-center justify-between gap-3 p-5">
        <p className="text-sm font-medium">{t("Language")}</p>
        <LanguageSwitcher />
      </Card>
      <Card className="p-6">
        <SettingsForm
          profile={{ displayName: me.displayName, bio: me.bio, avatarColor: me.avatarColor, username: me.username }}
          freeColors={FREE_AVATAR_COLORS}
          premiumColors={PREMIUM_AVATAR_COLORS}
          isPremium={ent.isPremium}
        />
      </Card>
    </div>
  );
}
