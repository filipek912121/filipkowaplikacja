import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

const PROTECTED = ["/dashboard", "/explore", "/create", "/challenges", "/duels", "/squads", "/leaderboard", "/profile", "/achievements", "/review", "/stats", "/settings", "/u/"];
const DEMO_COOKIE = "proofit_demo_uid";

function isProtected(pathname: string) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`));
}

/**
 * Edge of the app: refreshes Supabase sessions and bounces signed-out users
 * away from protected pages. Pages still verify the user server-side.
 */
export async function proxy(request: NextRequest) {
  const demo = !(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { pathname, search } = request.nextUrl;

  let response = NextResponse.next({ request });
  let signedIn: boolean;
  if (demo) {
    signedIn = Boolean(request.cookies.get(DEMO_COOKIE)?.value);
  } else {
    const r = await updateSupabaseSession(request);
    response = r.response;
    signedIn = Boolean(r.user);
  }

  if (!signedIn && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  // Signed-in users visiting /login or /signup are redirected by those pages
  // after a server-side check (avoids loops on stale demo cookies).
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|icons/|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
