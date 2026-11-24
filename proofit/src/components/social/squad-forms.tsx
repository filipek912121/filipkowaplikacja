"use client";

import { useT } from "@/lib/i18n/client";

import { Copy, Crown, KeyRound, Lock, Users } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { createSquadAction, joinSquadByCodeAction } from "@/lib/actions/social";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";

export function CreateSquadForm({ isPremium }: { isPremium: boolean }) {
  const t = useT();
  const [state, action] = useActionState(createSquadAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4">
      <Field label={t("Squad name")} htmlFor="name" error={fe?.name}>
        <Input id="name" name="name" required minLength={3} maxLength={40} placeholder={t("e.g. Morning Wolves")} invalid={Boolean(fe?.name)} />
      </Field>
      <Field label={t("Description")} htmlFor="sq-desc" error={fe?.description}>
        <Textarea id="sq-desc" name="description" maxLength={200} className="min-h-20" placeholder={t("What brings you together?")} />
      </Field>
      <label className={`flex items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-line ${isPremium ? "cursor-pointer" : "opacity-60"}`}>
        <Lock className="h-4 w-4 text-muted" aria-hidden />
        <span className="flex-1 text-sm">
          {t("Private squad")}
          <span className="block text-xs text-subtle">{isPremium ? t("Invite-only, hidden from discovery") : t("Premium feature")}</span>
        </span>
        <input type="checkbox" name="isPrivate" disabled={!isPremium} className="h-4 w-4 accent-violet" />
      </label>
      {!isPremium && (
        <Link href="/premium" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline">
          <Crown className="h-3.5 w-3.5" aria-hidden />{" "}{t("Unlock private squads")}
        </Link>
      )}
      {state && !state.ok && <FormAlert>{state.error}</FormAlert>}
      <SubmitButton className="w-full" pendingText={t("Creating…")} icon={<Users className="h-4 w-4" />}>
        {t("Create squad")}
      </SubmitButton>
    </form>
  );
}

export function JoinByCodeForm() {
  const t = useT();
  const [state, action] = useActionState(joinSquadByCodeAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-2">
        <label htmlFor="code" className="sr-only">
          {t("Invite code")}
        </label>
        <Input id="code" name="code" placeholder={t("INVITE CODE")} maxLength={12} autoCapitalize="characters" className="uppercase tracking-widest" invalid={Boolean(fe?.code)} />
        <SubmitButton variant="secondary" icon={<KeyRound className="h-4 w-4" />}>
          {t("Join")}
        </SubmitButton>
      </div>
      {state && !state.ok && <p className="text-xs text-red-300">{state.error}</p>}
    </form>
  );
}

export function CopyCode({ code }: { code: string }) {
  const t = useT();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<Copy className="h-4 w-4" />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          toast({ tone: "success", title: t("Invite code copied"), text: code });
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast({ tone: "info", title: `${t("Invite code")}: ${code}` });
        }
      }}
    >
      <span className="font-mono tracking-widest">{code}</span>
      <span className="sr-only">{copied ? t("Copied") : t("Copy invite code")}</span>
    </Button>
  );
}
