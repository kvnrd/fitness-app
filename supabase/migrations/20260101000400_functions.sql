-- Phase 2 / functions. All SECURITY DEFINER with a fixed search_path; each checks auth.uid().
-- Privileged ones (service/admin) are REVOKED from clients and also guard in the body.
-- Errors use short stable messages; none reveal whether another account exists.

-- Caller is the server (service_role JWT) or a platform admin looked up in user_roles.
create or replace function private.is_service_or_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.role() = 'service_role' or app.is_platform_admin()
$$;

-- ------------------------------------------------------------------ signup / age gate
create or replace function public.complete_signup(p_birth_date date, p_display_name text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_age integer;
  v_minor boolean;
  v_name text := nullif(btrim(p_display_name), '');
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_birth_date is null or p_birth_date > current_date or p_birth_date < current_date - interval '120 years' then
    raise exception 'invalid_birth_date' using errcode = '22023';
  end if;
  v_age := app.age_years(p_birth_date);
  -- COPPA: under 13 => nothing is kept (this raise rolls the statement back; no profile row).
  -- The server should then call close_under_13_account(auth user) to remove the auth user.
  if v_age < 13 then raise exception 'under_13_not_permitted' using errcode = '42501'; end if;
  -- Product minimum age is 16.
  if v_age < 16 then raise exception 'under_minimum_age' using errcode = '42501'; end if;
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'already_signed_up' using errcode = '23505';
  end if;
  if v_name is not null and length(v_name) > 80 then raise exception 'invalid_display_name' using errcode = '22023'; end if;

  insert into public.profiles (id, display_name, birth_date) values (v_uid, v_name, p_birth_date)
  returning is_minor into v_minor;
  insert into public.user_roles (user_id, role) values (v_uid, 'athlete');
  perform private.log_audit(v_uid, 'signup_completed', v_uid, jsonb_build_object('is_minor', v_minor));

  -- 16-17: a parent/guardian link is required before the account is fully active.
  return jsonb_build_object('is_minor', v_minor, 'onboarded', app.is_minor_onboarded(v_uid));
end $$;

-- Operator/service only: wipe a user found to be under 13 and remove the auth user.
create or replace function public.close_under_13_account(p_user_id uuid)
returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  -- Cascades from profiles remove roles, consents, logs, health records, links, relationships, plans.
  delete from public.profiles where id = p_user_id;
  delete from public.data_export_requests where user_id = p_user_id;
  delete from public.account_deletion_requests where user_id = p_user_id;
  delete from auth.users where id = p_user_id;
  -- Record only the fact of closure (no birth date, no email).
  perform private.log_audit(auth.uid(), 'closed_under_13', p_user_id, '{}'::jsonb);
end $$;

-- Daily job (pg_cron / scheduled function): flips is_minor when people turn 18.
create or replace function public.recompute_minor_flags()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.profiles set birth_date = birth_date
  where is_minor is distinct from (app.age_years(birth_date) < 18);  -- trigger recomputes is_minor
  get diagnostics n = row_count;
  return n;
end $$;

-- ------------------------------------------------------------------ consents
-- p_for_user: a parent/guardian may act for a minor they are the active contracting party of.
-- 'parental' consent can only be recorded by that parent, never by the minor.
create or replace function private.consent_target(p_kind text, p_for_user uuid)
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_target uuid := coalesce(p_for_user, auth.uid());
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_kind is null or p_kind not in ('health_data','ai_vendor','coach_sharing','parental') then
    raise exception 'invalid_consent_kind' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = v_target and deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_target <> v_uid then
    if not app.is_active_parent_of(v_target) then raise exception 'forbidden' using errcode = '42501'; end if;
  elsif p_kind = 'parental' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return v_target;
end $$;

create or replace function public.record_consent(p_kind text, p_policy_version text, p_for_user uuid default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_target uuid := private.consent_target(p_kind, p_for_user);
begin
  if p_policy_version is null or length(btrim(p_policy_version)) not between 1 and 64 then
    raise exception 'invalid_policy_version' using errcode = '22023';
  end if;
  insert into public.consents (user_id, kind, granted, policy_version, granted_at, revoked_at, actor_user_id, updated_at)
  values (v_target, p_kind, true, btrim(p_policy_version), now(), null, auth.uid(), now())
  on conflict (user_id, kind) do update
    set granted = true, policy_version = excluded.policy_version, granted_at = now(),
        revoked_at = null, actor_user_id = auth.uid(), updated_at = now();
  insert into public.consent_events (user_id, kind, granted, policy_version, actor_user_id)
  values (v_target, p_kind, true, btrim(p_policy_version), auth.uid());
  perform private.log_audit(auth.uid(), 'consent_granted', v_target, jsonb_build_object('kind', p_kind));
end $$;

create or replace function public.revoke_consent(p_kind text, p_for_user uuid default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_target uuid := private.consent_target(p_kind, p_for_user); v_version text;
begin
  update public.consents
     set granted = false, revoked_at = now(), actor_user_id = auth.uid(), updated_at = now()
   where user_id = v_target and kind = p_kind and granted
  returning policy_version into v_version;
  if found then
    insert into public.consent_events (user_id, kind, granted, policy_version, actor_user_id)
    values (v_target, p_kind, false, v_version, auth.uid());
    perform private.log_audit(auth.uid(), 'consent_revoked', v_target, jsonb_build_object('kind', p_kind));
  end if;
end $$;

-- ------------------------------------------------------------------ parent links (request / accept stub)
-- The minor requests a link to a parent/guardian's account; the parent accepts. Inviting a parent by
-- email (account lookup) belongs in a server function, not here.
create or replace function public.link_parent(p_minor_id uuid, p_parent_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_minor_id then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where id = p_minor_id and is_minor and deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_parent_id is null or p_parent_id = p_minor_id
     or not exists (select 1 from public.profiles where id = p_parent_id and not is_minor and deleted_at is null) then
    raise exception 'invalid_parent' using errcode = '22023';
  end if;
  insert into public.parent_links (minor_user_id, parent_user_id, status, is_contracting_party)
  values (p_minor_id, p_parent_id, 'pending', true)
  returning id into v_id;
  perform private.log_audit(auth.uid(), 'parent_link_requested', p_minor_id, '{}'::jsonb);
  return v_id;
exception when unique_violation then
  raise exception 'invalid_parent' using errcode = '22023';
end $$;

create or replace function public.accept_parent_link(p_link_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_minor uuid;
begin
  update public.parent_links set status = 'active', accepted_at = now()
   where id = p_link_id and parent_user_id = auth.uid() and status = 'pending'
  returning minor_user_id into v_minor;
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  perform private.log_audit(auth.uid(), 'parent_link_accepted', v_minor, '{}'::jsonb);
exception when unique_violation then
  raise exception 'link_conflict' using errcode = '23505';
end $$;

-- Only the parent (or service/admin) ends a link; a minor cannot remove their own guardian.
create or replace function public.revoke_parent_link(p_link_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_minor uuid;
begin
  update public.parent_links set status = 'revoked', revoked_at = now()
   where id = p_link_id and status in ('pending','active')
     and (parent_user_id = auth.uid() or private.is_service_or_admin())
  returning minor_user_id into v_minor;
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  perform private.log_audit(auth.uid(), 'parent_link_revoked', v_minor, '{}'::jsonb);
end $$;

-- ------------------------------------------------------------------ roles
create or replace function public.apply_for_coach(
  p_certification_name text default null, p_certification_issuer text default null,
  p_certification_expires_on date default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- Conservative default: coaches are adults. Listed for Counsel in docs.
  if not exists (select 1 from public.profiles where id = v_uid and not is_minor and deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.user_roles set role = 'coach_pending', granted_at = now(), granted_by = null
   where user_id = v_uid and role = 'athlete';
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into public.coach_applications (applicant_id, certification_name, certification_issuer, certification_expires_on)
  values (v_uid, p_certification_name, p_certification_issuer, p_certification_expires_on)
  returning id into v_id;
  perform private.log_audit(v_uid, 'coach_applied', v_uid, '{}'::jsonb);
  return v_id;
end $$;

create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_role is null or p_role not in ('athlete','coach_pending','coach_verified','gym_admin','platform_admin') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  update public.user_roles set role = p_role, granted_at = now(), granted_by = auth.uid() where user_id = p_user_id;
  if not found then raise exception 'invalid_user' using errcode = '22023'; end if;
  perform private.log_audit(auth.uid(), 'role_set', p_user_id, jsonb_build_object('role', p_role));
end $$;

create or replace function public.review_coach_application(p_application_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_applicant uuid;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.coach_applications
     set status = case when p_approve then 'approved' else 'rejected' end, reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_application_id and status in ('submitted','under_review')
  returning applicant_id into v_applicant;
  if not found then raise exception 'invalid_application' using errcode = '22023'; end if;
  perform public.set_user_role(v_applicant, case when p_approve then 'coach_verified' else 'athlete' end);
end $$;

-- ------------------------------------------------------------------ trainer codes / relationships
-- Hash with a server-side pepper (private.encryption_keys 'trainer_code_pepper'); raw codes are never stored.
create or replace function private.hash_trainer_code(p_code text)
returns text language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare v_pepper text;
begin
  select key into v_pepper from private.encryption_keys where name = 'trainer_code_pepper';
  if v_pepper is null then raise exception 'server_not_configured' using errcode = '55000'; end if;
  return encode(digest(convert_to(v_pepper || ':' || upper(btrim(p_code)), 'UTF8'), 'sha256'), 'hex');
end $$;

-- Returns true on success, false for ANY invalid code (no oracle for which part failed).
-- Rate limit: 10 failed attempts per user per hour, counted from audit_log (failures return false
-- rather than raising so the attempt record survives). Add IP-level limits at the edge.
create or replace function public.redeem_trainer_code(p_code text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_row public.trainer_codes%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if (select count(*) from public.audit_log
       where actor_id = v_uid and action = 'trainer_code_failed' and at > now() - interval '1 hour') >= 10 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  select * into v_row from public.trainer_codes
   where code_hash = private.hash_trainer_code(coalesce(p_code, '')) for update;

  if not found or v_row.revoked or (v_row.expires_at is not null and v_row.expires_at <= now())
     or v_row.redemptions >= v_row.max_redemptions or v_row.coach_id = v_uid
     or not exists (select 1 from public.user_roles where user_id = v_row.coach_id and role = 'coach_verified')
     or not app.is_minor_onboarded(v_uid) then
    perform private.log_audit(v_uid, 'trainer_code_failed', null, '{}'::jsonb);
    return false;
  end if;

  if not exists (select 1 from public.coach_relationships
                  where coach_id = v_row.coach_id and client_id = v_uid and status = 'active') then
    insert into public.coach_relationships (coach_id, client_id, status, started_at)
    values (v_row.coach_id, v_uid, 'active', now())
    on conflict (coach_id, client_id) where status in ('pending','active') do update set status = 'active', started_at = now();
    update public.trainer_codes set redemptions = redemptions + 1 where id = v_row.id;
  end if;
  perform private.log_audit(v_uid, 'trainer_code_redeemed', v_row.coach_id, jsonb_build_object('code_id', v_row.id));
  return true;
end $$;

-- Operator/admin tool: create a code from a raw value generated server-side. Stores only the hash.
create or replace function public.create_trainer_code(p_coach_id uuid, p_code text, p_max integer default 25, p_expires timestamptz default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_code is null or length(btrim(p_code)) < 8 then raise exception 'invalid_code' using errcode = '22023'; end if;
  insert into public.trainer_codes (code_hash, coach_id, max_redemptions, expires_at)
  values (private.hash_trainer_code(p_code), p_coach_id, p_max, p_expires) returning id into v_id;
  perform private.log_audit(auth.uid(), 'trainer_code_created', p_coach_id, jsonb_build_object('code_id', v_id));
  return v_id;
end $$;

-- Either party ends the relationship; coach access stops at once (policies require status = 'active').
create or replace function public.end_coach_relationship(p_relationship_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_client uuid;
begin
  update public.coach_relationships set status = 'ended', ended_at = now()
   where id = p_relationship_id and status in ('pending','active')
     and (coach_id = auth.uid() or client_id = auth.uid())
  returning client_id into v_client;
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  perform private.log_audit(auth.uid(), 'coach_relationship_ended', v_client, '{}'::jsonb);
end $$;

-- ------------------------------------------------------------------ health (field-level encryption)
create or replace function private.active_health_key(out o_name text, out o_key text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  select name, key into o_name, o_key from private.encryption_keys
   where name like 'health\_%' and retired_at is null order by created_at desc, name desc limit 1;
  if o_name is null then raise exception 'server_not_configured' using errcode = '55000'; end if;
end $$;

-- Owner writes their own record; requires health_data consent. Passing null clears that field.
create or replace function public.write_health_record(p_injury_notes text, p_health_screen text)
returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_uid uuid := auth.uid(); v_name text; v_key text;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not app.is_minor_onboarded(v_uid) or not app.has_consent(v_uid, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  select o_name, o_key into v_name, v_key from private.active_health_key();
  insert into public.health_records (user_id, injury_notes_cipher, health_screen_cipher, key_name, updated_at)
  values (v_uid,
          case when p_injury_notes is null then null else extensions.pgp_sym_encrypt(p_injury_notes, v_key) end,
          case when p_health_screen is null then null else extensions.pgp_sym_encrypt(p_health_screen, v_key) end,
          v_name, now())
  on conflict (user_id) do update
    set injury_notes_cipher = excluded.injury_notes_cipher, health_screen_cipher = excluded.health_screen_cipher,
        key_name = excluded.key_name, updated_at = now();
  perform private.log_audit(v_uid, 'health_written', v_uid, '{}'::jsonb);
end $$;

-- Owner (default) or a coach. Coach path needs: verified coach + ACTIVE relationship + client's
-- coach_sharing consent (coach_can_see) + client's health_data consent. For minor clients, coaches get
-- no rows (injury/health-screen/body-weight-like data hidden by default).
create or replace function public.read_health_record(p_user_id uuid default null)
returns table (injury_notes text, health_screen text)
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_uid uuid := auth.uid(); v_target uuid := coalesce(p_user_id, auth.uid()); v_rec public.health_records%rowtype; v_key text;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if v_target = v_uid then
    if not app.is_minor_onboarded(v_uid) then raise exception 'forbidden' using errcode = '42501'; end if;
  else
    if not app.coach_can_see(v_target) then raise exception 'forbidden' using errcode = '42501'; end if;
    if exists (select 1 from public.profiles where id = v_target and is_minor) then return; end if;
  end if;
  if not app.has_consent(v_target, 'health_data') then raise exception 'consent_required' using errcode = '42501'; end if;

  select * into v_rec from public.health_records where user_id = v_target;
  if not found then return; end if;
  select key into v_key from private.encryption_keys where name = v_rec.key_name;
  if v_key is null then raise exception 'server_not_configured' using errcode = '55000'; end if;
  if v_target <> v_uid then
    perform private.log_audit(v_uid, 'health_read_by_coach', v_target, '{}'::jsonb);
  end if;
  return query select
    case when v_rec.injury_notes_cipher is null then null else extensions.pgp_sym_decrypt(v_rec.injury_notes_cipher, v_key) end,
    case when v_rec.health_screen_cipher is null then null else extensions.pgp_sym_decrypt(v_rec.health_screen_cipher, v_key) end;
end $$;

-- ------------------------------------------------------------------ requests (stubs)
-- Fulfilment (actually exporting / deleting, incl. auth.admin.deleteUser) is a server job. Retention
-- of consent/audit records after deletion is a question for Counsel (docs/phase-2-backend.md).
create or replace function public.request_account_deletion()
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  insert into public.account_deletion_requests (user_id) values (auth.uid())
  on conflict (user_id) where status = 'pending' do update set requested_at = account_deletion_requests.requested_at
  returning id into v_id;
  perform private.log_audit(auth.uid(), 'account_deletion_requested', auth.uid(), '{}'::jsonb);
  return v_id;
end $$;

create or replace function public.request_data_export()
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  insert into public.data_export_requests (user_id) values (auth.uid())
  on conflict (user_id) where status = 'pending' do update set requested_at = data_export_requests.requested_at
  returning id into v_id;
  perform private.log_audit(auth.uid(), 'data_export_requested', auth.uid(), '{}'::jsonb);
  return v_id;
end $$;

-- ------------------------------------------------------------------ JWT hook (optional cache)
-- Adds app_role to the access token. Kevin must register this under Auth > Hooks on the hosted
-- project. RLS never trusts this claim; it reads user_roles.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_role text; v_claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
begin
  select role into v_role from public.user_roles where user_id = (event ->> 'user_id')::uuid;
  v_claims := jsonb_set(v_claims, '{app_role}', to_jsonb(coalesce(v_role, 'athlete')));
  return jsonb_set(event, '{claims}', v_claims);
end $$;

-- ------------------------------------------------------------------ grants
revoke all on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.complete_signup(date, text),
  public.record_consent(text, text, uuid),
  public.revoke_consent(text, uuid),
  public.link_parent(uuid, uuid),
  public.accept_parent_link(uuid),
  public.revoke_parent_link(uuid),
  public.apply_for_coach(text, text, date),
  public.redeem_trainer_code(text),
  public.end_coach_relationship(uuid),
  public.write_health_record(text, text),
  public.read_health_record(uuid),
  public.request_account_deletion(),
  public.request_data_export(),
  public.set_user_role(uuid, text),          -- body-guarded: platform_admin / service only
  public.review_coach_application(uuid, boolean),
  public.create_trainer_code(uuid, text, integer, timestamptz)
to authenticated;

grant execute on all functions in schema public to service_role;

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema public to supabase_auth_admin;
    grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
  end if;
end $$;
