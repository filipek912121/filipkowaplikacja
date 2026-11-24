import "server-only";
import Stripe from "stripe";
import { isStripeConfigured } from "@/lib/env";

let client: Stripe | null = null;

/** Returns a Stripe client, or null when Stripe isn't configured (checkout is then disabled). */
export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}
