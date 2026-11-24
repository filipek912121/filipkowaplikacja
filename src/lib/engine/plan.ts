import type { Plan, Subscription } from "@/lib/types";

/** Pure plan resolution from a subscription row (expired / unpaid → free). */
export function planFromSubscription(sub: Subscription | null, now = new Date()): Plan {
  if (!sub || sub.plan !== "premium") return "free";
  if (sub.status !== "active" && sub.status !== "trialing") return "free";
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < now) return "free";
  return "premium";
}
