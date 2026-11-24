"use client";

import { useT } from "@/lib/i18n/client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, signUpAction } from "@/lib/actions/auth";
import { Field, FormAlert, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next, demo }: { next?: string; demo: boolean }) {
  const t = useT();
  const [state, action] = useActionState(signInAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label={t("Email")} htmlFor="email" error={fe?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required disabled={demo} invalid={Boolean(fe?.email)} />
      </Field>
      <Field label={t("Password")} htmlFor="password" error={fe?.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required disabled={demo} invalid={Boolean(fe?.password)} />
      </Field>
      {state && !state.ok && <FormAlert>{state.error}</FormAlert>}
      <SubmitButton className="w-full" size="lg" disabled={demo} pendingText={t("Logging in…")}>
        {t("Log in")}
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-violet-2 hover:underline">
          {t("Create an account")}
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ demo }: { demo: boolean }) {
  const t = useT();
  const [state, action] = useActionState(signUpAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;
  if (state?.ok) return <FormAlert tone="success">{state.message}</FormAlert>;
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Display name")} htmlFor="displayName" error={fe?.displayName}>
          <Input id="displayName" name="displayName" autoComplete="name" required minLength={2} maxLength={40} invalid={Boolean(fe?.displayName)} />
        </Field>
        <Field label={t("Username")} htmlFor="username" error={fe?.username} hint={t("a–z, 0–9, . and _")}>
          <Input id="username" name="username" autoComplete="username" required minLength={3} maxLength={20} pattern="[a-z0-9._]+" autoCapitalize="none" invalid={Boolean(fe?.username)} />
        </Field>
      </div>
      {!demo && (
        <>
          <Field label={t("Email")} htmlFor="email" error={fe?.email}>
            <Input id="email" name="email" type="email" autoComplete="email" required invalid={Boolean(fe?.email)} />
          </Field>
          <Field label={t("Password")} htmlFor="password" error={fe?.password} hint={t("At least 8 characters")}>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} invalid={Boolean(fe?.password)} />
          </Field>
        </>
      )}
      {state && !state.ok && <FormAlert>{state.error}</FormAlert>}
      <SubmitButton className="w-full" size="lg" pendingText={t("Creating account…")}>
        {demo ? t("Create demo account") : t("Create account")}
      </SubmitButton>
      <p className="text-center text-xs text-subtle">{t("By signing up you agree to keep every challenge safe and honest.")}</p>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-violet-2 hover:underline">
          {t("Log in")}
        </Link>
      </p>
    </form>
  );
}
