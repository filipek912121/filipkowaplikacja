import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStore } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import type { Subscription } from "@/lib/types";

/**
 * Stripe → PROOFIT subscription sync. This is the ONLY place the plan is
 * upgraded in production: the signature is verified with STRIPE_WEBHOOK_SECRET
 * and the row is written with the service role.
 *
 * Configure in Stripe → Developers → Webhooks with events:
 *   checkout.session.completed, customer.subscription.created,
 *   customer.subscription.updated, customer.subscription.deleted
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe || isDemoMode()) return NextResponse.json({ error: "Stripe or Supabase not configured" }, { status: 501 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const store = getStore();
  const sync = async (sub: Stripe.Subscription, userIdHint?: string | null) => {
    const userId = userIdHint ?? sub.metadata?.userId;
    if (!userId) return;
    const statusMap: Record<string, Subscription["status"]> = {
      active: "active",
      trialing: "trialing",
      past_due: "past_due",
      canceled: "canceled",
      unpaid: "past_due",
      incomplete: "inactive",
      incomplete_expired: "inactive",
      paused: "inactive",
    };
    const periodEnd = sub.items?.data?.[0]?.current_period_end;
    await store.upsertSubscription({
      userId,
      plan: sub.status === "active" || sub.status === "trialing" ? "premium" : "free",
      status: statusMap[sub.status] ?? "inactive",
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripeSubscriptionId: sub.id,
    });
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof session.subscription === "string" ? session.subscription : session.subscription.id,
          );
          await sync(sub, session.client_reference_id ?? session.metadata?.userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await sync(event.data.object);
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe-webhook]", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
