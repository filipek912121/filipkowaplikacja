import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
import { Card, PageHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/services/entitlements";
import { FREE_AVATAR_COLORS, PREMIUM_AVATAR_COLORS } from "@/lib/services/profile";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireUser();
  const ent = await getEntitlements(me.id);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Settings" title="Edit profile" subtitle="Your XP, level and plan can't be edited — they're earned." />
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
