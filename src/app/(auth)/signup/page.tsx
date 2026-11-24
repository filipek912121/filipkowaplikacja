import { getT } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth-forms";
import { FormAlert } from "@/components/ui/field";
import { getCurrentProfile } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Sign up") };
}

export default async function SignupPage() {
  const t = await getT();
  if (await getCurrentProfile()) redirect("/dashboard");
  const demo = isDemoMode();
  return (
    <>
      <h1 className="font-display text-2xl font-bold">{t("Join PROOFIT")}</h1>
      <p className="mb-6 mt-1 text-sm text-muted">{t("Challenge. Compete. Win.")}</p>
      {demo && (
        <div className="mb-5">
          <FormAlert tone="info">Demo mode: creates a temporary account in server memory (no email or password needed). It resets when the server restarts.</FormAlert>
        </div>
      )}
      <SignupForm demo={demo} />
    </>
  );
}
