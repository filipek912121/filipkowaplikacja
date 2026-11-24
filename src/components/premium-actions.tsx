"use client";

import { useT } from "@/lib/i18n/client";

import { CreditCard, Crown, FlaskConical } from "lucide-react";
import { useTransition } from "react";
import { demoTogglePremiumAction, openBillingPortalAction, startCheckoutAction } from "@/lib/actions/billing";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CheckoutButton({ label }: { label: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Button
      variant="gold"
      size="lg"
      className="w-full"
      loading={pending}
      icon={<Crown className="h-5 w-5" />}
      onClick={() =>
        start(async () => {
          // On success the action redirects to Stripe Checkout; only errors return.
          const r = await startCheckoutAction();
          if (r && !r.ok) toast({ tone: "error", title: r.error });
        })
      }
    >
      {label}
    </Button>
  );
}

export function PortalButton() {
  const t = useT();
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Button
      variant="secondary"
      className="w-full"
      loading={pending}
      icon={<CreditCard className="h-4 w-4" />}
      onClick={() =>
        start(async () => {
          const r = await openBillingPortalAction();
          if (r && !r.ok) toast({ tone: "error", title: r.error });
        })
      }
    >
      {t("Manage billing")}
    </Button>
  );
}

export function DemoToggle({ isPremium }: { isPremium: boolean }) {
  const t = useT();
  return (
    <ActionButton variant="secondary" className="w-full" action={demoTogglePremiumAction} icon={<FlaskConical className="h-4 w-4" />}>
      {isPremium ? t("Demo: switch back to Free") : t("Demo: preview Premium (no payment)")}
    </ActionButton>
  );
}
