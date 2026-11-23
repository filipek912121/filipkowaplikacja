"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "@/lib/auth";
import { getStore } from "@/lib/data";
import { createDemoProfile } from "@/lib/data/demo/memory-store";
import { DEMO_USER_ID } from "@/lib/data/demo/seed";
import { env, isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { signInSchema, signUpSchema, usernameSchema, zodFieldErrors } from "@/lib/validation";

const demoCookieOpts = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7 };

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export async function signInAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (isDemoMode()) return { ok: false, error: "Demo mode: Supabase isn't configured. Use “Enter demo” instead." };
  const parsed = signInSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { ok: false, error: "Check your details.", fieldErrors: zodFieldErrors(parsed.error) };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: error.message === "Email not confirmed" ? "Confirm your email first — check your inbox." : "Invalid email or password." };
  redirect(safeNext(fd.get("next")));
}

export async function signUpAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    email: fd.get("email"),
    password: fd.get("password"),
    username: String(fd.get("username") ?? "").toLowerCase(),
    displayName: fd.get("displayName"),
  });
  if (isDemoMode()) {
    // Demo sign-up only needs a username + name; nothing is persisted beyond this server process.
    const u = usernameSchema.safeParse(String(fd.get("username") ?? "").toLowerCase());
    const name = String(fd.get("displayName") ?? "").trim();
    if (!u.success || name.length < 2)
      return { ok: false, error: "Check your details.", fieldErrors: { ...(u.success ? {} : { username: u.error.issues[0].message }), ...(name.length < 2 ? { displayName: "At least 2 characters" } : {}) } };
    if (await getStore().getProfileByUsername(u.data)) return { ok: false, error: "Username taken.", fieldErrors: { username: "Already taken" } };
    const id = createDemoProfile(u.data, name.slice(0, 40));
    (await cookies()).set(DEMO_COOKIE, id, demoCookieOpts);
    redirect("/dashboard?welcome=1");
  }
  if (!parsed.success) return { ok: false, error: "Check your details.", fieldErrors: zodFieldErrors(parsed.error) };
  if (await getStore().getProfileByUsername(parsed.data.username))
    return { ok: false, error: "Username taken.", fieldErrors: { username: "Already taken" } };

  const origin = (await headers()).get("origin") ?? env.siteUrl;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Read by the handle_new_user() trigger to create the profile row.
      data: { username: parsed.data.username, display_name: parsed.data.displayName },
    },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.session) return { ok: true, message: "Check your inbox to confirm your email, then log in." };
  redirect("/dashboard?welcome=1");
}

export async function enterDemoAction(): Promise<void> {
  if (!isDemoMode()) redirect("/login");
  (await cookies()).set(DEMO_COOKIE, DEMO_USER_ID, demoCookieOpts);
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  if (isDemoMode()) {
    (await cookies()).delete(DEMO_COOKIE);
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
