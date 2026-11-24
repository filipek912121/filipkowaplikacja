"use client";

import { useT } from "@/lib/i18n/client";

import { Check, Crown, Lock } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { updateProfileAction } from "@/lib/actions/social";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";
import { Field, FormAlert, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

export function SettingsForm({
  profile,
  freeColors,
  premiumColors,
  isPremium,
}: {
  profile: { displayName: string; bio: string; avatarColor: string; username: string };
  freeColors: string[];
  premiumColors: string[];
  isPremium: boolean;
}) {
  const t = useT();
  const [state, action] = useActionState(updateProfileAction, null);
  const [name, setName] = useState(profile.displayName);
  const [color, setColor] = useState(profile.avatarColor);
  const toast = useToast();
  useEffect(() => {
    if (state?.ok) toast({ tone: "success", title: state.message ?? t("Saved") });
  }, [state, toast]);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={name || "?"} color={color} size={72} ring={isPremium} />
        <div>
          <p className="font-display text-lg font-bold">{name || t("Your name")}</p>
          <p className="text-sm text-muted">@{profile.username}</p>
        </div>
      </div>
      <Field label={t("Display name")} htmlFor="displayName" error={fe?.displayName}>
        <Input id="displayName" name="displayName" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} invalid={Boolean(fe?.displayName)} />
      </Field>
      <Field label={t("Bio")} htmlFor="bio" error={fe?.bio} hint={t("Up to 160 characters")}>
        <Textarea id="bio" name="bio" defaultValue={profile.bio} maxLength={160} className="min-h-20" />
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t("Avatar colour")}</legend>
        <input type="hidden" name="avatarColor" value={color} />
        <div className="flex flex-wrap gap-2">
          {[...freeColors, ...premiumColors].map((c) => {
            const locked = !isPremium && premiumColors.includes(c);
            return (
              <button
                key={c}
                type="button"
                disabled={locked}
                onClick={() => setColor(c)}
                className={cn("relative grid h-10 w-10 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-ink transition", color === c ? "ring-white" : "ring-transparent hover:ring-white/30", locked && "cursor-not-allowed opacity-40")}
                style={{ background: c }}
                aria-label={`${locked ? t("Premium colour") : t("Colour")} ${c}`}
                aria-pressed={color === c}
              >
                {color === c && <Check className="h-4 w-4 text-white" aria-hidden />}
                {locked && <Lock className="h-3.5 w-3.5 text-white" aria-hidden />}
              </button>
            );
          })}
        </div>
        {!isPremium && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
            <Crown className="h-3.5 w-3.5 text-gold" aria-hidden />{" "}{t("Extra colours and a highlighted avatar ring come with Premium.")}
          </p>
        )}
      </fieldset>
      {state && !state.ok && <FormAlert>{state.error}</FormAlert>}
      <SubmitButton pendingText={t("Saving…")}>{t("Save profile")}</SubmitButton>
    </form>
  );
}
