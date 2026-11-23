-- ════════════════════════════════════════════════════════════════
-- PROOFIT — triggers & RPC functions
-- ════════════════════════════════════════════════════════════════

-- New auth user → profile + free subscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  final_username text;
begin
  if base_username !~ '^[a-z0-9._]{3,20}$' then
    base_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  final_username := base_username;
  if exists (select 1 from public.profiles where lower(username) = final_username) then
    final_username := left(base_username, 15) || '_' || substr(md5(new.id::text), 1, 4);
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    final_username,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), final_username)
  );
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- profiles.xp is always the sum of the ledger.
create or replace function public.apply_xp_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set xp = xp + new.amount where id = new.user_id;
  return new;
end;
$$;

create trigger on_xp_event_inserted
  after insert on public.xp_events
  for each row execute function public.apply_xp_event();

-- XP events are append-only (rows still cascade-delete with their profile).
create or replace function public.prevent_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'xp_events are append-only';
end;
$$;
create trigger xp_events_immutable
  before update on public.xp_events
  for each row execute function public.prevent_mutation();

-- Premium check usable from SQL (mirrors planFromSubscription in TS).
create or replace function public.is_premium(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.plan = 'premium'
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

-- Defence in depth: active-challenge limit enforced in the database too
-- (keep numbers in sync with PLAN_LIMITS in src/lib/config/game.ts).
create or replace function public.enforce_active_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count integer;
  max_allowed integer;
begin
  if new.status <> 'active' or (tg_op = 'UPDATE' and old.status = 'active') then
    return new;
  end if;
  select count(*) into active_count
  from public.challenge_participants
  where user_id = new.user_id and status = 'active' and id <> new.id;
  max_allowed := case when public.is_premium(new.user_id) then 15 else 3 end;
  if active_count >= max_allowed then
    raise exception 'active challenge limit reached (%)', max_allowed using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger participants_active_limit
  before insert or update of status on public.challenge_participants
  for each row execute function public.enforce_active_limit();

-- Visibility helper used by RLS policies.
create or replace function public.can_view_challenge(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.challenges c
    where c.id = cid and (
      (c.visibility = 'public' and c.squad_id is null)
      or c.creator_id = auth.uid()
      or exists (select 1 from public.challenge_participants p where p.challenge_id = c.id and p.user_id = auth.uid())
      or exists (select 1 from public.squad_members m where m.squad_id = c.squad_id and m.user_id = auth.uid())
      or exists (select 1 from public.invites i where i.target_id = c.id and i.to_user_id = auth.uid())
    )
  );
$$;

create or replace function public.is_squad_member(sid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.squad_members where squad_id = sid and user_id = auth.uid());
$$;

-- Leaderboard aggregation (period totals from the ledger).
create or replace function public.xp_totals(since_day date default null, user_ids uuid[] default null, lim integer default 100)
returns table (user_id uuid, xp bigint)
language sql
stable
set search_path = public
as $$
  select p.id as user_id, coalesce(sum(e.amount), 0)::bigint as xp
  from public.profiles p
  left join public.xp_events e
    on e.user_id = p.id and (since_day is null or e.day >= since_day)
  where user_ids is null or p.id = any (user_ids)
  group by p.id
  order by xp desc, p.created_at asc
  limit least(greatest(lim, 1), 500);
$$;

create or replace function public.participant_counts(challenge_ids uuid[])
returns table (challenge_id uuid, total bigint)
language sql
stable
set search_path = public
as $$
  select challenge_id, count(*)::bigint
  from public.challenge_participants
  where challenge_id = any (challenge_ids) and status <> 'left'
  group by challenge_id;
$$;

revoke all on function public.xp_totals(date, uuid[], integer) from public, anon;
revoke all on function public.participant_counts(uuid[]) from public, anon;
grant execute on function public.xp_totals(date, uuid[], integer) to authenticated, service_role;
grant execute on function public.participant_counts(uuid[]) to authenticated, service_role;
