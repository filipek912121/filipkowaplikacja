# PROOFIT — Challenge. Compete. Win.

A social challenge platform: join daily / weekly / monthly challenges, check in every day, upload proof, duel friends, build squads and climb the leaderboard.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Auth, Postgres, Storage, RLS) · Stripe (prepared) · Lucide icons · Zod

---

## Quick start (demo mode — no accounts needed)

```bash
cd proofit
npm install
npm run dev
# open http://localhost:3000 → "Try the live demo"
```

With no Supabase variables set, PROOFIT runs in **demo mode**: a realistic, in-memory sample world (12 users, 26 challenges, duels, squads, pending proofs). Every button works, but data lives in server memory and resets on restart. A banner makes this clear in the UI — nothing pretends to be connected.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests for the game engine (XP, levels, streaks, safety filter, plans, achievements) |

---

## Connecting Supabase (real accounts)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in `supabase/migrations/` **in order** — either paste each file into *SQL Editor*, or with the CLI:
   ```bash
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   ```
   They create all tables, triggers, RPC functions, RLS policies, the private `proofs` storage bucket, and seed achievements + 24 official challenges.
3. *Authentication → URL Configuration*: set **Site URL** to your app URL and add `<your-url>/auth/callback` to **Redirect URLs**.
4. Copy `.env.example` to `.env.local` and fill in the three Supabase values (*Project Settings → API*).
5. Restart `npm run dev`. The demo banner disappears; sign up creates a real account (with email confirmation if enabled in Supabase).

To make someone an admin (can verify any proof): `update profiles set is_admin = true where username = '...';`

## Connecting Stripe (Premium — 19.99 PLN / month)

Payments are **not faked**. Until Stripe is configured, the Premium page says so and checkout is disabled (demo mode only offers a clearly-labelled "preview Premium" toggle).

1. Stripe Dashboard → *Products* → create "PROOFIT Premium" with a **recurring price of 19.99 PLN / month**. Copy the price ID (`price_…`) → `STRIPE_PRICE_ID_PREMIUM`.
2. *Developers → API keys* → secret key → `STRIPE_SECRET_KEY`.
3. *Developers → Webhooks* → add endpoint `https://<your-domain>/api/stripe/webhook` with events
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
   Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. (Optional) Enable the *Customer portal* in Stripe settings so "Manage billing" works.

