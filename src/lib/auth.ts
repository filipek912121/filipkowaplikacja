import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getStore } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const DEMO_COOKIE = "proofit_demo_uid";

/** Returns the verified user id for this request, or null. */
export const getSessionUserId = cache(async (): Promise<string | null> => {
  if (isDemoMode()) {
    const id = (await cookies()).get(DEMO_COOKIE)?.value;
    if (!id) return null;
    const profile = await getStore().getProfile(id);
    return profile ? profile.id : null;
  }
  const supabase = await createSupabaseServerClient();
  // getUser() validates the JWT with Supabase Auth (never trust getSession() on the server).
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const id = await getSessionUserId();
  if (!id) return null;
  return getStore().getProfile(id);
});

/** Use in protected pages/actions. Redirects to /login when signed out. */
export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}
