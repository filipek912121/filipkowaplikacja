import { formatDate } from "@/lib/i18n/core";
import { getT } from "@/lib/i18n/server";
import { Check, CircleCheck, Crown, Info, Minus } from "lucide-react";
import type { Metadata } from "next";
import { CheckoutButton, DemoToggle, PortalButton } from "@/components/premium-actions";
import { Card, PageHeader } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/field";
import { requireUser } from "@/lib/auth";
import { PLAN_LIMITS, PREMIUM_PRICE } from "@/lib/config/game";
import { getStore } from "@/lib/data";
import { isDemoMode, isStripeConfigured } from "@/lib/env";
import { getEntitlements } from "@/lib/services/entitlements";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Premium") };
}

const ROWS: { label: string; free: string | boolean; premium: string | boolean }[] = [
  { label: "Active challenges", free: String(PLAN_LIMITS.free.maxActiveChallenges), premium: String(PLAN_LIMITS.premium.maxActiveChallenges) },
  { label: "Private challenges", free: String(PLAN_LIMITS.free.maxPrivateChallenges), premium: String(PLAN_LIMITS.premium.maxPrivateChallenges) },
  { label: "Squads you can own", free: String(PLAN_LIMITS.free.maxSquadsOwned), premium: String(PLAN_LIMITS.premium.maxSquadsOwned) },
  { label: "Duels, leaderboards & achievements", free: true, premium: true },
  { label: "Private squads", free: false, premium: true },
  { label: "Advanced statistics", free: false, premium: true },
  { label: "Custom challenge templates", free: false, premium: true },
  { label: "Profile customization", free: "Basic", premium: "Extra colours + ring" },
];

export default async function PremiumPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const t = await getT();
  const me = await requireUser();
  const { status } = await searchParams;
  const [ent, sub] = await Promise.all([getEntitlements(me.id), getStore().getSubscription(me.id)]);
  const demo = isDemoMode();
  const stripe = isStripeConfigured();
  const price = PREMIUM_PRICE.amount.toFixed(2).replace(".", ",");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow={t("PROOFIT Premium")} title={<>{t("Go further.")}{" "}<span className="text-gradient">{t("Compete harder.")}</span></>} subtitle={t("More challenges at once, deeper stats and private groups for your crew.")} />
      {status === "success" && (
        <div className="mb-6">
          <FormAlert tone="success">{t("Payment received! Premium activates as soon as Stripe confirms your subscription (usually within seconds). Refresh if it doesn't show yet.")}</FormAlert>
        </div>
      )}
      {status === "cancelled" && (
        <div className="mb-6">
          <FormAlert tone="info">{t("Checkout cancelled — you haven't been charged.")}</FormAlert>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("Free vs Premium")}</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="px-5 py-4 font-medium text-muted">
                  {t("Feature")}
                </th>
                <th scope="col" className="px-3 py-4 text-center font-semibold">
                  {t("Free")}
                </th>
                <th scope="col" className="px-3 py-4 text-center font-semibold text-gold">
                  {t("Premium")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ROWS.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="px-5 py-3.5 text-left font-normal">
                    {t(r.label)}
                  </th>
                  {[r.free, r.premium].map((v, i) => (
                    <td key={i} className="px-3 py-3.5 text-center">
                      {v === true ? <Check className="mx-auto h-4 w-4 text-easy" aria-label={t("Included")} /> : v === false ? <Minus className="mx-auto h-4 w-4 text-subtle" aria-label={t("Not included")} /> : <span className={i ? "font-semibold" : "text-muted"}>{t(v)}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card glow className="relative overflow-hidden p-6 lg:self-start">
          <span className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" aria-hidden />
          <p className="relative flex items-center gap-2 font-display text-lg font-bold">
            <Crown className="h-5 w-5 text-gold" aria-hidden />{" "}{t("Premium")}
          </p>
          <p className="relative mt-2 font-display text-5xl font-bold">
            {price}
            <span className="ml-1 text-lg font-medium text-muted">{PREMIUM_PRICE.currency} / month</span>
          </p>
          <p className="relative mt-1 text-xs text-subtle">{t("Cancel anytime. Billed monthly via Stripe.")}</p>

          <div className="relative mt-6 space-y-3">
            {ent.isPremium ? (
              <>
                <p className="flex items-center gap-2 font-semibold text-gold">
                  <CircleCheck className="h-5 w-5" aria-hidden />{" "}{t("Your Premium is active")}
                </p>
                {sub?.currentPeriodEnd && <p className="text-sm text-muted">{t("Renews {date}", { date: formatDate(sub.currentPeriodEnd, t.locale, { day: "numeric", month: "long", year: "numeric" }) })}</p>}
                {sub?.stripeCustomerId && stripe && <PortalButton />}
              </>
            ) : stripe ? (
              <CheckoutButton label={t("Upgrade for {price} PLN", { price })} />
            ) : (
              <FormAlert tone="info">
                <Info className="mr-1 inline h-4 w-4 -translate-y-px" aria-hidden />{" "}{t("Payments aren't configured yet. Add your Stripe keys (see README) to enable checkout — no fake payments are ever taken.")}
              </FormAlert>
            )}
            {demo && <DemoToggle isPremium={ent.isPremium} />}
          </div>
        </Card>
      </div>
    </div>
  );
}
