-- ════════════════════════════════════════════════════════════════
-- PROOFIT — Row Level Security
--
-- Security model:
--  • Every table has RLS enabled. With the public anon/authenticated keys a
--    user can only READ what they're allowed to see, and can only UPDATE the
--    harmless columns of their own profile.
--  • All other writes (check-ins, XP, achievements, duels, squads,
--    subscriptions…) go through Next.js server actions which verify the user
--    and validate input, then write with the service-role key.
--  • Therefore users can never change their XP, streaks, plan or anyone
--    else's data directly, even with a hand-crafted API call.
-- ════════════════════════════════════════════════════════════════

alter table public.profiles               enable row level security;
alter table public.squads                 enable row level security;
alter table public.squad_members          enable row level security;
alter table public.challenges             enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.completions            enable row level security;
alter table public.proof_submissions      enable row level security;
alter table public.xp_events              enable row level security;
alter table public.duels                  enable row level security;
alter table public.achievements           enable row level security;
alter table public.user_achievements      enable row level security;
alter table public.subscriptions          enable row level security;
alter table public.follows                enable row level security;
alter table public.invites                enable row level security;

-- Lock down table privileges first, then grant back only what's needed.
revoke all on all tables in schema public from anon;
revoke insert, update, delete, truncate on all tables in schema public from authenticated;
grant select on all tables in schema public to authenticated;

-- ── profiles ───────────────────────────────────────────────────
create policy "profiles are visible to signed-in users"
  on public.profiles for select to authenticated using (true);

-- Column-level privilege: only name and bio are directly user-editable.
-- (Avatar colour goes through the server because some colours are Premium-only.)
grant update (display_name, bio) on public.profiles to authenticated;
create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ── challenges & participation ─────────────────────────────────
create policy "challenges visible when public, owned, joined, invited or squad"
  on public.challenges for select to authenticated using (public.can_view_challenge(id));

create policy "participants visible for visible challenges"
  on public.challenge_participants for select to authenticated
  using (user_id = auth.uid() or public.can_view_challenge(challenge_id));

create policy "own completions, or completions on challenges you created"
  on public.completions for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.challenges c where c.id = challenge_id and c.creator_id = auth.uid())
  );

create policy "own proofs, or proofs on challenges you created"
  on public.proof_submissions for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.challenges c where c.id = challenge_id and c.creator_id = auth.uid())
  );

-- ── XP ledger: private ─────────────────────────────────────────
create policy "own xp events"
  on public.xp_events for select to authenticated using (user_id = auth.uid());

-- ── duels ──────────────────────────────────────────────────────
create policy "duel players see their duels"
  on public.duels for select to authenticated
  using (challenger_id = auth.uid() or opponent_id = auth.uid());

-- ── squads ─────────────────────────────────────────────────────
create policy "public squads or squads you belong to"
  on public.squads for select to authenticated
  using (not is_private or public.is_squad_member(id));

create policy "members of visible squads"
  on public.squad_members for select to authenticated
  using (
    public.is_squad_member(squad_id)
    or exists (select 1 from public.squads s where s.id = squad_id and not s.is_private)
  );

-- ── achievements (public badges) ───────────────────────────────
create policy "achievement catalogue is public"
  on public.achievements for select to authenticated using (true);
create policy "unlocked badges are public"
  on public.user_achievements for select to authenticated using (true);

-- ── subscriptions: private, read-only ──────────────────────────
create policy "own subscription"
  on public.subscriptions for select to authenticated using (user_id = auth.uid());

-- ── social ─────────────────────────────────────────────────────
create policy "follow graph is visible"
  on public.follows for select to authenticated using (true);
create policy "own invites"
  on public.invites for select to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- ── Storage: private proof photos ──────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- Uploads are performed by the server; users may read files in their own folder.
create policy "users read their own proof files"
  on storage.objects for select to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
