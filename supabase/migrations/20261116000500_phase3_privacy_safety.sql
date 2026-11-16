-- Phase 3 / Privacy & safety, can_train, onboarding state, retention additions.
--  * submit_privacy_safety records the Health and AI choices (each its own consent_events row, on OR off,
--    with the version and text hash that were shown) and the risk acknowledgement (required).
--  * AI requires health (Counsel phase4-review #2): p_ai true with p_health false raises 'health_required'.
--    The health policy document hash (p_health_policy_hash, required) is recorded as policy_doc_hash on the
--    health_data AND ai_vendor events/rows.
--  * 'risk_notice' is an acknowledgement, not a permission: it is not accepted by record_consent /
--    revoke_consent, so it cannot be switched off there. The teen's risk row is NOT locked behind the
--    parent's; app.has_consent for a minor still needs BOTH rows (teen + current active parent).
--  * app.can_train(uid) = onboarded AND effective risk_notice. set_logs insert/update require it, so a
--    16-17 user cannot log workouts until BOTH risk acknowledgements exist. RLS/functions enforce; the
--    client gate (my_onboarding_state) is UI only.

-- ------------------------------------------------------------------ can_train + set_logs
create or replace function app.can_train(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select app.is_minor_onboarded(p_user) and app.has_consent(p_user, 'risk_notice')
$$;
revoke all on function app.can_train(uuid) from public, anon;
grant execute on function app.can_train(uuid) to authenticated;

drop policy set_logs_insert_own on public.set_logs;
drop policy set_logs_update_own on public.set_logs;
create policy set_logs_insert_own on public.set_logs for insert to authenticated
  with check (user_id = (select auth.uid()) and app.can_train(user_id)
              and exists (select 1 from public.exercises e where e.id = exercise_id));
create policy set_logs_update_own on public.set_logs for update to authenticated
  using (user_id = (select auth.uid()) and app.can_train(user_id))
  with check (user_id = (select auth.uid()) and app.can_train(user_id));

-- ------------------------------------------------------------------ privacy & safety
create or replace function private.parent_grant_exists(p_minor uuid, p_kind text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.consents c
                   join public.parent_links l on l.minor_user_id = c.user_id and l.parent_user_id = c.actor_user_id
                  where c.user_id = p_minor and c.kind = p_kind and c.grantor = 'parent'
                    and c.granted and c.revoked_at is null and l.status = 'active' and l.is_contracting_party)
$$;

-- One switch, on or off, always leaving an event row with the version + hash shown on screen.
create or replace function private.record_choice(p_user uuid, p_kind text, p_on boolean, p_version text, p_hash text, p_doc_hash text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_on then
    perform private.write_consent(p_user, p_kind, 'self', true, p_version, p_hash, p_doc_hash);
    return;
  end if;
  update public.consents set granted = false, revoked_at = now(), reask_on = null, actor_user_id = auth.uid(), updated_at = now()
   where user_id = p_user and kind = p_kind and grantor = 'self' and granted;
  if found then
    perform private.log_audit(auth.uid(), 'consent_revoked', p_user, jsonb_build_object('kind', p_kind, 'grantor', 'self'));
  end if;
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, policy_doc_hash, actor_user_id)
  values (p_user, p_kind, 'self', false, p_version, p_hash, p_doc_hash, auth.uid());
end $$;

create or replace function public.submit_privacy_safety(
  p_health boolean, p_health_version text, p_health_hash text,
  p_ai boolean, p_ai_version text, p_ai_hash text,
  p_risk_version text, p_risk_hash text, p_health_policy_hash text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_minor boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not app.is_minor_onboarded(v_uid) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_health is null or p_ai is null then raise exception 'invalid_choice' using errcode = '22023'; end if;
  -- [ATTORNEY] the risk checkbox is required: version + hash of the exact safety text.
  if coalesce(length(btrim(p_risk_version)) not between 1 and 64, true) or p_risk_hash is null or p_risk_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'risk_acknowledgement_required' using errcode = '22023';
  end if;
  if coalesce(length(btrim(p_health_version)) not between 1 and 64, true) or coalesce(length(btrim(p_ai_version)) not between 1 and 64, true) then
    raise exception 'invalid_policy_version' using errcode = '22023';
  end if;
  if p_health_hash is null or p_health_hash !~ '^[0-9a-f]{64}$' or p_ai_hash is null or p_ai_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_text_hash' using errcode = '22023';
  end if;
  -- Counsel: the consent log records the health policy document hash on the health AND ai events/rows.
  -- (Defaulted only for Postgres parameter ordering; required at runtime.)
  if p_health_policy_hash is null or p_health_policy_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_policy_hash' using errcode = '22023';
  end if;
  -- Counsel phase4-review #2: AI planning requires the health switch (same grantor: here, the user).
  if p_ai and not p_health then raise exception 'health_required' using errcode = '22023'; end if;
  select is_minor into v_minor from public.profiles where id = v_uid;
  -- A teen can only turn health / AI on once the current parent has granted that scope (Counsel Q2).
  if v_minor and ((p_health and not private.parent_grant_exists(v_uid, 'health_data'))
               or (p_ai and not private.parent_grant_exists(v_uid, 'ai_vendor'))) then
    raise exception 'parent_consent_required' using errcode = '42501';
  end if;

  -- Health first: it is the precondition for the AI grant. Health off needs no cascade here because
  -- p_ai is false in that case (checked above) and its own off event is written next.
  perform private.record_choice(v_uid, 'health_data', p_health, btrim(p_health_version), p_health_hash, p_health_policy_hash);
  perform private.record_choice(v_uid, 'ai_vendor', p_ai, btrim(p_ai_version), p_ai_hash, p_health_policy_hash);
  perform private.write_consent(v_uid, 'risk_notice', 'self', true, btrim(p_risk_version), p_risk_hash);
  perform private.log_audit(v_uid, 'privacy_safety_submitted', v_uid, jsonb_build_object('health', p_health, 'ai', p_ai));
  return jsonb_build_object('can_train', app.can_train(v_uid));
end $$;

-- ------------------------------------------------------------------ onboarding state (own row only; UI gate)
-- Returns null when the caller has no profile. parent_risk_done is null for adults.
-- health_reask_due (Counsel: health consent is re-asked every 12 months): true when effective health_data
-- is on and a granting row (the user's own, or the current contracting parent's) has reask_on <= today.
-- The consent does NOT expire; the re-ask UI is a later TODO.
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
    'parent_risk_done', case when v_p.is_minor then private.parent_grant_exists(v_uid, 'risk_notice') end);
end $$;

-- ------------------------------------------------------------------ retention additions
insert into public.retention_policies (record_type, keep_rule, implemented, status) values
  ('parent_invite_email', 'Parent email used only to send the invite; delete when the invite is used or expires',
   'parent_invites.parent_email is NULLed on accept, cancel and expiry (expiry = minor profile created_at + 14 days); the day-14 purge cascades the rows.', 'enforced'),
  ('trainer_code_attempts', 'Rate-limit records: 30 days (peppered IP / device hashes only)',
   'private.trainer_code_attempts and private.parent_invite_attempts rows older than 30 days are purged.', 'enforced');

create or replace function public.run_retention_purge()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r jsonb := '{}'::jsonb; n integer; v_user uuid;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;

  r := r || jsonb_build_object('minor_flags_recomputed', public.recompute_minor_flags());
  r := r || jsonb_build_object('unprofiled_auth_users', public.purge_unprofiled_auth_users(interval '24 hours'));
  r := r || jsonb_build_object('pending_minors', public.purge_pending_minors());
  r := r || jsonb_build_object('parent_invites_expired', private.expire_parent_invites());

  -- health data: shred 29 days after the effective health_data consent was revoked (deadline is 30).
  n := 0;
  for v_user in
    select h.user_id from public.health_records h
     where not app.has_consent(h.user_id, 'health_data')
       and not private.on_litigation_hold(h.user_id)
       and exists (select 1 from public.consents c where c.user_id = h.user_id and c.kind = 'health_data'
                     and c.revoked_at is not null and c.revoked_at <= now() - interval '29 days')
    union
    select k.user_id from private.user_data_keys k
     where not exists (select 1 from public.health_records h where h.user_id = k.user_id)
       and not app.has_consent(k.user_id, 'health_data')
       and not private.on_litigation_hold(k.user_id)
       and exists (select 1 from public.consents c where c.user_id = k.user_id and c.kind = 'health_data'
                     and c.revoked_at is not null and c.revoked_at <= now() - interval '29 days')
  loop
    perform public.health_shred(v_user); n := n + 1;
  end loop;
  r := r || jsonb_build_object('health_shredded', n);

  delete from public.consent_events e
   where e.retain_until is not null and e.retain_until < now() and not private.on_litigation_hold(e.user_id);
  get diagnostics n = row_count; r := r || jsonb_build_object('consent_events', n);

  delete from public.data_export_requests d
   where d.status in ('completed','rejected') and coalesce(d.completed_at, d.requested_at) < now() - interval '4 years'
     and not private.on_litigation_hold(d.user_id);
  get diagnostics n = row_count; r := r || jsonb_build_object('data_export_requests', n);
  delete from public.account_deletion_requests d
   where d.status in ('completed','cancelled') and coalesce(d.completed_at, d.requested_at) < now() - interval '4 years'
     and not private.on_litigation_hold(d.user_id);
  get diagnostics n = row_count; r := r || jsonb_build_object('account_deletion_requests', n);

  delete from public.audit_log a
   where a.action = 'health_read_by_coach' and a.at < now() - interval '2 years'
     and not private.on_litigation_hold(a.target_user_id) and not private.on_litigation_hold(a.actor_id);
  get diagnostics n = row_count; r := r || jsonb_build_object('coach_access_audit', n);

  delete from private.trainer_code_attempts where at < now() - interval '30 days';
  get diagnostics n = row_count; r := r || jsonb_build_object('trainer_code_attempts', n);
  delete from private.parent_invite_attempts where at < now() - interval '30 days';
  get diagnostics n = row_count; r := r || jsonb_build_object('parent_invite_attempts', n);

  perform private.log_audit(auth.uid(), 'retention_purge_ran', null, r);
  return r;
end $$;

-- ------------------------------------------------------------------ grants
revoke all on function public.submit_privacy_safety(boolean, text, text, boolean, text, text, text, text, text),
  public.my_onboarding_state(), public.run_retention_purge() from public, anon, authenticated;
grant execute on function public.submit_privacy_safety(boolean, text, text, boolean, text, text, text, text, text),
  public.my_onboarding_state() to authenticated;
grant execute on function public.submit_privacy_safety(boolean, text, text, boolean, text, text, text, text, text),
  public.my_onboarding_state(), public.run_retention_purge() to service_role;
revoke all on function private.parent_grant_exists(uuid, text), private.record_choice(uuid, text, boolean, text, text, text)
  from public, anon, authenticated;
