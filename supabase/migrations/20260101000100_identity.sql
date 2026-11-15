-- Phase 2 / identity: profiles, user_roles, consents, parent_links, coach_relationships + helpers.

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or length(display_name) between 1 and 80),
  birth_date   date not null,
  is_minor     boolean not null,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
  -- Deliberately NO column for Apple Declared Age Range / Google Play Age Signals payloads
  -- and no generic "age data" JSON. Only birth_date (needed to compute age) is kept.
);

-- is_minor is derived, never client-written. 16-17 => true, 18+ => false.
-- Birthdays: run public.recompute_minor_flags() daily (pg_cron / scheduled job) so 17 -> 18 flips.
create or replace function private.profiles_set_is_minor()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.is_minor := app.age_years(new.birth_date) < 18;
  return new;
end $$;
create trigger profiles_set_is_minor before insert or update on public.profiles
  for each row execute function private.profiles_set_is_minor();
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

create table public.user_roles (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  role       text not null check (role in ('athlete','coach_pending','coach_verified','gym_admin','platform_admin')),
  granted_at timestamptz not null default now(),
  granted_by uuid
);

create table public.consents (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  kind           text not null check (kind in ('health_data','ai_vendor','coach_sharing','parental')),
  granted        boolean not null default false,
  policy_version text not null check (length(policy_version) between 1 and 64),
  granted_at     timestamptz,
  revoked_at     timestamptz,
  updated_at     timestamptz not null default now(),
  actor_user_id  uuid,  -- who acted: the user, or a parent/guardian acting for a minor
  primary key (user_id, kind)
);

create table public.consent_events (  -- append-only history
  id             bigint generated always as identity primary key,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  kind           text not null,
  granted        boolean not null,
  policy_version text not null,
  actor_user_id  uuid,
  at             timestamptz not null default now()
);
create index consent_events_user_idx on public.consent_events (user_id, at desc);

create table public.parent_links (
  id                    uuid primary key default gen_random_uuid(),
  minor_user_id         uuid not null references public.profiles(id) on delete cascade,
  parent_user_id        uuid not null references public.profiles(id) on delete cascade,
  status                text not null default 'pending' check (status in ('pending','active','revoked')),
  -- Counsel's rule: for 16-17 year olds the parent/guardian is the contracting party.
  is_contracting_party  boolean not null default true,
  created_at            timestamptz not null default now(),
  accepted_at           timestamptz,
  revoked_at            timestamptz,
  check (minor_user_id <> parent_user_id)
);
create unique index parent_links_open_uq on public.parent_links (minor_user_id, parent_user_id)
  where status in ('pending','active');
create unique index parent_links_one_active_contracting_uq on public.parent_links (minor_user_id)
  where status = 'active' and is_contracting_party;
create index parent_links_parent_idx on public.parent_links (parent_user_id);

create table public.coach_relationships (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  client_id  uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending','active','ended')),
  started_at timestamptz,
  ended_at   timestamptz,
  created_at timestamptz not null default now(),
  check (coach_id <> client_id)
);
create unique index coach_relationships_open_uq on public.coach_relationships (coach_id, client_id)
  where status in ('pending','active');
create index coach_relationships_client_idx on public.coach_relationships (client_id);

-- ---------------------------------------------------------------- RLS helpers (app schema)
-- SECURITY DEFINER so policies can look at tables the caller can't read. They only ever answer
-- questions about auth.uid(); roles come from user_roles, never from a JWT claim.

create or replace function app.has_role(p_role text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role = p_role)
$$;
create or replace function app.is_platform_admin() returns boolean language sql stable
  security definer set search_path = public, pg_temp as $$ select app.has_role('platform_admin') $$;
create or replace function app.is_verified_coach() returns boolean language sql stable
  security definer set search_path = public, pg_temp as $$ select app.has_role('coach_verified') $$;

create or replace function app.has_consent(p_user uuid, p_kind text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.consents c
                 where c.user_id = p_user and c.kind = p_kind and c.granted and c.revoked_at is null)
$$;

create or replace function app.is_active_parent_of(p_minor uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.parent_links l
                 where l.minor_user_id = p_minor and l.parent_user_id = auth.uid()
                   and l.status = 'active' and l.is_contracting_party)
$$;

-- Adults: true. 16-17: true only with an active contracting-party parent link.
create or replace function app.is_minor_onboarded(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p
    where p.id = p_user and p.deleted_at is null
      and (not p.is_minor or exists (select 1 from public.parent_links l
            where l.minor_user_id = p.id and l.status = 'active' and l.is_contracting_party)))
$$;

-- Caller is a verified coach with an ACTIVE relationship to p_client (no consent check).
create or replace function app.is_active_coach_of(p_client uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select app.is_verified_coach() and exists (select 1 from public.coach_relationships cr
    where cr.coach_id = auth.uid() and cr.client_id = p_client and cr.status = 'active')
$$;

-- Caller may read p_client's shared training data: verified coach + active relationship +
-- the client's coach_sharing consent + client usable (not deleted, minors have a parent).
-- Ending the relationship or revoking consent flips this to false immediately.
create or replace function app.coach_can_see(p_client uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select app.is_active_coach_of(p_client)
     and app.has_consent(p_client, 'coach_sharing')
     and app.is_minor_onboarded(p_client)
$$;

revoke all on all functions in schema app from public, anon;
grant execute on all functions in schema app to authenticated;

-- ---------------------------------------------------------------- RLS + grants
do $$
declare t text;
begin
  foreach t in array array['profiles','user_roles','consents','consent_events','parent_links','coach_relationships']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;
grant usage, select on all sequences in schema public to service_role;

-- profiles: own row (no birth_date column grant), coaches see consented clients. Update display_name only.
grant select (id, display_name, is_minor, deleted_at, created_at, updated_at) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_select_coach on public.profiles for select to authenticated
  using (app.coach_can_see(id));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- user_roles: read own row only. No write policy and no write grant for anyone but service/definer.
grant select on public.user_roles to authenticated;
create policy user_roles_select_own on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()));

-- consents / consent_events: read own (or as the active parent of a minor). Writes via functions only.
grant select on public.consents, public.consent_events to authenticated;
create policy consents_select_own on public.consents for select to authenticated
  using (user_id = (select auth.uid()) or app.is_active_parent_of(user_id));
create policy consent_events_select_own on public.consent_events for select to authenticated
  using (user_id = (select auth.uid()) or app.is_active_parent_of(user_id));

grant select on public.parent_links to authenticated;
create policy parent_links_select_party on public.parent_links for select to authenticated
  using (minor_user_id = (select auth.uid()) or parent_user_id = (select auth.uid()));

grant select on public.coach_relationships to authenticated;
create policy coach_relationships_select_party on public.coach_relationships for select to authenticated
  using (coach_id = (select auth.uid()) or client_id = (select auth.uid()));
