-- Phase 2 / health_records (encrypted), coach_applications, trainer_codes, audit_log, requests.

create table public.health_records (
  user_id                  uuid primary key references public.profiles(id) on delete cascade,
  injury_notes_cipher      bytea,
  health_screen_cipher     bytea,
  key_name                 text not null,   -- which private.encryption_keys row encrypted this
  updated_at               timestamptz not null default now()
  -- Plaintext is never stored. Access ONLY through write_health_record / read_health_record.
);

create table public.coach_applications (
  id                  uuid primary key default gen_random_uuid(),
  applicant_id        uuid not null references public.profiles(id) on delete cascade,
  status              text not null default 'submitted'
                      check (status in ('submitted','under_review','approved','rejected','withdrawn')),
  certification_name  text check (length(certification_name) <= 200),
  certification_issuer text check (length(certification_issuer) <= 200),
  certification_expires_on date,
  submitted_at        timestamptz not null default now(),
  reviewed_by         uuid,
  reviewed_at         timestamptz
);
create unique index coach_applications_open_uq on public.coach_applications (applicant_id)
  where status in ('submitted','under_review');

create table public.trainer_codes (  -- stub. Hashes only; the raw code is shown once at creation, server side.
  id               uuid primary key default gen_random_uuid(),
  code_hash        text not null unique,
  coach_id         uuid not null references public.profiles(id) on delete cascade,
  max_redemptions  integer not null default 25 check (max_redemptions > 0),
  redemptions      integer not null default 0 check (redemptions >= 0),
  expires_at       timestamptz,
  revoked          boolean not null default false,
  created_at       timestamptz not null default now()
);

create table public.audit_log (
  id             bigint generated always as identity primary key,
  at             timestamptz not null default now(),
  actor_id       uuid,      -- no FK: rows must outlive account deletion
  action         text not null,
  target_user_id uuid,
  metadata       jsonb not null default '{}'::jsonb  -- NEVER health values, emails, tokens, codes
);
create index audit_log_actor_idx on public.audit_log (actor_id, at desc);
create index audit_log_target_idx on public.audit_log (target_user_id, at desc);

create table public.data_export_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,   -- no FK: the request record outlives the account
  status       text not null default 'pending' check (status in ('pending','processing','completed','rejected')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index data_export_pending_uq on public.data_export_requests (user_id) where status = 'pending';

create table public.account_deletion_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,   -- no FK: the request record outlives the account
  status       text not null default 'pending' check (status in ('pending','processing','completed','cancelled')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index account_deletion_pending_uq on public.account_deletion_requests (user_id) where status = 'pending';

-- Insert-only audit helper. Lives in private: only definer functions (owner) can call it.
create or replace function private.log_audit(p_actor uuid, p_action text, p_target uuid, p_metadata jsonb default '{}'::jsonb)
returns void language sql as $$
  insert into public.audit_log (actor_id, action, target_user_id, metadata)
  values (p_actor, p_action, p_target, coalesce(p_metadata, '{}'::jsonb))
$$;

do $$
declare t text;
begin
  foreach t in array array['health_records','coach_applications','trainer_codes','audit_log',
                           'data_export_requests','account_deletion_requests']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;
grant usage, select on all sequences in schema public to service_role;

-- health_records: no grants, no policies for clients. Ciphertext is unreachable except via functions.

grant select on public.coach_applications to authenticated;
create policy coach_applications_select_own on public.coach_applications for select to authenticated
  using (applicant_id = (select auth.uid()));

-- trainer_codes: a coach may list their own codes' metadata, never the hash.
grant select (id, coach_id, max_redemptions, redemptions, expires_at, revoked, created_at)
  on public.trainer_codes to authenticated;
create policy trainer_codes_select_own on public.trainer_codes for select to authenticated
  using (coach_id = (select auth.uid()));

-- audit_log: read-only for clients. Platform admins read all; users read rows they acted in.
grant select on public.audit_log to authenticated;
create policy audit_log_select_admin on public.audit_log for select to authenticated
  using (app.is_platform_admin());
create policy audit_log_select_own on public.audit_log for select to authenticated
  using (actor_id = (select auth.uid()));

-- requests: insert own, read own. No update/delete for clients.
grant select on public.data_export_requests, public.account_deletion_requests to authenticated;
grant insert (user_id) on public.data_export_requests, public.account_deletion_requests to authenticated;
create policy data_export_select_own on public.data_export_requests for select to authenticated
  using (user_id = (select auth.uid()));
create policy data_export_insert_own on public.data_export_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
create policy account_deletion_select_own on public.account_deletion_requests for select to authenticated
  using (user_id = (select auth.uid()));
create policy account_deletion_insert_own on public.account_deletion_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
