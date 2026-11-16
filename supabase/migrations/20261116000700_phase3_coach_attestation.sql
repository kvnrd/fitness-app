-- Phase 3 / Counsel phase3-build-answers.md §2 (Nov 16, 2026): two coach attestations.
--  * Every applicant must check the general box. apply_for_coach records its version + SHA-256 + timestamp
--    as its own append-only row, and stores the hash on the application.
--  * The 16-17 box is optional and separately logged. Checking it does not, by itself, allow minor clients.
--  * A coach may take a minor client only when the minors attestation, an NSOPW result of 'passed', and a
--    youth-safety training record are all on file (app.can_coach_minors). Enforced on every
--    coach_relationships write, including redeem_trainer_code.
-- No insurance requirement. The deletion line is enforceable only when the Coach Terms say the same.
-- [Company] and [Coach Terms] stay as placeholders until Kevin/Counsel fill them. [ATTORNEY]

-- ------------------------------------------------------------------ columns on the application
alter table public.coach_applications
  add column attestation_hash            text check (attestation_hash is null or attestation_hash ~ '^[0-9a-f]{64}$'),
  add column minors_attested_at          timestamptz,
  add column minors_attestation_version  text check (minors_attestation_version is null or length(minors_attestation_version) between 1 and 64),
  add column minors_attestation_hash     text check (minors_attestation_hash is null or minors_attestation_hash ~ '^[0-9a-f]{64}$'),
  add column nsopw_status                text not null default 'not_started'
             check (nsopw_status in ('not_started','pending','passed','failed')),
  add column nsopw_ref                   text check (nsopw_ref is null or length(nsopw_ref) <= 255),
  add column nsopw_checked_at            timestamptz,
  add column minor_training_completed_at timestamptz,
  add column minor_training_ref          text check (minor_training_ref is null or length(minor_training_ref) <= 255);

-- Snapshot of minor-client clearance, including coaches verified without an application (test/admin path).
create table public.coach_minor_clearance (
  coach_id                uuid primary key references public.profiles(id) on delete cascade,
  minors_attested_at      timestamptz,
  minors_version          text check (minors_version is null or length(minors_version) between 1 and 64),
  minors_hash             text check (minors_hash is null or minors_hash ~ '^[0-9a-f]{64}$'),
  nsopw_status            text not null default 'not_started'
                          check (nsopw_status in ('not_started','pending','passed','failed')),
  nsopw_ref               text check (nsopw_ref is null or length(nsopw_ref) <= 255),
  nsopw_checked_at        timestamptz,
  training_completed_at   timestamptz,
  training_ref            text check (training_ref is null or length(training_ref) <= 255),
  updated_at              timestamptz not null default now(),
  check (minors_attested_at is null or (minors_version is not null and minors_hash is not null))
);
alter table public.coach_minor_clearance enable row level security;
alter table public.coach_minor_clearance force row level security;
grant select on public.coach_minor_clearance to authenticated;
create policy coach_minor_clearance_select_own on public.coach_minor_clearance for select to authenticated
  using (coach_id = auth.uid());

-- Append-only log of each checkbox (version + SHA-256 + timestamp). No client writes.
create table public.coach_attestation_events (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid not null references public.profiles(id) on delete cascade,
  application_id  uuid references public.coach_applications(id) on delete set null,
  kind            text not null check (kind in ('general','minors')),
  policy_version  text not null check (length(policy_version) between 1 and 64),
  text_hash       text not null check (text_hash ~ '^[0-9a-f]{64}$'),
  recorded_at     timestamptz not null default now()
);
create index coach_attestation_events_coach_idx on public.coach_attestation_events (coach_id, kind, recorded_at desc);
alter table public.coach_attestation_events enable row level security;
alter table public.coach_attestation_events force row level security;
grant select on public.coach_attestation_events to authenticated;
create policy coach_attestation_events_select_own on public.coach_attestation_events for select to authenticated
  using (coach_id = auth.uid());

create or replace function app.can_coach_minors(p_coach uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.coach_minor_clearance c
     where c.coach_id = p_coach
       and c.minors_attested_at is not null
       and c.minors_version is not null
       and c.minors_hash is not null
       and c.nsopw_status = 'passed'
       and c.training_completed_at is not null
  );
$$;
revoke all on function app.can_coach_minors(uuid) from public, anon, authenticated, service_role;
grant execute on function app.can_coach_minors(uuid) to authenticated;

create or replace function private.coach_relationships_minor_gate()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = 'active'
     and exists (select 1 from public.profiles p where p.id = new.client_id and p.is_minor and p.deleted_at is null)
     and not app.can_coach_minors(new.coach_id) then
    raise exception 'minors_coaching_not_allowed' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists coach_relationships_minor_gate on public.coach_relationships;
create trigger coach_relationships_minor_gate
  before insert or update of status, client_id, coach_id on public.coach_relationships
  for each row execute function private.coach_relationships_minor_gate();

