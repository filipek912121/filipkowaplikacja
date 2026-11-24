import "server-only";
import { getSessionUserId } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { AppError } from "@/lib/services/errors";
import type { ActionResult } from "@/lib/types";

/** Translates every user-facing string of an action result into the visitor's language. */
export async function localize<T>(r: ActionResult<T>): Promise<ActionResult<T>> {
  const t = await getT();
  if (r.ok) return r.message ? { ...r, message: t(r.message) } : r;
  return {
    ...r,
    error: t(r.error),
    fieldErrors: r.fieldErrors ? Object.fromEntries(Object.entries(r.fieldErrors).map(([k, v]) => [k, t(v)])) : undefined,
  };
}

/** Wraps an action: verifies the session, maps expected errors to UI-safe results, hides unexpected ones. */
export async function authed<T>(fn: (userId: string) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const userId = await getSessionUserId();
  if (!userId) return localize({ ok: false, error: "Your session expired. Please log in again." });
  try {
    return await localize(await fn(userId));
  } catch (e) {
    if (e instanceof AppError) {
      const t = await getT();
      const params = e.params ? Object.fromEntries(Object.entries(e.params).map(([k, v]) => [k, typeof v === "string" ? t(v) : v])) : undefined;
      const fieldErrors = e.fieldErrors ? Object.fromEntries(Object.entries(e.fieldErrors).map(([k, v]) => [k, t(v)])) : undefined;
      return { ok: false, error: t(e.message, params), fieldErrors };
    }
    // Let Next.js redirects / notFound propagate.
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[action]", e);
    return localize({ ok: false, error: "Something went wrong. Please try again." });
  }
}
