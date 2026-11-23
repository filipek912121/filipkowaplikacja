import "server-only";
import { getSessionUserId } from "@/lib/auth";
import { AppError } from "@/lib/services/errors";
import type { ActionResult } from "@/lib/types";

/** Wraps an action: verifies the session, maps expected errors to UI-safe results, hides unexpected ones. */
export async function authed<T>(fn: (userId: string) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Your session expired. Please log in again." };
  try {
    return await fn(userId);
  } catch (e) {
    if (e instanceof AppError) return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
    // Let Next.js redirects / notFound propagate.
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[action]", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
