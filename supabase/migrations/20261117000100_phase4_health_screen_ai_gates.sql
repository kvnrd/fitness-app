-- Phase 4 / AI plan gates (Counsel phase4-review, 15 Nov 2026).
--  * AI planning requires effective health_data AND ai_vendor consent (already true since Phase 3),
--    a current health screen, and a clearance attestation when any answer was yes.
--  * Health-screen ANSWERS stay in health_records.health_screen_ct (KMS envelope). This migration
--    stores only a derived gate (any_yes, timestamps, clearance attestation). Coaches never read it.
--  * The health screen is never labeled PAR-Q+. Clearance is a checkbox + timestamp only; no doctor's
--    note or upload.
--  * Re-ask every 12 months, and whenever an injury or condition is edited after the screen is filed.
--  * 16-17: only the active contracting parent may submit the screen or attest clearance (parent-together
--    gate). The teen cannot self-submit.
--  * Coaches never receive health_screen_ct (no per-item share picker yet; never for minors).
--  * body_weight_ct: current weight only (no target). Allowed for 16-17 when effective health_data is on
--    (teen AND parent). weight_goal stays adults-only.
--  * Filter rejections are audited by reason code only, never the rejected draft.
--  * first-session flag lets the plan notice shrink to the one-line footer (it never disappears).

-- ------------------------------------------------------------------ tables
create table public.health_screen_state (
  user_id             uuid primary key references public.profiles(id) on delete cascade,
  completed_at        timestamptz not null,
  reask_on            date not null,
  any_yes             boolean not null,
  clearance_at        timestamptz,
  clearance_version   text,
  clearance_text_hash text,
  clearance_grantor   text check (clearance_grantor is null or clearance_grantor in ('self','parent')),
  actor_user_id       uuid,
  updated_at          timestamptz not null default now(),
  check (clearance_text_hash is null or clearance_text_hash ~ '^[0-9a-f]{64}$'),
  check (clearance_version is null or length(btrim(clearance_version)) between 1 and 64),
  check (clearance_at is null or (clearance_version is not null and clearance_text_hash is not null
                                  and clearance_grantor is not null and any_yes)),
  check (not any_yes or clearance_at is null or clearance_at >= completed_at)
);
create trigger health_screen_state_touch before update on public.health_screen_state
  for each row execute function private.touch_updated_at();

alter table public.health_screen_state enable row level security;
alter table public.health_screen_state force row level security;
revoke all on table public.health_screen_state from public, anon, authenticated;
grant all on table public.health_screen_state to service_role;
grant select on public.health_screen_state to authenticated;
create policy health_screen_state_select_own on public.health_screen_state for select to authenticated
  using (user_id = (select auth.uid()));
create policy health_screen_state_select_parent on public.health_screen_state for select to authenticated
  using (app.is_active_parent_of(user_id));
-- No write grant, no write policy: clients cannot insert/update/delete.

create table public.ai_plan_sessions (
  user_id                     uuid primary key references public.profiles(id) on delete cascade,
  accepted_plan_at            timestamptz,
  first_session_completed_at  timestamptz,
  updated_at                  timestamptz not null default now()
);
create trigger ai_plan_sessions_touch before update on public.ai_plan_sessions
  for each row execute function private.touch_updated_at();

alter table public.ai_plan_sessions enable row level security;
alter table public.ai_plan_sessions force row level security;
revoke all on table public.ai_plan_sessions from public, anon, authenticated;
grant all on table public.ai_plan_sessions to service_role;
grant select on public.ai_plan_sessions to authenticated;
create policy ai_plan_sessions_select_own on public.ai_plan_sessions for select to authenticated
  using (user_id = (select auth.uid()));
create policy ai_plan_sessions_select_parent on public.ai_plan_sessions for select to authenticated
  using (app.is_active_parent_of(user_id));

alter table public.health_records add column body_weight_ct bytea;  -- JSON {value, unit}; no target.