create or replace function private.write_coach_attestation(
  p_coach uuid, p_application uuid, p_kind text, p_version text, p_hash text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.coach_attestation_events (coach_id, application_id, kind, policy_version, text_hash)
  values (p_coach, p_application, p_kind, btrim(p_version), p_hash);
end $$;

create or replace function private.upsert_minors_attestation(
  p_coach uuid, p_application uuid, p_version text, p_hash text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.coach_minor_clearance (coach_id, minors_attested_at, minors_version, minors_hash)
  values (p_coach, now(), btrim(p_version), p_hash)
  on conflict (coach_id) do update
    set minors_attested_at = excluded.minors_attested_at,
        minors_version     = excluded.minors_version,
        minors_hash        = excluded.minors_hash,
        updated_at         = now();
  if p_application is not null then
    update public.coach_applications
       set minors_attested_at = now(),
           minors_attestation_version = btrim(p_version),
           minors_attestation_hash = p_hash
     where id = p_application;
  end if;
  perform private.write_coach_attestation(p_coach, p_application, 'minors', p_version, p_hash);
end $$;

drop function if exists public.apply_for_coach(boolean, text, text, text, date);
create or replace function public.apply_for_coach(
  p_attest_adult boolean, p_attestation_version text, p_attestation_hash text,
  p_minors_attest boolean default false,
  p_minors_version text default null, p_minors_hash text default null,
  p_certification_name text default null, p_certification_issuer text default null,
  p_certification_expires_on date default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_attest_adult is not true
     or p_attestation_version is null or length(btrim(p_attestation_version)) not between 1 and 64
     or p_attestation_hash is null or p_attestation_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'attestation_required' using errcode = '22023';
  end if;
  if p_minors_attest is true
     and (p_minors_version is null or length(btrim(p_minors_version)) not between 1 and 64
          or p_minors_hash is null or p_minors_hash !~ '^[0-9a-f]{64}$') then
    raise exception 'attestation_required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and not is_minor and deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.user_roles set role = 'coach_pending', granted_at = now(), granted_by = null
   where user_id = v_uid and role = 'athlete';
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into public.coach_applications (
      applicant_id, certification_name, certification_issuer, certification_expires_on,
      adult_attested_at, attestation_version, attestation_hash)
  values (v_uid, p_certification_name, p_certification_issuer, p_certification_expires_on,
          now(), btrim(p_attestation_version), p_attestation_hash)
  returning id into v_id;
  perform private.write_coach_attestation(v_uid, v_id, 'general', p_attestation_version, p_attestation_hash);
  if p_minors_attest is true then
    perform private.upsert_minors_attestation(v_uid, v_id, p_minors_version, p_minors_hash);
  end if;
  perform private.log_audit(v_uid, 'coach_applied', v_uid, '{}'::jsonb);
  return v_id;
end $$;
grant execute on function
  public.apply_for_coach(boolean, text, text, boolean, text, text, text, text, date)
  to authenticated, service_role;

-- Existing pending or verified coaches can add the 16-17 box later.
create or replace function public.record_coach_minors_attestation(p_version text, p_hash text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_app uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_version is null or length(btrim(p_version)) not between 1 and 64
     or p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'attestation_required' using errcode = '22023';
  end if;
  if not exists (
       select 1 from public.user_roles r
        join public.profiles p on p.id = r.user_id
       where r.user_id = v_uid and r.role in ('coach_pending','coach_verified')
         and not p.is_minor and p.deleted_at is null
     ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select id into v_app from public.coach_applications
   where applicant_id = v_uid and status in ('submitted','under_review','approved')
   order by submitted_at desc limit 1;
  perform private.upsert_minors_attestation(v_uid, v_app, p_version, p_hash);
end $$;
grant execute on function public.record_coach_minors_attestation(text, text) to authenticated;

-- Service only: record the NSOPW result id and status. A 'passed' result is required to coach minors.
create or replace function public.set_coach_nsopw(p_coach_id uuid, p_status text, p_ref text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_status not in ('pending','passed','failed') then raise exception 'invalid_status' using errcode = '22023'; end if;
  if p_ref is not null and length(p_ref) > 255 then raise exception 'invalid_argument' using errcode = '22023'; end if;
  insert into public.coach_minor_clearance (coach_id, nsopw_status, nsopw_ref, nsopw_checked_at)
  values (p_coach_id, p_status, p_ref, now())
  on conflict (coach_id) do update
    set nsopw_status     = excluded.nsopw_status,
        nsopw_ref        = excluded.nsopw_ref,
        nsopw_checked_at = now(),
        updated_at       = now();
  update public.coach_applications
     set nsopw_status = p_status, nsopw_ref = p_ref, nsopw_checked_at = now()
   where applicant_id = p_coach_id and status in ('submitted','under_review','approved');
end $$;
grant execute on function public.set_coach_nsopw(uuid, text, text) to service_role;

-- Service only: record that youth-safety / Texas reporting training is on file.
create or replace function public.set_coach_minor_training(p_coach_id uuid, p_ref text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_ref is null or length(btrim(p_ref)) not between 1 and 255 then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  insert into public.coach_minor_clearance (coach_id, training_completed_at, training_ref)
  values (p_coach_id, now(), btrim(p_ref))
  on conflict (coach_id) do update
    set training_completed_at = now(),
        training_ref          = excluded.training_ref,
        updated_at            = now();
  update public.coach_applications
     set minor_training_completed_at = now(), minor_training_ref = btrim(p_ref)
   where applicant_id = p_coach_id and status in ('submitted','under_review','approved');
end $$;
grant execute on function public.set_coach_minor_training(uuid, text) to service_role;

-- Default PUBLIC execute grants would let anon see these in the catalog of callable functions.
revoke all on function
  private.write_coach_attestation(uuid, uuid, text, text, text),
  private.upsert_minors_attestation(uuid, uuid, text, text),
  private.coach_relationships_minor_gate()
  from public, anon, authenticated, service_role;
revoke all on function
  public.apply_for_coach(boolean, text, text, boolean, text, text, text, text, date),
  public.record_coach_minors_attestation(text, text)
  from public, anon;
grant execute on function
  public.apply_for_coach(boolean, text, text, boolean, text, text, text, text, date)
  to authenticated, service_role;
grant execute on function public.record_coach_minors_attestation(text, text) to authenticated;
revoke all on function
  public.set_coach_nsopw(uuid, text, text),
  public.set_coach_minor_training(uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_coach_nsopw(uuid, text, text) to service_role;
grant execute on function public.set_coach_minor_training(uuid, text) to service_role;
