/** Feature detection based on environment variables. Server-only values are never read on the client. */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

/** Demo mode = Supabase is not configured. Uses an in-memory store with sample data. */
export function isDemoMode(): boolean {
  return !(env.supabaseUrl && env.supabaseAnonKey && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_PREMIUM && process.env.STRIPE_WEBHOOK_SECRET,
  );
}
