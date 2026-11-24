"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUserId } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { env, isDemoMode } from "@/lib/env";
import { getPlan } from "@/lib/services/entitlements";
import { getStripe } from "@/lib/stripe";
import type { ActionResult } from "@/lib/types";
import { localize } from "./run";

async function origin() {
  return (await headers()).get("origin") ?? env.siteUrl;
}

/** Starts a real Stripe Checkout session. The plan only changes when Stripe's webhook confirms payment. */
export async function startCheckoutAction(): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login?next=/premium");
  const stripe = getStripe();
  if (!stripe) return localize({ ok: false, error: "Payments aren't configured yet. Add your Stripe keys to enable Premium checkout." });
  if ((await getPlan(userId)) === "premium") return localize({ ok: false, error: "You're already Premium." });

  const store = getStore();
  const sub = await store.getSubscription(userId);
  const base = await origin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PREMIUM!, quantity: 1 }],
    customer: sub?.stripeCustomerId ?? undefined,
    client_reference_id: userId,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
    success_url: `${base}/premium?status=success`,
    cancel_url: `${base}/premium?status=cancelled`,
  });
  if (!session.url) return localize({ ok: false, error: "Couldn't start checkout." });
  redirect(session.url);
}

export async function openBillingPortalAction(): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const stripe = getStripe();
  if (!stripe) return localize({ ok: false, error: "Payments aren't configured." });
  const sub = await getStore().getSubscription(userId);
  if (!sub?.stripeCustomerId) return localize({ ok: false, error: "No billing account found." });
  const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripeCustomerId, return_url: `${await origin()}/premium` });
  redirect(portal.url);
}

/** DEMO MODE ONLY: flip the plan locally to preview Premium features. No payment is involved or implied. */
export async function demoTogglePremiumAction(): Promise<ActionResult> {
  if (!isDemoMode()) return localize({ ok: false, error: "Not available." });
  const userId = await getSessionUserId();
  if (!userId) return localize({ ok: false, error: "Log in first." });
  const store = getStore();
  const current = await getPlan(userId);
  await store.upsertSubscription({
    userId,
    plan: current === "premium" ? "free" : "premium",
    status: "active",
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  });
  revalidatePath("/", "layout");
  return localize({ ok: true, message: current === "premium" ? "Demo: switched back to Free." : "Demo: Premium preview enabled." });
}
