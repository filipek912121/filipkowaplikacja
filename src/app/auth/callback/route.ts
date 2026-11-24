import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Handles the email-confirmation / magic-link redirect from Supabase Auth. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code && !isDemoMode()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/dashboard?welcome=1", url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=confirm", url.origin));
}
