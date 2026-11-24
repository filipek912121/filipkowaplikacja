import { getT } from "@/lib/i18n/server";
import { Zap } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/field";
import { enterDemoAction } from "@/lib/actions/auth";
import { getCurrentProfile } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Log in") };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const t = await getT();
  if (await getCurrentProfile()) redirect("/dashboard");
  const { next, error } = await searchParams;
  const demo = isDemoMode();
  return (
    <>
      <h1 className="font-display text-2xl font-bold">{t("Welcome back")}</h1>
      <p className="mb-6 mt-1 text-sm text-muted">{t("Your streak is waiting.")}</p>
      {error === "confirm" && (
        <div className="mb-4">
          <FormAlert>{t("That confirmation link is invalid or expired.")}</FormAlert>
        </div>
      )}
      {demo && (
        <div className="mb-6 space-y-3">
          <FormAlert tone="info">{t("Demo mode: Supabase isn't configured, so email login is disabled. Explore with a sample account — data lives in server memory only.")}
          </FormAlert>
          <form action={enterDemoAction}>
            <Button className="w-full" size="lg" icon={<Zap className="h-5 w-5" />}>
              {t("Enter demo as Alex")}
            </Button>
          </form>
        </div>
      )}
      <LoginForm next={next} demo={demo} />
    </>
  );
}