The webhook (signature-verified) is the **only** thing that upgrades a plan. Premium is always resolved on the server from the `subscriptions` table.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes (prod) | Public URL, used for auth / Stripe redirects |
| `NEXT_PUBLIC_SUPABASE_URL` | for real mode | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for real mode | Public anon key (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | for real mode | **Server-only.** Used by server actions for XP, check-ins, achievements, subscriptions |
| `STRIPE_SECRET_KEY` | for payments | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | for payments | Webhook signing secret |
| `STRIPE_PRICE_ID_PREMIUM` | for payments | 19.99 PLN monthly price ID |
| `APP_TIMEZONE` | no | Defines "today" for check-ins/streaks (default `Europe/Warsaw`) |

All three Supabase variables must be set to leave demo mode.

## Languages (Polski / English)

The UI is fully bilingual. **Polish is the default**; visitors whose browser prefers English get English. Everyone can switch with the PL/EN toggle (sidebar, Settings, Profile, landing and login pages); the choice is stored in a cookie.

- English source strings are the translation keys; Polish lives in `src/lib/i18n/pl.ts`.
- Server components: `const t = await getT()`. Client components: `const t = useT()`.
- Plurals: `t.p(n, "{n} day", "{n} days")` with Polish `one|few|many` forms in the dictionary (`1 dzień | 2 dni | 5 dni`).
- Official/seed challenge content is translated too; user-written content is shown as written.

## Install on a phone

PROOFIT is a **PWA** (web app manifest + icons): once deployed (e.g. Vercel), open the link on the phone and choose **"Add to Home screen"** (Android Chrome) or **Share → "Add to Home Screen"** (iPhone Safari). It then opens full-screen with its own icon, like a native app.

### Android APK

An APK of PROOFIT is a thin wrapper around the deployed URL (the app needs its server), so deploy first. Then either:

- **PWABuilder (easiest, works from a phone):** go to pwabuilder.com, paste your deployed URL, choose **Android → Generate**. You get a signed `.apk`/`.aab` (Trusted Web Activity) to install or upload to Google Play.
- **Bubblewrap (CLI):** `npx @bubblewrap/cli init --manifest https://<your-domain>/manifest.webmanifest` then `npx @bubblewrap/cli build` (needs JDK + Android SDK).

## Deploying (Vercel)

1. Push the repo, import it in Vercel and set **Root Directory = `proofit`**.
2. Add the environment variables above (Production + Preview).
3. Deploy, then point Supabase redirect URLs and the Stripe webhook at the deployed domain.

Any Node 20+ host works too: `npm run build && npm start`.

---

## Architecture

```
src/
  app/                     routes (App Router)
    (auth)/login, signup   public auth pages
    (app)/…                protected app: dashboard, explore, challenges/[id], create,
                           duels, squads, leaderboard, profile, u/[username],
                           achievements, review, stats, settings, premium
    api/stripe/webhook     subscription sync
    auth/callback          email confirmation
  proxy.ts                 session refresh + protected-route redirects (Next 16 "proxy")
  components/              UI kit, layout (sidebar / bottom nav), feature components
  lib/
    config/                ★ game rules (XP, levels, limits, plans), taxonomy, achievements
    engine/                pure logic: XP, levels, streaks, dates, safety filter, plans
    services/              business rules (check-ins, proofs, duels, squads, leaderboards…)
    data/                  Store interface + MemoryStore (demo) + SupabaseStore
    actions/               server actions (validated with Zod)
supabase/migrations/       schema, functions/triggers, RLS, seed
tests/                     engine unit tests
```

### Game rules (all in `src/lib/config/game.ts`)

- **Difficulty XP per check-in:** Easy 1–3 · Medium 4–7 · Hard 8–12 · Extreme 13–20 (also enforced by a DB check constraint).
- **One check-in per challenge per day** — enforced in code and by a unique DB index.
- **Daily XP cap:** 60 XP from check-ins, streak and completion bonuses.
- **Streak bonus:** from day 3, +1 XP per day, max +5, once per day.
- **Finish bonus:** 50 % of the daily reward when every day of a challenge is completed.
- **Anti-farming:** solo private challenges give half XP; every reward has a unique ledger key, so the same reward can't be claimed twice.
- **Levels:** level L → L+1 costs `30 + (L−1)·10` XP.
- **Proof:** challenges can require a photo / link / description. Such check-ins stay *pending* and earn XP only after a human reviewer (creator, squad owner, admin, or someone who completed the official challenge) approves. Nobody can approve their own proof. Uploading an image never auto-approves.
- **Safety:** user-created challenges are screened for dangerous exercise, sleep deprivation, starvation, dehydration, substance use and self-harm.
- **Plans:** Free = 3 active challenges, 1 private challenge, 1 squad. Premium = 15 active, private squads, templates, advanced stats, extra profile colours.

### Security model

- RLS is enabled on every table. With the public key a signed-in user can only **read** what they're allowed to see and **update their own display name / bio**.
- All other writes go through server actions that verify the user (`supabase.auth.getUser()`), validate input with Zod and apply the rules above, then write with the service-role key.
- `profiles.xp` is maintained by a trigger on the append-only `xp_events` ledger; users cannot write XP, streaks, completions or subscriptions directly (verified against Postgres — see "Testing").
- The active-challenge limit is enforced again by a DB trigger; Premium features are checked server-side (e.g. `/stats` never sends data to free users).
- Proof photos go to a private storage bucket and are shown via short-lived signed URLs.

## Testing

- `npm test` — 14 engine unit tests.
- Migrations were applied to a local PostgreSQL 16 (with stand-ins for Supabase's `auth`/`storage` schemas) and checked: users can't modify XP, subscriptions, completions or other profiles; duplicate check-ins / XP claims, XP-band cheats and over-limit joins are rejected.
- A Playwright end-to-end run in demo mode covers: demo login, check-in with XP + streak + level-up, duplicate check-in block, free-plan limit, Premium gating & preview, duel accept/send, filters & search, photo proof upload → pending, proof approval, unsafe-challenge rejection, challenge creation with invites, squad join/create (private), follow, profile edit, logout redirect and sign-up.

**Not yet tested against a live Supabase project or real Stripe account** (no credentials were available) — run through sign-up, a check-in and a test-mode checkout after configuring them.
