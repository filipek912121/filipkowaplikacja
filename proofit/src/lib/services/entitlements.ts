import "server-only";
import { PLAN_LIMITS } from "@/lib/config/game";
import { getStore } from "@/lib/data";
import { planFromSubscription } from "@/lib/engine/plan";
import type { Plan } from "@/lib/types";

export { planFromSubscription };

/**
 * The single source of truth for Premium access. Always evaluated on the
 * server from the subscriptions table (written only by the Stripe webhook /
 * service role) — never from client state.
 */
export async function getPlan(userId: string): Promise<Plan> {
  return planFromSubscription(await getStore().getSubscription(userId));
}

export async function getEntitlements(userId: string) {
  const plan = await getPlan(userId);
  return { plan, isPremium: plan === "premium", limits: PLAN_LIMITS[plan] };
}

export class PremiumRequiredError extends Error {
  constructor(feature: string) {
    super(`${feature} is a PROOFIT Premium feature.`);
    this.name = "PremiumRequiredError";
  }
}
