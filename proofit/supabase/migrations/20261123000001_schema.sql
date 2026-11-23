-- ════════════════════════════════════════════════════════════════
-- PROOFIT — core schema
-- ════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

-- ── Profiles (1:1 with auth.users) ─────────────────────────────
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  username         text not null check (username ~ '^[a-z0-9._]{3,20}$'),
  display_name     text not null check (char_length(display_name) between 2 and 40),
  bio              text not null default '' check (char_length(bio) <= 160),
  avatar_color     text not null default '#8b5cf6' check (avatar_color ~ '^#[0-9a-fA-F]{6}$'),
  avatar_url       text,
  xp               integer not null default 0 check (xp >= 0),
  current_streak   integer not null default 0 check (current_streak >= 0),
  longest_streak   integer not null default 0 check (longest_streak >= 0),
  last_active_day  date,
  is_admin         boolean not null default false,
  created_at       timestamptz not null default now()
);
create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- ── Squads ─────────────────────────────────────────────────────
create table public.squads (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 3 and 40),
  description  text not null default '' check (char_length(description) <= 200),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  is_private   boolean not null default false,
  invite_code  text not null unique check (invite_code ~ '^[A-Z0-9]{4,12}$'),
  created_at   timestamptz not null default now()
);

create table public.squad_members (
  squad_id   uuid not null references public.squads (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (squad_id, user_id)
);
create index squad_members_user_idx on public.squad_members (user_id);

-- ── Challenges ─────────────────────────────────────────────────
create table public.challenges (
  id              uuid primary key default gen_random_uuid(),
  title           text not null check (char_length(title) between 4 and 80),
  description     text not null check (char_length(description) between 10 and 600),
  difficulty      text not null check (difficulty in ('easy', 'medium', 'hard', 'extreme')),
  category        text not null check (category in ('fitness', 'productivity', 'discipline', 'lifestyle', 'learning', 'money', 'social')),
  duration_days   integer not null check (duration_days in (1, 3, 7, 14, 30)),
  xp_reward       integer not null,
  tasks           text[] not null check (cardinality(tasks) between 1 and 6),
  visibility      text not null default 'public' check (visibility in ('public', 'private')),
  requires_proof  boolean not null default false,
  creator_id      uuid references public.profiles (id) on delete set null,
  squad_id        uuid references public.squads (id) on delete cascade,
  is_official     boolean not null default false,
  is_template     boolean not null default false,
  created_at      timestamptz not null default now(),
  -- XP per check-in must stay inside the difficulty band (mirrors XP_RULES in src/lib/config/game.ts)
  constraint challenges_xp_band check (
    (difficulty = 'easy'    and xp_reward between 1 and 3) or
    (difficulty = 'medium'  and xp_reward between 4 and 7) or
    (difficulty = 'hard'    and xp_reward between 8 and 12) or
    (difficulty = 'extreme' and xp_reward between 13 and 20)
  )
);
create index challenges_public_idx on public.challenges (created_at desc) where visibility = 'public' and squad_id is null;
create index challenges_creator_idx on public.challenges (creator_id);
create index challenges_squad_idx on public.challenges (squad_id);

create table public.challenge_participants (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  uuid not null references public.challenges (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  status        text not null default 'active' check (status in ('active', 'completed', 'failed', 'left')),
  joined_at     timestamptz not null default now(),
  ends_at       timestamptz not null,
  checkins      integer not null default 0 check (checkins >= 0),
  completed_at  timestamptz,
  unique (challenge_id, user_id)
);
create index participants_user_idx on public.challenge_participants (user_id, status);

-- ── Completions (one per participation per day) ────────────────
create table public.completions (
  id                uuid primary key default gen_random_uuid(),
  participation_id  uuid not null references public.challenge_participants (id) on delete cascade,
  challenge_id      uuid not null references public.challenges (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  day               date not null,
  status            text not null check (status in ('approved', 'pending', 'rejected')),
  xp_awarded        integer not null default 0 check (xp_awarded >= 0),
  note              text not null default '' check (char_length(note) <= 400),
  tasks_done        text[] not null default '{}',
  created_at        timestamptz not null default now()
);
-- Prevents duplicate check-ins / XP claims for the same day (rejected ones may be retried).
create unique index completions_one_per_day on public.completions (participation_id, day) where status <> 'rejected';
create index completions_user_day_idx on public.completions (user_id, day);
create index completions_challenge_idx on public.completions (challenge_id, day);

create table public.proof_submissions (
  id             uuid primary key default gen_random_uuid(),
  completion_id  uuid not null references public.completions (id) on delete cascade,
  challenge_id   uuid not null references public.challenges (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  kind           text not null check (kind in ('photo', 'link', 'text')),
  storage_path   text,
  url            text check (url is null or url ~ '^https://'),
  text           text check (text is null or char_length(text) <= 400),
  status         text not null default 'pending' check (status in ('approved', 'pending', 'rejected')),
  reviewer_id    uuid references public.profiles (id) on delete set null,
  review_note    text check (review_note is null or char_length(review_note) <= 200),
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  constraint proof_not_self_reviewed check (reviewer_id is null or reviewer_id <> user_id)
);
create index proofs_status_idx on public.proof_submissions (status, challenge_id);
create index proofs_user_idx on public.proof_submissions (user_id);

-- ── XP ledger: the only source of XP ──────────────────────────
create table public.xp_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  amount      integer not null check (amount > 0 and amount <= 100),
  reason      text not null check (reason in ('completion', 'streak_bonus', 'achievement', 'duel_win', 'challenge_complete')),
  ref_id      text,
  day         date not null,
  created_at  timestamptz not null default now()
);
-- A given reward (completion id, streak day, achievement, duel…) can only be claimed once.
create unique index xp_events_once on public.xp_events (user_id, reason, ref_id) where ref_id is not null;
create index xp_events_day_idx on public.xp_events (day, user_id);

-- ── Duels ──────────────────────────────────────────────────────
create table public.duels (
  id             uuid primary key default gen_random_uuid(),
  challenger_id  uuid not null references public.profiles (id) on delete cascade,
  opponent_id    uuid not null references public.profiles (id) on delete cascade,
  challenge_id   uuid not null references public.challenges (id) on delete cascade,
  duration_days  integer not null check (duration_days in (3, 7, 14)),
  status         text not null default 'pending' check (status in ('pending', 'active', 'completed', 'declined', 'cancelled')),
  starts_at      timestamptz,
  ends_at        timestamptz,
  winner_id      uuid references public.profiles (id) on delete set null,
  is_draw        boolean not null default false,
  created_at     timestamptz not null default now(),
  constraint duel_distinct_players check (challenger_id <> opponent_id)
);
create index duels_players_idx on public.duels (challenger_id, opponent_id);
create index duels_opponent_idx on public.duels (opponent_id);

-- ── Achievements ───────────────────────────────────────────────
create table public.achievements (
  id            text primary key,
  name          text not null,
  description   text not null,
  icon          text not null,
  tier          text not null check (tier in ('bronze', 'silver', 'gold', 'legend')),
  xp_bonus      integer not null default 0 check (xp_bonus >= 0),
  premium_only  boolean not null default false
);

create table public.user_achievements (
  user_id         uuid not null references public.profiles (id) on delete cascade,
  achievement_id  text not null references public.achievements (id) on delete cascade,
  unlocked_at     timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ── Subscriptions (written only by the Stripe webhook / service role) ──
create table public.subscriptions (
  user_id                 uuid primary key references public.profiles (id) on delete cascade,
  plan                    text not null default 'free' check (plan in ('free', 'premium')),
  status                  text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'inactive')),
  current_period_end      timestamptz,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  updated_at              timestamptz not null default now()
);

-- ── Social graph & invites ─────────────────────────────────────
create table public.follows (
  follower_id   uuid not null references public.profiles (id) on delete cascade,
  following_id  uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

create table public.invites (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('challenge', 'squad')),
  target_id     uuid not null,
  from_user_id  uuid not null references public.profiles (id) on delete cascade,
  to_user_id    uuid not null references public.profiles (id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now()
);
create unique index invites_one_pending on public.invites (kind, target_id, to_user_id) where status = 'pending';
create index invites_to_idx on public.invites (to_user_id, status);