-- ------------------------------------------------------------------ subject helper (self, or parent acting for a linked minor)
-- Used by the health-record write path and the health-screen RPCs. Coaches are never a writer.
create or replace function private.health_subject(p_actor uuid, p_target uuid)
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_subject uuid := coalesce(p_target, p_actor);
begin
  if p_actor is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if v_subject = p_actor then
    -- Same combined error as Phase 2b/3: a pending minor or missing profile is consent_required,
    -- so existing clients and tests keep a stable code (the health-record function maps it).
    if not app.is_minor_onboarded(p_actor) then raise exception 'consent_required' using errcode = '42501'; end if;
    return v_subject;
  end if;
  if not exists (
      select 1 from public.parent_links l
        join public.profiles p on p.id = l.minor_user_id
       where l.minor_user_id = v_subject and l.parent_user_id = p_actor
         and l.status = 'active' and l.is_contracting_party
         and p.is_minor and p.deleted_at is null
    ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not app.is_minor_onboarded(v_subject) then raise exception 'forbidden' using errcode = '42501'; end if;
  return v_subject;
end $$;
revoke all on function private.health_subject(uuid, uuid) from public, anon, authenticated;

-- Who may file a health screen / clearance: adults themselves; for 16-17, the parent only.
create or replace function private.health_screen_filer(p_for_user uuid, out o_subject uuid, out o_grantor text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_minor boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  o_subject := coalesce(p_for_user, v_uid);
  if not exists (select 1 from public.profiles where id = o_subject and deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not app.is_minor_onboarded(o_subject) then raise exception 'forbidden' using errcode = '42501'; end if;
  if not app.has_consent(o_subject, 'health_data') then raise exception 'consent_required' using errcode = '42501'; end if;
  select is_minor into v_minor from public.profiles where id = o_subject;
  if v_minor then
    if v_uid = o_subject then raise exception 'parent_required' using errcode = '42501'; end if;
    if not app.is_active_parent_of(o_subject) then raise exception 'forbidden' using errcode = '42501'; end if;
    o_grantor := 'parent';
  else
    if v_uid <> o_subject then raise exception 'forbidden' using errcode = '42501'; end if;
    o_grantor := 'self';
  end if;
end $$;
revoke all on function private.health_screen_filer(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------ status helpers
-- 'missing' | 'due' | 'clearance_needed' | 'ok'
create or replace function app.health_screen_status(p_user uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when not exists (select 1 from public.health_screen_state s where s.user_id = p_user) then 'missing'
    when exists (select 1 from public.health_screen_state s where s.user_id = p_user and s.reask_on <= current_date) then 'due'
    when exists (select 1 from public.health_screen_state s where s.user_id = p_user and s.any_yes and s.clearance_at is null) then 'clearance_needed'
    else 'ok'
  end
$$;
revoke all on function app.health_screen_status(uuid) from public, anon, authenticated;
grant execute on function app.health_screen_status(uuid) to service_role;

create or replace function app.can_ai_plan(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select app.is_minor_onboarded(p_user)
     and app.has_consent(p_user, 'ai_vendor')
     and app.has_consent(p_user, 'health_data')
     and app.health_screen_status(p_user) = 'ok'
$$;
revoke all on function app.can_ai_plan(uuid) from public, anon, authenticated;
grant execute on function app.can_ai_plan(uuid) to service_role;

-- ------------------------------------------------------------------ client state (UI gating only; the server still enforces)
create or replace function public.my_ai_plan_state(p_for_user uuid default null)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_subject uuid;
  v_p public.profiles%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  v_subject := coalesce(p_for_user, v_uid);
  if v_subject <> v_uid and not app.is_active_parent_of(v_subject) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into v_p from public.profiles where id = v_subject and deleted_at is null;
  if not found then return null; end if;
  return jsonb_build_object(
    'is_minor', v_p.is_minor,
    'health_consent', app.has_consent(v_subject, 'health_data'),
    'ai_consent', app.has_consent(v_subject, 'ai_vendor'),
    'health_screen_status', app.health_screen_status(v_subject),
    'can_ai_plan', app.can_ai_plan(v_subject),
    'first_session_done', exists (
      select 1 from public.ai_plan_sessions s
       where s.user_id = v_subject and s.first_session_completed_at is not null),
    'plan_accepted', exists (
      select 1 from public.ai_plan_sessions s
       where s.user_id = v_subject and s.accepted_plan_at is not null)
  );
end $$;
revoke all on function public.my_ai_plan_state(uuid) from public, anon;
grant execute on function public.my_ai_plan_state(uuid) to authenticated, service_role;

-- ------------------------------------------------------------------ submit / clearance
create or replace function public.submit_health_screen(p_any_yes boolean, p_for_user uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare t record;
begin
  if p_any_yes is null then raise exception 'invalid_argument' using errcode = '22023'; end if;
  select * into t from private.health_screen_filer(p_for_user);
  insert into public.health_screen_state (user_id, completed_at, reask_on, any_yes,
                                          clearance_at, clearance_version, clearance_text_hash, clearance_grantor,
                                          actor_user_id, updated_at)
  values (t.o_subject, now(), (now() + interval '12 months')::date, p_any_yes,
          null, null, null, null, auth.uid(), now())
  on conflict (user_id) do update
    set completed_at = now(),
        reask_on = (now() + interval '12 months')::date,
        any_yes = excluded.any_yes,
        clearance_at = null, clearance_version = null, clearance_text_hash = null, clearance_grantor = null,
        actor_user_id = auth.uid(), updated_at = now();
  -- Audit: no answers, no any_yes value (that would leak a health fact into the audit log).
  perform private.log_audit(auth.uid(), 'health_screen_submitted', t.o_subject, '{}'::jsonb);
  return jsonb_build_object('status', app.health_screen_status(t.o_subject));
end $$;
revoke all on function public.submit_health_screen(boolean, uuid) from public, anon;
grant execute on function public.submit_health_screen(boolean, uuid) to authenticated, service_role;

create or replace function public.attest_health_clearance(p_version text, p_text_hash text, p_for_user uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare t record; v_status text;
begin
  select * into t from private.health_screen_filer(p_for_user);
  if p_version is null or length(btrim(p_version)) not between 1 and 64 then
    raise exception 'invalid_policy_version' using errcode = '22023';
  end if;
  if p_text_hash is null or p_text_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_text_hash' using errcode = '22023';
  end if;
  v_status := app.health_screen_status(t.o_subject);
  if v_status in ('missing', 'due') then raise exception 'health_screen_required' using errcode = '42501'; end if;
  if v_status <> 'clearance_needed' then raise exception 'clearance_not_needed' using errcode = '22023'; end if;
  update public.health_screen_state
     set clearance_at = now(),
         clearance_version = btrim(p_version),
         clearance_text_hash = p_text_hash,
         clearance_grantor = t.o_grantor,
         actor_user_id = auth.uid(),
         updated_at = now()
   where user_id = t.o_subject;
  perform private.log_audit(auth.uid(), 'health_clearance_attested', t.o_subject,
                            jsonb_build_object('version', btrim(p_version)));
  return jsonb_build_object('status', app.health_screen_status(t.o_subject));
end $$;
revoke all on function public.attest_health_clearance(text, text, uuid) from public, anon;
grant execute on function public.attest_health_clearance(text, text, uuid) to authenticated, service_role;

-- ------------------------------------------------------------------ plan-session flags (self only; the trainee)
create or replace function public.mark_ai_plan_accepted()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not app.can_ai_plan(v_uid) then
    if not app.has_consent(v_uid, 'ai_vendor') or not app.has_consent(v_uid, 'health_data') then
      raise exception 'consent_required' using errcode = '42501';
    end if;
    if app.health_screen_status(v_uid) = 'clearance_needed' then
      raise exception 'clearance_required' using errcode = '42501';
    end if;
    raise exception 'health_screen_required' using errcode = '42501';
  end if;
  insert into public.ai_plan_sessions (user_id, accepted_plan_at, updated_at)
  values (v_uid, now(), now())
  on conflict (user_id) do update
    set accepted_plan_at = coalesce(ai_plan_sessions.accepted_plan_at, now()), updated_at = now();
  perform private.log_audit(v_uid, 'ai_plan_accepted', v_uid, '{}'::jsonb);
end $$;
revoke all on function public.mark_ai_plan_accepted() from public, anon;
grant execute on function public.mark_ai_plan_accepted() to authenticated, service_role;

create or replace function public.mark_ai_first_session_done()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- First session only makes sense after a plan was accepted; do not leak whether one exists.
  if not exists (select 1 from public.ai_plan_sessions s where s.user_id = v_uid and s.accepted_plan_at is not null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.ai_plan_sessions
     set first_session_completed_at = coalesce(first_session_completed_at, now()), updated_at = now()
   where user_id = v_uid;
  perform private.log_audit(v_uid, 'ai_first_session_done', v_uid, '{}'::jsonb);
end $$;
revoke all on function public.mark_ai_first_session_done() from public, anon;
grant execute on function public.mark_ai_first_session_done() to authenticated, service_role;

-- Filter rejection log: reason code only. Service-only (called from the ai-plan function).
create or replace function public.log_ai_plan_filtered(p_actor uuid, p_reason_code text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform private.require_service();
  if p_actor is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_reason_code is null or p_reason_code not in
       ('eating_disorder','body_shaming','medical_treatment','minor_weight_loss','minor_restricted','unparseable','refusal') then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  -- Metadata is the reason code alone. The rejected draft is never written anywhere.
  perform private.log_audit(p_actor, 'ai_plan_filtered', p_actor, jsonb_build_object('reason', p_reason_code));
end $$;
revoke all on function public.log_ai_plan_filtered(uuid, text) from public, anon, authenticated;
grant execute on function public.log_ai_plan_filtered(uuid, text) to service_role;

-- ------------------------------------------------------------------ ai_plan_context: screen + clearance gates
create or replace function public.ai_plan_context(p_actor uuid)
returns table (age_band text, health_ok boolean, wrapped_key bytea, key_provider text, kms_key_ref text, injury_category_ct bytea)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare v_band text; v_status text;
begin
  perform private.require_service();
  if p_actor is null or not app.is_minor_onboarded(p_actor) then raise exception 'forbidden' using errcode = '42501'; end if;
  if not app.has_consent(p_actor, 'ai_vendor') or not app.has_consent(p_actor, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  v_status := app.health_screen_status(p_actor);
  if v_status in ('missing', 'due') then raise exception 'health_screen_required' using errcode = '42501'; end if;
  if v_status = 'clearance_needed' then raise exception 'clearance_required' using errcode = '42501'; end if;
  if (select count(*) from public.audit_log a
       where a.actor_id = p_actor and a.action = 'ai_plan_requested' and a.at > now() - interval '1 hour') >= 20 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;
  select p.age_band into v_band from public.profiles p where p.id = p_actor;
  perform private.log_audit(p_actor, 'ai_plan_requested', p_actor, '{}'::jsonb);
  -- health_ok is always true here (consent was checked). The injury category is still only decrypted
  -- when a ciphertext exists.
  return query select v_band, true, k.wrapped_key, k.key_provider, k.kms_key_ref, h.injury_category_ct
    from (select 1) one
    left join private.user_data_keys k on k.user_id = p_actor
    left join public.health_records h on h.user_id = p_actor;
end $$;

-- ------------------------------------------------------------------ health-record: parent-for-minor + body_weight + injury-edit re-ask
drop function public.health_prepare_write(uuid);
create or replace function public.health_prepare_write(p_actor uuid, p_target uuid default null)
returns table (wrapped_key bytea, key_provider text, kms_key_ref text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_subject uuid;
begin
  perform private.require_service();
  v_subject := private.health_subject(p_actor, p_target);
  if not app.has_consent(v_subject, 'health_data') then raise exception 'consent_required' using errcode = '42501'; end if;
  return query select k.wrapped_key, k.key_provider, k.kms_key_ref from private.user_data_keys k where k.user_id = v_subject;
end $$;

drop function public.health_register_key(uuid, bytea, text, text);
create or replace function public.health_register_key(p_actor uuid, p_wrapped_key bytea, p_key_provider text, p_kms_key_ref text, p_target uuid default null)
returns table (wrapped_key bytea, key_provider text, kms_key_ref text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_subject uuid;
begin
  perform private.require_service();
  v_subject := private.health_subject(p_actor, p_target);
  if not app.has_consent(v_subject, 'health_data') then raise exception 'consent_required' using errcode = '42501'; end if;
  insert into private.user_data_keys (user_id, wrapped_key, key_provider, kms_key_ref)
  values (v_subject, p_wrapped_key, p_key_provider, p_kms_key_ref)
  on conflict (user_id) do nothing;
  return query select k.wrapped_key, k.key_provider, k.kms_key_ref from private.user_data_keys k where k.user_id = v_subject;
end $$;

drop function public.health_write(uuid, bytea, bytea, bytea, bytea, text[]);
create or replace function public.health_write(
  p_actor uuid, p_injury_notes_ct bytea, p_health_screen_ct bytea,
  p_injury_category_ct bytea, p_weight_goal_ct bytea default null, p_set text[] default null,
  p_body_weight_ct bytea default null, p_target uuid default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_all constant text[] := array['injury_notes','health_screen','injury_category','weight_goal','body_weight'];
  v_set text[] := coalesce(p_set, array['injury_notes','health_screen','injury_category','weight_goal']);
  v_subject uuid;
  v_prev public.health_records%rowtype;
  v_due boolean := false;
begin
  perform private.require_service();
  v_subject := private.health_subject(p_actor, p_target);
  if not app.has_consent(v_subject, 'health_data') then raise exception 'consent_required' using errcode = '42501'; end if;
  if not (v_set <@ v_all) then raise exception 'invalid_argument' using errcode = '22023'; end if;
  -- Counsel phase4-review #5: no weight GOAL (target) for 16-17. Current body weight is allowed.
  if p_weight_goal_ct is not null and 'weight_goal' = any (v_set)
     and exists (select 1 from public.profiles where id = v_subject and is_minor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from private.user_data_keys where user_id = v_subject) then
    raise exception 'no_data_key' using errcode = '55000';
  end if;
  select * into v_prev from public.health_records where user_id = v_subject;
  insert into public.health_records (user_id, enc_version, injury_notes_ct, health_screen_ct, injury_category_ct, weight_goal_ct, body_weight_ct, updated_at)
  values (v_subject, 1,
          case when 'injury_notes'    = any (v_set) then p_injury_notes_ct end,
          case when 'health_screen'   = any (v_set) then p_health_screen_ct end,
          case when 'injury_category' = any (v_set) then p_injury_category_ct end,
          case when 'weight_goal'     = any (v_set) then p_weight_goal_ct end,
          case when 'body_weight'     = any (v_set) then p_body_weight_ct end, now())
  on conflict (user_id) do update
    set enc_version = 1,
        injury_notes_ct    = case when 'injury_notes'    = any (v_set) then excluded.injury_notes_ct    else health_records.injury_notes_ct end,
        health_screen_ct   = case when 'health_screen'   = any (v_set) then excluded.health_screen_ct   else health_records.health_screen_ct end,
        injury_category_ct = case when 'injury_category' = any (v_set) then excluded.injury_category_ct else health_records.injury_category_ct end,
        weight_goal_ct     = case when 'weight_goal'     = any (v_set) then excluded.weight_goal_ct     else health_records.weight_goal_ct end,
        body_weight_ct     = case when 'body_weight'     = any (v_set) then excluded.body_weight_ct     else health_records.body_weight_ct end,
        updated_at = now();
  -- Re-ask when an injury or condition is edited AFTER a current screen. A first-time write of a
  -- previously-null field (the quiz category after the screen) does not trigger it. Writing the
  -- health-screen ciphertext itself is followed by submit_health_screen, which resets the date.
  if exists (select 1 from public.health_screen_state s where s.user_id = v_subject and s.reask_on > current_date) then
    if 'injury_notes' = any (v_set) and v_prev.user_id is not null and v_prev.injury_notes_ct is not null then
      v_due := true;
    end if;
    if 'injury_category' = any (v_set) and v_prev.user_id is not null and v_prev.injury_category_ct is not null then
      v_due := true;
    end if;
    if v_due then
      update public.health_screen_state set reask_on = current_date, updated_at = now() where user_id = v_subject;
      perform private.log_audit(p_actor, 'health_screen_reask_due', v_subject, '{}'::jsonb);
    end if;
  end if;
  perform private.log_audit(p_actor, 'health_written', v_subject, '{}'::jsonb);  -- never which fields or values
end $$;

drop function public.health_read(uuid, uuid);
create or replace function public.health_read(p_actor uuid, p_target uuid default null)
returns table (wrapped_key bytea, key_provider text, kms_key_ref text,
               injury_notes_ct bytea, health_screen_ct bytea, injury_category_ct bytea,
               weight_goal_ct bytea, body_weight_ct bytea)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_target uuid := coalesce(p_target, p_actor);
  v_is_coach boolean := false;
  v_is_parent boolean := false;
begin
  perform private.require_service();
  if p_actor is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if v_target = p_actor then
    if not app.is_minor_onboarded(p_actor) then raise exception 'forbidden' using errcode = '42501'; end if;
  else
    v_is_parent := exists (
      select 1 from public.parent_links l
       where l.minor_user_id = v_target and l.parent_user_id = p_actor
         and l.status = 'active' and l.is_contracting_party);
    if v_is_parent then
      if not app.is_minor_onboarded(v_target) then raise exception 'forbidden' using errcode = '42501'; end if;
    elsif private.coach_can_see_as(p_actor, v_target) then
      -- Counsel: coaches never see minors' health-screen answers (or any health fields).
      if exists (select 1 from public.profiles where id = v_target and is_minor) then return; end if;
      v_is_coach := true;
    else
      raise exception 'forbidden' using errcode = '42501';
    end if;
  end if;
  if not app.has_consent(v_target, 'health_data') then raise exception 'consent_required' using errcode = '42501'; end if;
  if v_target <> p_actor then
    perform private.log_audit(p_actor,
      case when v_is_parent then 'health_read_by_parent' else 'health_read_by_coach' end,
      v_target, '{}'::jsonb);
  end if;
  return query select k.wrapped_key, k.key_provider, k.kms_key_ref,
                      h.injury_notes_ct,
                      -- Counsel #6: no per-item share picker yet, so coaches never receive health-screen answers.
                      case when v_is_coach then null else h.health_screen_ct end,
                      h.injury_category_ct,
                      -- Own or parent only: a coach never receives body-weight fields.
                      case when v_is_coach then null else h.weight_goal_ct end,
                      case when v_is_coach then null else h.body_weight_ct end
    from public.health_records h join private.user_data_keys k on k.user_id = h.user_id
   where h.user_id = v_target;
end $$;

create or replace function public.health_shred(p_user uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  delete from public.health_screen_state where user_id = p_user;
  delete from public.health_records where user_id = p_user;
  delete from private.user_data_keys where user_id = p_user;
  get diagnostics n = row_count;
  perform private.log_audit(auth.uid(), 'health_shredded', p_user, '{}'::jsonb);
  return n > 0;
end $$;

revoke all on function
  public.health_prepare_write(uuid, uuid),
  public.health_register_key(uuid, bytea, text, text, uuid),
  public.health_write(uuid, bytea, bytea, bytea, bytea, text[], bytea, uuid),
  public.health_read(uuid, uuid),
  public.health_shred(uuid)
from public, anon, authenticated;
grant execute on function
  public.health_prepare_write(uuid, uuid),
  public.health_register_key(uuid, bytea, text, text, uuid),
  public.health_write(uuid, bytea, bytea, bytea, bytea, text[], bytea, uuid),
  public.health_read(uuid, uuid),
  public.health_shred(uuid)
to service_role;

-- Revoking health consent makes the screen due again (answers will also be shredded by retention).
create or replace function private.health_revoke_marks_reask()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if NEW.kind = 'health_data' and NEW.granted is false and (OLD.granted is true) then
    update public.health_screen_state set reask_on = current_date, updated_at = now() where user_id = NEW.user_id;
  end if;
  return NEW;
end $$;
drop trigger if exists consents_health_revoke_reask on public.consents;
create trigger consents_health_revoke_reask after update on public.consents
  for each row execute function private.health_revoke_marks_reask();
revoke all on function private.health_revoke_marks_reask() from public, anon, authenticated;

-- Expose the new status on my_onboarding_state without removing existing keys.
create or replace function public.my_onboarding_state()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_p public.profiles%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select * into v_p from public.profiles where id = v_uid and deleted_at is null;
  if not found then return null; end if;
  return jsonb_build_object(
    'is_minor', v_p.is_minor,
    'linked', exists (select 1 from public.parent_links l where l.minor_user_id = v_uid and l.status = 'active' and l.is_contracting_party),
    'invite_status', (select i.status from public.parent_invites i where i.minor_user_id = v_uid order by i.seq desc limit 1),
    'setup_done', exists (select 1 from public.training_setups s where s.user_id = v_uid and s.completed_at is not null),
    'privacy_done', exists (select 1 from public.consents c where c.user_id = v_uid and c.kind = 'risk_notice' and c.grantor = 'self'
                              and c.granted and c.revoked_at is null),
    'can_train', app.can_train(v_uid),
    'health_reask_due', app.has_consent(v_uid, 'health_data') and exists (
        select 1 from public.consents c
         where c.user_id = v_uid and c.kind = 'health_data' and c.granted and c.revoked_at is null
           and c.reask_on is not null and c.reask_on <= current_date
           and (c.grantor = 'self' or exists (select 1 from public.parent_links l
                  where l.minor_user_id = c.user_id and l.parent_user_id = c.actor_user_id
                    and l.status = 'active' and l.is_contracting_party))),
    'parent_risk_done', case when v_p.is_minor then private.parent_grant_exists(v_uid, 'risk_notice') end,
    'health_screen_status', app.health_screen_status(v_uid),
    'can_ai_plan', app.can_ai_plan(v_uid));
end $$;
