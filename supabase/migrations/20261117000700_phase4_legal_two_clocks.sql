-- Phase 4 legal: two separate 12-month clocks, and the parent re-accepts Terms for 16–17s.
--
--  1. Health-screen re-screen due: AI planning is already paused by app.can_ai_plan (status must be
--     ok). Logging and coaching continue. The saved plan stays visible but does not adapt.
--  2. Health-data consent re-ask (consents.reask_on): never locks the app and never pauses AI.
--     Split my_onboarding_state into health_reask_self_due and health_reask_parent_due.
--     health_reask_due stays the OR, so existing clients keep working.
--     When only the parent's grant is due, the teen sees the waiting line; nothing pauses.
--  3. accept_terms: adults only. A parent who re-accepts also writes a terms event with
--     subject_user_id for each active minor. my_latest_terms for a minor includes those rows
--     so the waiting line can clear.

create or replace function public.my_onboarding_state()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_p public.profiles%rowtype;
  v_self_due boolean;
  v_parent_due boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select * into v_p from public.profiles where id = v_uid and deleted_at is null;
  if not found then return null; end if;

  v_self_due := exists (
    select 1 from public.consents c
     where c.user_id = v_uid and c.kind = 'health_data' and c.grantor = 'self'
       and c.granted and c.revoked_at is null
       and c.reask_on is not null and c.reask_on <= current_date
  );
  v_parent_due := v_p.is_minor and exists (
    select 1 from public.consents c
     where c.user_id = v_uid and c.kind = 'health_data' and c.grantor = 'parent'
       and c.granted and c.revoked_at is null
       and c.reask_on is not null and c.reask_on <= current_date
       and exists (select 1 from public.parent_links l
                    where l.minor_user_id = c.user_id and l.parent_user_id = c.actor_user_id
                      and l.status = 'active' and l.is_contracting_party)
  );

  return jsonb_build_object(
    'is_minor', v_p.is_minor,
    'linked', exists (select 1 from public.parent_links l where l.minor_user_id = v_uid and l.status = 'active' and l.is_contracting_party),
    'invite_status', (select i.status from public.parent_invites i where i.minor_user_id = v_uid order by i.seq desc limit 1),
    'setup_done', exists (select 1 from public.training_setups s where s.user_id = v_uid and s.completed_at is not null),
    'privacy_done', exists (select 1 from public.consents c where c.user_id = v_uid and c.kind = 'risk_notice' and c.grantor = 'self'
                              and c.granted and c.revoked_at is null),
    'can_train', app.can_train(v_uid),
    'health_reask_self_due', v_self_due,
    'health_reask_parent_due', v_parent_due,
    -- OR of the two, same meaning as before; the consent clock never pauses AI.
    'health_reask_due', app.has_consent(v_uid, 'health_data') and (v_self_due or v_parent_due),
    'parent_risk_done', case when v_p.is_minor then private.parent_grant_exists(v_uid, 'risk_notice') end,
    'health_screen_status', app.health_screen_status(v_uid),
    'can_ai_plan', app.can_ai_plan(v_uid));
end $$;

revoke all on function public.my_onboarding_state() from public, anon;
grant execute on function public.my_onboarding_state() to authenticated, service_role;

create or replace function private.latest_terms_for(p_uid uuid)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare r record;
begin
  if p_uid is null then return null; end if;
  -- Own acceptance, or a parent's acceptance that references this account (16–17).
  -- Prefer the newest row. When at ties (now() can be transaction-stable), the identity id wins.
  select e.policy_version as version, e.text_hash as hash, e.at
    into r
    from public.consent_events e
   where e.kind = 'terms' and e.granted
     and (e.user_id = p_uid or e.subject_user_id = p_uid)
   order by e.at desc, e.id desc
   limit 1;
  if not found then return null; end if;
  return jsonb_build_object(
    'version', r.version,
    'hash', r.hash,
    'at', r.at,
    'pre_production', r.version ~* 'draft|placeholder'
  );
end $$;

revoke all on function private.latest_terms_for(uuid) from public, anon, authenticated;

create or replace function public.my_latest_terms()
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  return private.latest_terms_for(v_uid);
end $$;

revoke all on function public.my_latest_terms() from public, anon;
grant execute on function public.my_latest_terms() to authenticated, service_role;

create or replace function public.accept_terms(p_version text, p_text_hash text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_ver text := btrim(p_version); v_minor uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
    raise exception 'parent_required' using errcode = '42501';
  end if;
  if v_ver is null or length(v_ver) not between 1 and 64 then
    raise exception 'invalid_policy_version' using errcode = '22023';
  end if;
  if p_text_hash is null or p_text_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_text_hash' using errcode = '22023';
  end if;
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, actor_user_id)
  values (v_uid, 'terms', 'self', true, v_ver, p_text_hash, v_uid);
  insert into public.consents (user_id, kind, grantor, granted, policy_version, text_hash, granted_at, actor_user_id, updated_at)
  values (v_uid, 'terms', 'self', true, v_ver, p_text_hash, now(), v_uid, now())
  on conflict (user_id, kind, grantor) do update
    set granted = true, policy_version = excluded.policy_version, text_hash = excluded.text_hash,
        granted_at = now(), revoked_at = null, actor_user_id = excluded.actor_user_id, updated_at = now();
  -- Parent re-accepts as contracting party for each currently linked minor (ToS §20).
  for v_minor in
    select l.minor_user_id from public.parent_links l
     where l.parent_user_id = v_uid and l.status = 'active' and l.is_contracting_party
  loop
    insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, actor_user_id, subject_user_id)
    values (v_uid, 'terms', 'self', true, v_ver, p_text_hash, v_uid, v_minor);
  end loop;
end $$;

revoke all on function public.accept_terms(text, text) from public, anon;
grant execute on function public.accept_terms(text, text) to authenticated, service_role;

-- A 16–17 can read consent events that name them as the subject (the parent's Terms / privacy
-- acceptance as contracting party). Metadata hash columns stay revoked so a raw or peppered IP
-- never reaches a client.
drop policy if exists consent_events_select_own on public.consent_events;
create policy consent_events_select_own on public.consent_events for select to authenticated
  using (
    user_id = (select auth.uid())
    or app.is_active_parent_of(user_id)
    or subject_user_id = (select auth.uid())
  );

revoke select (ip_hash, device_hash, meta_pepper_version) on public.consent_events from authenticated;
