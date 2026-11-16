-- Phase 2b / age (Counsel C1, C2, C6, Q3, Q4, Q11).
--  * profiles keep an age band + adult_on date, never the raw date of birth (C2).
--  * The app-store age signal (Apple Declared Age Range / Google Play Age Signals) is combined with
--    the DOB and the LOWER age wins (C1). Only the band, which source governed, and a timestamp are
--    kept. The raw store response never reaches the database: the client sends only the derived
--    lower/upper bounds, and those bounds are not stored either.
--  * public.screen_age() lets the app run the age screen BEFORE an email or auth account exists (C6).
--  * complete_signup() deletes the caller's auth user in the same request when the age is not
--    eligible (Q4), with public.purge_unprofiled_auth_users() as the backup job.
--  * Coaches must be adults (Q11), enforced on user_roles for every writer, including service_role.

-- ------------------------------------------------------------------ profiles: DOB -> band + adult_on
alter table public.profiles
  add column age_band        text,
  add column adult_on        date,          -- the day a 16-17 user turns 18 (kept after the flip: retention needs it)
  add column age_source      text,          -- which signal governed the band
  add column store_signal    text,          -- which store signal was received, if any (yes/no + which store, no payload)
  add column age_verified_at timestamptz;

update public.profiles set
  age_band        = case when app.age_years(birth_date) < 18 then '16_17' else '18_plus' end,
  adult_on        = case when app.age_years(birth_date) < 18 then (birth_date + interval '18 years')::date end,
  age_source      = 'self_declared_dob',
  age_verified_at = created_at;

drop trigger profiles_set_is_minor on public.profiles;
drop function private.profiles_set_is_minor();
alter table public.profiles drop column birth_date;   -- Counsel C2: the raw DOB is not kept

alter table public.profiles
  alter column age_band set not null,
  alter column age_source set not null,
  alter column age_verified_at set not null,
  add constraint profiles_age_band_chk check (age_band in ('16_17','18_plus')),
  add constraint profiles_age_source_chk check (age_source in ('self_declared_dob','apple_declared_age_range','google_play_age_signals')),
  add constraint profiles_store_signal_chk check (store_signal is null or store_signal in ('apple_declared_age_range','google_play_age_signals')),
  add constraint profiles_minor_has_adult_on_chk check (age_band = '18_plus' or adult_on is not null);

-- is_minor and age_band are derived from adult_on, never client-written.
create or replace function private.profiles_derive_age()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.is_minor := new.adult_on is not null and new.adult_on > current_date;
  new.age_band := case when new.is_minor then '16_17' else '18_plus' end;
  return new;
end $$;
create trigger profiles_derive_age before insert or update on public.profiles
  for each row execute function private.profiles_derive_age();

-- ------------------------------------------------------------------ aggregate-only rejection counts
-- Counsel Q4/Q10: rejected signups keep NO personal data. Only a per-day count.
create table private.signup_screen_counts (
  day     date not null default current_date,
  stage   text not null check (stage in ('screen','signup')),
  outcome text not null check (outcome in ('ineligible')),
  n       integer not null default 0,
  primary key (day, stage, outcome)
);
alter table private.signup_screen_counts enable row level security;
alter table private.signup_screen_counts force row level security;
revoke all on table private.signup_screen_counts from public, anon, authenticated;

create or replace function private.count_rejection(p_stage text)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into private.signup_screen_counts (day, stage, outcome, n) values (current_date, p_stage, 'ineligible', 1)
  on conflict (day, stage, outcome) do update set n = private.signup_screen_counts.n + 1
$$;

