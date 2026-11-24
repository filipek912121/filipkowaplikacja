import { getT } from "@/lib/i18n/server";
import { LogoMark } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getT();
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <LogoMark size={56} className="mx-auto mb-6 opacity-80" />
        <p className="font-display text-6xl font-bold text-gradient">404</p>
        <h1 className="mt-2 font-display text-xl font-semibold">{t("This challenge doesn't exist")}</h1>
        <p className="mt-2 text-muted">{t("It may be private, or the link is wrong.")}</p>
        <LinkButton href="/dashboard" className="mt-6">
          {t("Back to dashboard")}
        </LinkButton>
      </div>
    </main>
  );
}
