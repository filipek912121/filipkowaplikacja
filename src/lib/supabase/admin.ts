import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let admin: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS — only ever used inside server-side
 * services after the caller's identity has been verified. Never import from
 * client components.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!admin) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!env.supabaseUrl || !key) throw new Error("Supabase service role is not configured");
    admin = createClient(env.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}
