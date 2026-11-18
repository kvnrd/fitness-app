-- Phase 6 Coach Studio: deletion calendar, 3-strike close, teen coaching
-- approval (both must agree), parent "Coaching ended" label, review-queue
-- rules, hash-matching and DMCA form flags (off), document-only identity.

-- ------------------------------------------------------------------ flags (server)
create table if not exists private.app_flags (
  flag_name text primary key,
  enabled boolean not null default false,
  note text
);
insert into private.app_flags (flag_name, enabled, note) values
  ('dmca_form', false, 'Off until the designated agent is registered and 5.11 is real.'),
  ('hash_matching_live', false, 'Off until the vendor is live. Also covers demo videos.')
on conflict (flag_name) do nothing;

create or replace function app.flag(p_key text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select enabled from private.app_flags where flag_name = p_key), false)
$$;

create or replace function app.hash_matching_live() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select app.flag('hash_matching_live')
$$;

create or replace function app.dmca_form_enabled() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select app.flag('dmca_form')
$$;

-- Hash-matching enqueue: no-ops (and records nothing to a vendor) while the flag is off.
create table if not exists private.hash_match_queue (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('photo','demo_video')),
  subject_id uuid not null,
  queued_at timestamptz not null default now()
);

create or replace function public.enqueue_hash_match(p_kind text, p_subject uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_kind not in ('photo','demo_video') then raise exception 'invalid_argument' using errcode = '22023'; end if;
  if not app.hash_matching_live() then
    return false;
  end if;
  insert into private.hash_match_queue (kind, subject_id) values (p_kind, p_subject);
  return true;
end $$;
revoke all on function public.enqueue_hash_match(text, uuid) from public, anon, authenticated;
grant execute on function public.enqueue_hash_match(text, uuid) to service_role;

-- ------------------------------------------------------------------ deletion calendar (date + int, not timestamptz intervals)
create or replace function app.today_denver() returns date
language sql stable as $$
  select (timezone('America/Denver', now()))::date
$$;

create or replace function app.deletion_schedule(p_trigger date)
returns table (trigger_on date, reminder_on date, due_on date, pause_on date, suspend_on date)
language sql immutable as $$
  select p_trigger,
         (p_trigger + 23)::date,
         (p_trigger + 30)::date,
         (p_trigger + 31)::date,
         (p_trigger + 45)::date
$$;

create table public.coach_deletion_requests (
  id              uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.coach_relationships(id) on delete cascade,
  coach_id        uuid not null references public.profiles(id),
  client_id       uuid not null references public.profiles(id),
  trigger_on      date not null,
  reminder_on     date not null,
  due_on          date not null,
  pause_on        date not null,
  suspend_on      date not null,
  reminder_sent_at timestamptz,
  pause_applied_at timestamptz,
  suspend_applied_at timestamptz,
  confirmed_at    timestamptz,
  items           jsonb,
  attestation_version text,
  attestation_hash text check (attestation_hash is null or attestation_hash ~ '^[0-9a-f]{64}$'),
  created_at      timestamptz not null default now(),
  unique (relationship_id)
);
alter table public.coach_deletion_requests enable row level security;
alter table public.coach_deletion_requests force row level security;
grant select on public.coach_deletion_requests to authenticated;
create policy coach_deletion_select_own on public.coach_deletion_requests for select to authenticated
  using (coach_id = auth.uid() or client_id = auth.uid() or app.is_platform_admin());

create table public.trust_safety_tickets (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,
  coach_id   uuid not null references public.profiles(id),
  client_id  uuid references public.profiles(id),
  request_id uuid references public.coach_deletion_requests(id) on delete set null,
  opened_at  timestamptz not null default now(),
  unique (kind, request_id)
);
alter table public.trust_safety_tickets enable row level security;
alter table public.trust_safety_tickets force row level security;
-- Admin / service only.
grant select on public.trust_safety_tickets to authenticated;
create policy ts_tickets_admin_select on public.trust_safety_tickets for select to authenticated
  using (app.is_platform_admin());

alter table public.profiles
  add column if not exists new_clients_paused_at timestamptz,
  add column if not exists coach_suspended_at timestamptz,
  add column if not exists account_closed_at timestamptz;

create or replace function app.coach_accepting_clients(p_coach uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.profiles p
     join public.user_roles r on r.user_id = p.id and r.role = 'coach_verified'
    where p.id = p_coach
      and p.deleted_at is null
      and p.account_closed_at is null
      and p.coach_suspended_at is null
      and p.new_clients_paused_at is null
  )
$$;

create or replace function private.open_deletion_request(p_rel uuid, p_trigger date)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_rel public.coach_relationships%rowtype;
  v_id uuid;
  v_sched record;
begin
  select * into v_rel from public.coach_relationships where id = p_rel;
  if not found then raise exception 'invalid_relationship' using errcode = '22023'; end if;
  select * into v_sched from app.deletion_schedule(p_trigger);
  insert into public.coach_deletion_requests (
      relationship_id, coach_id, client_id,
      trigger_on, reminder_on, due_on, pause_on, suspend_on)
  values (p_rel, v_rel.coach_id, v_rel.client_id,
          v_sched.trigger_on, v_sched.reminder_on, v_sched.due_on, v_sched.pause_on, v_sched.suspend_on)
  on conflict (relationship_id) do update
    set trigger_on = excluded.trigger_on
  returning id into v_id;
  return v_id;
end $$;

-- Ending a relationship starts the 30-day clock and cuts off access immediately.
create or replace function public.end_coach_relationship(p_relationship_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_client uuid; v_rel public.coach_relationships%rowtype;
begin
  update public.coach_relationships set status = 'ended', ended_at = now()
   where id = p_relationship_id and status in ('pending','active')
     and (coach_id = auth.uid() or client_id = auth.uid())
  returning * into v_rel;
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  v_client := v_rel.client_id;
  perform private.open_deletion_request(v_rel.id, app.today_denver());
  perform private.log_audit(auth.uid(), 'coach_relationship_ended', v_client, '{}'::jsonb);
end $$;
grant execute on function public.end_coach_relationship(uuid) to authenticated, service_role;

-- Client asks the coach to delete (same clock: ends coaching right away).
create or replace function public.request_coach_deletion(p_relationship_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  perform public.end_coach_relationship(p_relationship_id);
  select id into v_id from public.coach_deletion_requests where relationship_id = p_relationship_id;
  return v_id;
end $$;
grant execute on function public.request_coach_deletion(uuid) to authenticated, service_role;

create or replace function public.confirm_client_deletion(
  p_request_id uuid, p_items jsonb, p_attested boolean,
  p_version text, p_hash text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_req public.coach_deletion_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select * into v_req from public.coach_deletion_requests where id = p_request_id and coach_id = auth.uid();
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_req.confirmed_at is not null then raise exception 'already_confirmed' using errcode = '22023'; end if;
  if p_attested is not true
     or p_version is null or length(btrim(p_version)) not between 1 and 64
     or p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'attestation_required' using errcode = '22023';
  end if;
  if p_items is null
     or jsonb_typeof(p_items) is distinct from 'object'
     or (select count(*) from jsonb_object_keys(p_items)) <> 7 then
    raise exception 'items_incomplete' using errcode = '22023';
  end if;
  update public.coach_deletion_requests
     set confirmed_at = now(), items = p_items,
         attestation_version = btrim(p_version), attestation_hash = p_hash
   where id = p_request_id;
end $$;
grant execute on function public.confirm_client_deletion(uuid, jsonb, boolean, text, text) to authenticated, service_role;

-- Day 23 reminder, day 31 pause + T&S ticket, day 45 suspend. p_today is the
-- America/Denver calendar date (defaults to today there).
create or replace function public.process_deletion_deadlines(p_today date default null)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_today date := coalesce(p_today, app.today_denver());
  v_n integer := 0;
  r public.coach_deletion_requests%rowtype;
begin
  if auth.role() is distinct from 'service_role' and not app.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  for r in
    select * from public.coach_deletion_requests where confirmed_at is null
  loop
    if r.reminder_on <= v_today and r.reminder_sent_at is null then
      update public.coach_deletion_requests set reminder_sent_at = now() where id = r.id;
      perform private.log_audit(r.coach_id, 'deletion_reminder', r.client_id, jsonb_build_object('due', r.due_on));
      v_n := v_n + 1;
    end if;
    if r.pause_on <= v_today and r.pause_applied_at is null then
      update public.coach_deletion_requests set pause_applied_at = now() where id = r.id;
      update public.profiles set new_clients_paused_at = coalesce(new_clients_paused_at, now()) where id = r.coach_id;
      insert into public.trust_safety_tickets (kind, coach_id, client_id, request_id)
      values ('deletion_overdue', r.coach_id, r.client_id, r.id)
      on conflict (kind, request_id) do nothing;
      perform private.log_audit(r.coach_id, 'deletion_overdue_pause', r.client_id, '{}'::jsonb);
      v_n := v_n + 1;
    end if;
    if r.suspend_on <= v_today and r.suspend_applied_at is null then
      update public.coach_deletion_requests set suspend_applied_at = now() where id = r.id;
      update public.profiles set coach_suspended_at = coalesce(coach_suspended_at, now()) where id = r.coach_id;
      perform private.log_audit(r.coach_id, 'coach_suspended', r.client_id, jsonb_build_object('due', r.due_on));
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end $$;
grant execute on function public.process_deletion_deadlines(date) to service_role;
-- platform admin may also run it (tests login as admin)
grant execute on function public.process_deletion_deadlines(date) to authenticated;

-- Pause new clients on redeem.
create or replace function public.redeem_trainer_code(p_code text, p_device_id text default null)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_ip text; v_ip_hash text; v_dev_hash text; v_hdr jsonb;
  v_row public.trainer_codes%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  begin
    v_hdr := coalesce(current_setting('request.headers', true), '')::jsonb;
    v_ip := coalesce(
      nullif(btrim(v_hdr ->> 'cf-connecting-ip'), ''),
      nullif(btrim(v_hdr ->> 'x-real-ip'), ''),
      nullif(btrim((regexp_split_to_array(coalesce(v_hdr ->> 'x-forwarded-for', ''), '\s*,\s*'))[
        array_length(regexp_split_to_array(coalesce(v_hdr ->> 'x-forwarded-for', ''), '\s*,\s*'), 1)]), ''));
  exception when others then v_ip := null;
  end;
  v_ip_hash := private.pepper_hash('ip', left(v_ip, 64));
  v_dev_hash := private.pepper_hash('device', left(p_device_id, 200));

  if (select count(*) from private.trainer_code_attempts where user_id = v_uid and not success and at > now() - interval '1 hour') >= 10
     or (select count(*) from private.trainer_code_attempts where user_id = v_uid and not success and at > now() - interval '1 day') >= 30
     or (v_ip_hash is not null and (select count(*) from private.trainer_code_attempts
           where ip_hash = v_ip_hash and not success and at > now() - interval '1 hour') >= 30)
     or (v_dev_hash is not null and (select count(*) from private.trainer_code_attempts
           where device_hash = v_dev_hash and not success and at > now() - interval '1 hour') >= 10) then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  select * into v_row from public.trainer_codes where code_hash = private.hash_trainer_code(coalesce(p_code, '')) for update;

  if not found or v_row.revoked or v_row.expires_at <= now()
     or v_row.redemptions >= v_row.max_redemptions or v_row.coach_id = v_uid
     or not exists (select 1 from public.user_roles where user_id = v_row.coach_id and role = 'coach_verified')
     or not app.is_minor_onboarded(v_uid)
     or not app.coach_accepting_clients(v_row.coach_id) then
    insert into private.trainer_code_attempts (user_id, ip_hash, device_hash, success) values (v_uid, v_ip_hash, v_dev_hash, false);
    return false;
  end if;

  if not exists (select 1 from public.coach_relationships
                  where coach_id = v_row.coach_id and client_id = v_uid and status = 'active') then
    insert into public.coach_relationships (coach_id, client_id, status, started_at)
    values (v_row.coach_id, v_uid, 'active', now())
    on conflict (coach_id, client_id) where status in ('pending','active') do update set status = 'active', started_at = now();
    update public.trainer_codes set redemptions = redemptions + 1 where id = v_row.id;
  end if;
  insert into private.trainer_code_attempts (user_id, ip_hash, device_hash, success) values (v_uid, v_ip_hash, v_dev_hash, true);
  perform private.log_audit(v_uid, 'trainer_code_redeemed', v_row.coach_id, jsonb_build_object('code_id', v_row.id));
  return true;
end $$;
grant execute on function public.redeem_trainer_code(text, text) to authenticated, service_role;

-- ------------------------------------------------------------------ 3-strike close
create table public.copyright_notices (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id),
  upheld      boolean not null,
  noticed_on  date not null,
  created_at  timestamptz not null default now()
);
alter table public.copyright_notices enable row level security;
alter table public.copyright_notices force row level security;
grant select on public.copyright_notices to authenticated;
create policy copyright_notices_admin_or_own on public.copyright_notices for select to authenticated
  using (coach_id = auth.uid() or app.is_platform_admin());

create or replace function app.upheld_strikes(p_coach uuid, p_as_of date)
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select count(*)::integer from public.copyright_notices
   where coach_id = p_coach and upheld
     and noticed_on <= p_as_of
     and noticed_on >= (p_as_of - interval '1 year')::date
$$;

create or replace function public.record_copyright_notice(p_coach uuid, p_upheld boolean, p_noticed_on date)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() is distinct from 'service_role' and not app.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.copyright_notices (coach_id, upheld, noticed_on) values (p_coach, p_upheld, p_noticed_on);
  if app.upheld_strikes(p_coach, p_noticed_on) >= 3 then
    update public.profiles set account_closed_at = coalesce(account_closed_at, now()) where id = p_coach;
    -- Close the coach role. Admin path only.
    if exists (select 1 from public.user_roles where user_id = p_coach and role in ('coach_verified','coach_pending')) then
      perform public.set_user_role(p_coach, 'athlete');
    end if;
    perform private.log_audit(p_coach, 'account_closed_copyright', p_coach, '{}'::jsonb);
  end if;
end $$;
grant execute on function public.record_copyright_notice(uuid, boolean, date) to authenticated, service_role;

-- ------------------------------------------------------------------ apply: require Coach Terms; never auto-approves
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
  if not app.has_consent(v_uid, 'coach_terms') then
    raise exception 'coach_terms_required' using errcode = '42501';
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

-- review_coach_application already requires admin/service + identity passed.
-- No trigger auto-approves. Add need_info status for screen 09.
alter table public.coach_applications drop constraint if exists coach_applications_status_check;
alter table public.coach_applications add constraint coach_applications_status_check
  check (status in ('submitted','under_review','need_info','approved','rejected','withdrawn'));

-- ------------------------------------------------------------------ 70e: both must agree before anything is shared
create table public.teen_coaching_approvals (
  id                 uuid primary key default gen_random_uuid(),
  minor_id           uuid not null references public.profiles(id),
  parent_id          uuid not null references public.profiles(id),
  coach_id           uuid not null references public.profiles(id),
  parent_approved_at timestamptz,
  teen_agreed_at     timestamptz,
  sharing_started_at timestamptz,
  unique (minor_id, coach_id)
);
alter table public.teen_coaching_approvals enable row level security;
alter table public.teen_coaching_approvals force row level security;
grant select on public.teen_coaching_approvals to authenticated;
create policy teen_coach_approval_select on public.teen_coaching_approvals for select to authenticated
  using (minor_id = auth.uid() or parent_id = auth.uid() or coach_id = auth.uid() or app.is_platform_admin());

create or replace function app.teen_coaching_share_active(p_minor uuid, p_coach uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.teen_coaching_approvals a
     where a.minor_id = p_minor and a.coach_id = p_coach
       and a.parent_approved_at is not null
       and a.teen_agreed_at is not null
       and a.sharing_started_at is not null
  )
$$;

create or replace function private.maybe_start_teen_share(p_minor uuid, p_coach uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.teen_coaching_approvals
     set sharing_started_at = now()
   where minor_id = p_minor and coach_id = p_coach
     and parent_approved_at is not null and teen_agreed_at is not null
     and sharing_started_at is null;
end $$;

create or replace function public.parent_approve_teen_coaching(p_minor uuid, p_coach uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not app.is_active_parent_of(p_minor) then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into public.teen_coaching_approvals (minor_id, parent_id, coach_id, parent_approved_at)
  values (p_minor, v_uid, p_coach, now())
  on conflict (minor_id, coach_id) do update
    set parent_approved_at = coalesce(public.teen_coaching_approvals.parent_approved_at, now()),
        parent_id = excluded.parent_id;
  perform private.maybe_start_teen_share(p_minor, p_coach);
end $$;
grant execute on function public.parent_approve_teen_coaching(uuid, uuid) to authenticated;

create or replace function public.teen_agree_teen_coaching(p_coach uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles where id = v_uid and is_minor and deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.teen_coaching_approvals (minor_id, parent_id, coach_id, teen_agreed_at)
  values (
    v_uid,
    (select parent_user_id from public.parent_links
      where minor_user_id = v_uid and status = 'active' and is_contracting_party limit 1),
    p_coach, now())
  on conflict (minor_id, coach_id) do update
    set teen_agreed_at = coalesce(public.teen_coaching_approvals.teen_agreed_at, now());
  perform private.maybe_start_teen_share(v_uid, p_coach);
end $$;
grant execute on function public.teen_agree_teen_coaching(uuid) to authenticated;

-- Parent-facing label after a teen block/report: only "Coaching ended".
-- T&S may record an internal safety note (admin only); it is never returned by the product label.
create table public.parent_safety_notices (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references public.profiles(id),
  minor_id   uuid not null references public.profiles(id),
  body       text not null,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
alter table public.parent_safety_notices enable row level security;
alter table public.parent_safety_notices force row level security;
grant select on public.parent_safety_notices to authenticated;
create policy parent_safety_admin_only on public.parent_safety_notices for select to authenticated
  using (app.is_platform_admin());

create or replace function public.parent_coaching_label(p_minor uuid)
returns text language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_ended boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not app.is_active_parent_of(p_minor) and v_uid is distinct from p_minor then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select exists (
    select 1 from public.coach_relationships cr
     where cr.client_id = p_minor and cr.status = 'ended'
  ) into v_ended;
  if v_ended then return 'Coaching ended'; end if;
  return null;
end $$;
grant execute on function public.parent_coaching_label(uuid) to authenticated;

create or replace function public.set_parent_safety_notice(p_parent uuid, p_minor uuid, p_body text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not app.is_platform_admin() and auth.role() is distinct from 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.parent_safety_notices (parent_id, minor_id, body, created_by)
  values (p_parent, p_minor, p_body, auth.uid());
end $$;
grant execute on function public.set_parent_safety_notice(uuid, uuid, text) to authenticated, service_role;

-- If the 70e path has started (an approval row exists), the coach sees nothing
-- until both the parent and the teen have agreed. Existing relationships
-- without an approval row keep the earlier dual-consent rule.
create or replace function app.coach_can_see(p_client uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select app.is_active_coach_of(p_client)
     and app.has_consent(p_client, 'coach_sharing')
     and app.is_minor_onboarded(p_client)
     and (
       not exists (select 1 from public.profiles p where p.id = p_client and p.is_minor)
       or not exists (
         select 1 from public.teen_coaching_approvals a
          where a.minor_id = p_client and a.coach_id = auth.uid())
       or app.teen_coaching_share_active(p_client, auth.uid())
     )
$$;

grant execute on function
  app.today_denver(),
  app.deletion_schedule(date),
  app.flag(text),
  app.hash_matching_live(),
  app.dmca_form_enabled(),
  app.coach_accepting_clients(uuid),
  app.upheld_strikes(uuid, date),
  app.teen_coaching_share_active(uuid, uuid),
  app.coach_can_see(uuid)
  to authenticated, service_role;

grant usage on schema private to service_role;
grant execute on function private.open_deletion_request(uuid, date), private.maybe_start_teen_share(uuid, uuid)
  to service_role;
grant select, insert on private.hash_match_queue to service_role;
grant select, update on private.app_flags to service_role;

grant all on table
  public.coach_deletion_requests,
  public.trust_safety_tickets,
  public.copyright_notices,
  public.teen_coaching_approvals,
  public.parent_safety_notices
  to service_role;

grant usage on schema app to service_role;

alter table private.app_flags enable row level security;
alter table private.app_flags force row level security;
alter table private.hash_match_queue enable row level security;
alter table private.hash_match_queue force row level security;

revoke all on function
  app.today_denver(),
  app.deletion_schedule(date),
  app.flag(text),
  app.hash_matching_live(),
  app.dmca_form_enabled(),
  app.coach_accepting_clients(uuid),
  app.upheld_strikes(uuid, date),
  app.teen_coaching_share_active(uuid, uuid),
  public.enqueue_hash_match(text, uuid),
  public.process_deletion_deadlines(date),
  public.request_coach_deletion(uuid),
  public.confirm_client_deletion(uuid, jsonb, boolean, text, text),
  public.record_copyright_notice(uuid, boolean, date),
  public.parent_approve_teen_coaching(uuid, uuid),
  public.teen_agree_teen_coaching(uuid),
  public.parent_coaching_label(uuid),
  public.set_parent_safety_notice(uuid, uuid, text)
  from public, anon;
revoke all on function private.open_deletion_request(uuid, date), private.maybe_start_teen_share(uuid, uuid)
  from public, anon, authenticated;