-- ------------------------------------------------------------------ age derivation (one place)
-- Lowest age indicated wins (Utah / Texas SB 2420 / CA AB 1043 per Counsel C1).
-- Store signal: lower/upper bound in whole years from the store's declared range. A range with only an
-- upper bound (e.g. "under 13") counts as lowest age 0. adult_on for a minor is the LATEST date implied
-- by any signal (DOB + 18y, or today + (18 - store lower bound) years).
create or replace function private.derive_age(
  p_birth_date date, p_store_lower integer, p_store_upper integer, p_store_source text,
  out eligible boolean, out age_band text, out adult_on date, out age_source text, out store_signal text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_dob_age integer; v_store_low integer; v_low integer; v_dob_adult date; v_store_adult date;
begin
  if p_birth_date is null or p_birth_date > current_date or p_birth_date < current_date - interval '120 years' then
    raise exception 'invalid_birth_date' using errcode = '22023';
  end if;
  if p_store_source is not null and p_store_source not in ('apple_declared_age_range','google_play_age_signals') then
    raise exception 'invalid_age_signal' using errcode = '22023';
  end if;
  if (p_store_lower is not null and (p_store_lower < 0 or p_store_lower > 120))
     or (p_store_upper is not null and (p_store_upper < 0 or p_store_upper > 120))
     or (p_store_lower is not null and p_store_upper is not null and p_store_upper < p_store_lower)
     or (p_store_source is null and (p_store_lower is not null or p_store_upper is not null)) then
    raise exception 'invalid_age_signal' using errcode = '22023';
  end if;

  v_dob_age := app.age_years(p_birth_date);
  v_store_low := case when p_store_source is null then null
                      when p_store_lower is not null then p_store_lower
                      when p_store_upper is not null then 0 end;
  v_low := least(v_dob_age, coalesce(v_store_low, v_dob_age));
  store_signal := case when v_store_low is not null then p_store_source end;
  age_source := case when v_store_low is not null and v_store_low < v_dob_age then p_store_source else 'self_declared_dob' end;

  if v_low < 16 then          -- under 13 and 13-15 are both blocked (Counsel: 13-15 stays blocked)
    eligible := false; return;
  end if;
  eligible := true;
  if v_low >= 18 then
    age_band := '18_plus'; adult_on := null; return;
  end if;
  v_dob_adult := case when v_dob_age < 18 then (p_birth_date + interval '18 years')::date end;
  v_store_adult := case when v_store_low is not null and v_store_low < 18
                        then (current_date + make_interval(years => 18 - v_store_low))::date end;
  adult_on := greatest(v_dob_adult, v_store_adult);   -- greatest() ignores nulls
  age_band := '16_17';
end $$;

-- ------------------------------------------------------------------ neutral age screen (no account yet)
-- Callable by anon. Stores nothing about the person: no DOB, no IP, no id. Returns only eligible yes/no.
create or replace function public.screen_age(p_birth_date date, p_store_lower integer default null,
  p_store_upper integer default null, p_store_source text default null)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare d record;
begin
  select * into d from private.derive_age(p_birth_date, p_store_lower, p_store_upper, p_store_source);
  if not d.eligible then perform private.count_rejection('screen'); end if;
  return jsonb_build_object('eligible', d.eligible);
end $$;

-- ------------------------------------------------------------------ signup
drop function public.complete_signup(date, text);
create or replace function public.complete_signup(p_birth_date date, p_display_name text default null,
  p_store_lower integer default null, p_store_upper integer default null, p_store_source text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_name text := nullif(btrim(p_display_name), '');
  d record;
  v_minor boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- Checked first: an existing account can never be deleted through this function.
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'already_signed_up' using errcode = '23505';
  end if;
  select * into d from private.derive_age(p_birth_date, p_store_lower, p_store_upper, p_store_source);
  if not d.eligible then
    -- Counsel Q4: delete the auth user (and its email) in the SAME request. We return instead of raising
    -- so the delete commits. Only an aggregate count is kept. Backup: purge_unprofiled_auth_users().
    delete from auth.users where id = v_uid;
    perform private.count_rejection('signup');
    return jsonb_build_object('eligible', false);
  end if;
  if v_name is not null and length(v_name) > 80 then raise exception 'invalid_display_name' using errcode = '22023'; end if;

  insert into public.profiles (id, display_name, adult_on, age_band, age_source, store_signal, age_verified_at)
  values (v_uid, v_name, d.adult_on, d.age_band, d.age_source, d.store_signal, now())
  returning is_minor into v_minor;
  insert into public.user_roles (user_id, role) values (v_uid, 'athlete');
  perform private.log_audit(v_uid, 'signup_completed', v_uid, jsonb_build_object('is_minor', v_minor));
  return jsonb_build_object('eligible', true, 'is_minor', v_minor, 'onboarded', app.is_minor_onboarded(v_uid));
end $$;

-- Daily: flips is_minor/age_band when adult_on is reached (trigger recomputes).
create or replace function public.recompute_minor_flags()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.profiles set adult_on = adult_on
  where is_minor is distinct from (adult_on is not null and adult_on > current_date);
  get diagnostics n = row_count;
  return n;
end $$;

-- Backup purge (Counsel Q4): auth users that never completed the age step (abandoned, or a rejected
-- signup whose same-request delete did not happen). No profile => nothing else to keep.
create or replace function public.purge_unprofiled_auth_users(p_older_than interval default interval '24 hours')
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  delete from auth.users u
   where u.created_at < now() - p_older_than
     and not exists (select 1 from public.profiles p where p.id = u.id);
  get diagnostics n = row_count;
  if n > 0 then perform private.log_audit(auth.uid(), 'purged_unprofiled_auth_users', null, jsonb_build_object('count', n)); end if;
  return n;
end $$;

-- ------------------------------------------------------------------ coaches are adults (Q11)
alter table public.coach_applications
  add column adult_attested_at      timestamptz,
  add column attestation_version    text check (attestation_version is null or length(attestation_version) between 1 and 64),
  add column identity_check_status  text not null default 'not_started'
             check (identity_check_status in ('not_started','pending','passed','failed')),
  add column identity_check_ref     text check (identity_check_ref is null or length(identity_check_ref) <= 255);
  -- identity_check_ref: the provider's verification/result id only (e.g. Stripe Identity session id). No images.

-- Every writer (client, definer function, service_role, admin) hits this trigger.
create or replace function private.user_roles_coach_adult()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.role in ('coach_pending','coach_verified')
     and not exists (select 1 from public.profiles p where p.id = new.user_id and not p.is_minor and p.deleted_at is null) then
    raise exception 'coach_must_be_adult' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger user_roles_coach_adult before insert or update on public.user_roles
  for each row execute function private.user_roles_coach_adult();

drop function public.apply_for_coach(text, text, date);
create or replace function public.apply_for_coach(
  p_attest_adult boolean, p_attestation_version text,
  p_certification_name text default null, p_certification_issuer text default null,
  p_certification_expires_on date default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_attest_adult is not true or p_attestation_version is null or length(btrim(p_attestation_version)) not between 1 and 64 then
    raise exception 'attestation_required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and not is_minor and deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.user_roles set role = 'coach_pending', granted_at = now(), granted_by = null
   where user_id = v_uid and role = 'athlete';
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into public.coach_applications (applicant_id, certification_name, certification_issuer, certification_expires_on,
                                         adult_attested_at, attestation_version)
  values (v_uid, p_certification_name, p_certification_issuer, p_certification_expires_on, now(), btrim(p_attestation_version))
  returning id into v_id;
  perform private.log_audit(v_uid, 'coach_applied', v_uid, '{}'::jsonb);
  return v_id;
end $$;

-- Service only (Stripe Identity webhook handler): record the identity-check result id and status.
create or replace function public.set_coach_identity_check(p_application_id uuid, p_status text, p_ref text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_status not in ('pending','passed','failed') then raise exception 'invalid_status' using errcode = '22023'; end if;
  update public.coach_applications set identity_check_status = p_status, identity_check_ref = p_ref
   where id = p_application_id and status in ('submitted','under_review');
  if not found then raise exception 'invalid_application' using errcode = '22023'; end if;
end $$;

create or replace function public.review_coach_application(p_application_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_app public.coach_applications%rowtype;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_app from public.coach_applications
   where id = p_application_id and status in ('submitted','under_review') for update;
  if not found then raise exception 'invalid_application' using errcode = '22023'; end if;
  if p_approve and (v_app.adult_attested_at is null or v_app.identity_check_status <> 'passed') then
    raise exception 'identity_check_required' using errcode = '42501';
  end if;
  update public.coach_applications
     set status = case when p_approve then 'approved' else 'rejected' end, reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_application_id;
  perform public.set_user_role(v_app.applicant_id, case when p_approve then 'coach_verified' else 'athlete' end);
end $$;

-- ------------------------------------------------------------------ grants
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function public.screen_age(date, integer, integer, text) to anon, authenticated;
grant execute on function
  public.complete_signup(date, text, integer, integer, text),
  public.record_consent(text, text, uuid),
  public.revoke_consent(text, uuid),
  public.link_parent(uuid, uuid),
  public.accept_parent_link(uuid),
  public.revoke_parent_link(uuid),
  public.apply_for_coach(boolean, text, text, text, date),
  public.redeem_trainer_code(text),
  public.end_coach_relationship(uuid),
  public.write_health_record(text, text),
  public.read_health_record(uuid),
  public.request_account_deletion(),
  public.request_data_export(),
  public.set_user_role(uuid, text),
  public.review_coach_application(uuid, boolean),
  public.create_trainer_code(uuid, text, integer, timestamptz)
to authenticated;
grant execute on all functions in schema public to service_role;
