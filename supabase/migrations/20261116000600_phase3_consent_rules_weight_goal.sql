-- Phase 3 / Counsel phase4-review follow-ups on the consent core and the health record.
--  * AI requires health (#2): an ai_vendor GRANT needs a health_data grant by the SAME grantor that is
--    currently on (else 'health_required'); revoking health_data revokes ai_vendor for that grantor, on
--    every path (revoke_consent self / parent-for-teen, and through the existing parent -> teen cascade,
--    which now covers ai_vendor as well). app.has_consent(uid,'ai_vendor') is false whenever effective
--    health_data is false, so every reader (ai_plan_context, ...) inherits the rule.
--  * Health consent re-ask every 12 months: consents.reask_on = grant date + 12 months, set on every
--    grant of health_data, null otherwise / when revoked. The consent does NOT expire; my_onboarding_state
--    exposes health_reask_due. (Re-ask UI is a later TODO.)
--  * Policy document hashes: write_consent / record_consent carry policy_doc_hash (column added in 000100).
--    'privacy_policy' and 'terms' stay out of record_consent / revoke_consent (closed list in
--    private.consent_target).
--  * health_records.weight_goal_ct: a fourth KMS-envelope field (adult body-weight goal). health_write now
--    does partial updates (p_set lists the fields being written; an omitted field KEEPS its stored value,
--    an explicit null in p_set clears it). A 16-17 account can never store a weight goal.

alter table public.consents add column reask_on date;
alter table public.consents add constraint consents_reask_only_health_chk
  check (reask_on is null or (kind = 'health_data' and granted and revoked_at is null));
-- Rows granted before this migration get the date from their grant time.
update public.consents set reask_on = (granted_at + interval '12 months')::date
 where kind = 'health_data' and granted and revoked_at is null;

-- ------------------------------------------------------------------ effective consent
-- Same as 2b, plus: effective AI also needs effective health (no recursion: health_data does not look back).
create or replace function app.has_consent(p_user uuid, p_kind text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  with parent_ok as (
    select exists (select 1 from public.consents c
                     join public.parent_links l on l.minor_user_id = c.user_id and l.parent_user_id = c.actor_user_id
                    where c.user_id = p_user and c.kind = p_kind and c.grantor = 'parent'
                      and c.granted and c.revoked_at is null
                      and l.status = 'active' and l.is_contracting_party) as ok
  ), self_ok as (
    select exists (select 1 from public.consents c
                    where c.user_id = p_user and c.kind = p_kind and c.grantor = 'self'
                      and c.granted and c.revoked_at is null) as ok
  )
  select case
    when p_kind = 'parental' then (select ok from parent_ok)
    when exists (select 1 from public.profiles p where p.id = p_user and p.is_minor)
      then (select ok from self_ok) and (select ok from parent_ok)
    else (select ok from self_ok)
  end
  and (p_kind <> 'ai_vendor' or app.has_consent(p_user, 'health_data'))
$$;

-- ------------------------------------------------------------------ write_consent
drop function private.write_consent(uuid, text, text, boolean, text, text);
create or replace function private.write_consent(p_target uuid, p_kind text, p_grantor text, p_granted boolean,
  p_version text, p_text_hash text, p_policy_doc_hash text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_granted then
    -- AI needs a health grant by the same grantor that is on right now.
    if p_kind = 'ai_vendor' and not exists (select 1 from public.consents c
         where c.user_id = p_target and c.kind = 'health_data' and c.grantor = p_grantor
           and c.granted and c.revoked_at is null) then
      raise exception 'health_required' using errcode = '22023';
    end if;
    insert into public.consents (user_id, kind, grantor, granted, policy_version, text_hash, policy_doc_hash,
                                 granted_at, revoked_at, reask_on, actor_user_id, updated_at)
    values (p_target, p_kind, p_grantor, true, p_version, p_text_hash, p_policy_doc_hash, now(), null,
            case when p_kind = 'health_data' then (now() + interval '12 months')::date end, auth.uid(), now())
    on conflict (user_id, kind, grantor) do update
      set granted = true, policy_version = excluded.policy_version, text_hash = excluded.text_hash,
          policy_doc_hash = excluded.policy_doc_hash, granted_at = now(), revoked_at = null,
          reask_on = excluded.reask_on, actor_user_id = auth.uid(), updated_at = now();
  else
    update public.consents set granted = false, revoked_at = now(), reask_on = null, actor_user_id = auth.uid(), updated_at = now()
     where user_id = p_target and kind = p_kind and grantor = p_grantor and granted
    returning policy_version, text_hash, policy_doc_hash into p_version, p_text_hash, p_policy_doc_hash;
    if not found then return; end if;
  end if;
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, policy_doc_hash, actor_user_id)
  values (p_target, p_kind, p_grantor, p_granted, p_version, p_text_hash, p_policy_doc_hash, auth.uid());
  perform private.log_audit(auth.uid(), case when p_granted then 'consent_granted' else 'consent_revoked' end, p_target,
                            jsonb_build_object('kind', p_kind, 'grantor', p_grantor));
  -- Health off => AI off for the same grantor (no-op when that AI grant is not on).
  if p_kind = 'health_data' and not p_granted then
    perform private.write_consent(p_target, 'ai_vendor', p_grantor, false, null, null);
  end if;
end $$;

-- ------------------------------------------------------------------ record_consent (+ optional document hash)
drop function public.record_consent(text, text, uuid, text);
create or replace function public.record_consent(p_kind text, p_policy_version text, p_for_user uuid default null,
  p_text_hash text default null, p_policy_doc_hash text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t record;
begin
  select * into t from private.consent_target(p_kind, p_for_user);
  if p_policy_version is null or length(btrim(p_policy_version)) not between 1 and 64 then
    raise exception 'invalid_policy_version' using errcode = '22023';
  end if;
  if (p_text_hash is not null and p_text_hash !~ '^[0-9a-f]{64}$')
     or (p_policy_doc_hash is not null and p_policy_doc_hash !~ '^[0-9a-f]{64}$') then
    raise exception 'invalid_text_hash' using errcode = '22023';
  end if;
  -- Minor's own switch stays locked until the current parent has granted the same scope (Counsel Q2).
  if t.o_grantor = 'self' and exists (select 1 from public.profiles where id = t.o_target and is_minor) then
    if not private.parent_grant_exists(t.o_target, p_kind) then
      raise exception 'parent_consent_required' using errcode = '42501';
    end if;
  end if;
  -- ai_vendor additionally needs the same grantor's health grant: write_consent raises health_required.
  perform private.write_consent(t.o_target, p_kind, t.o_grantor, true, btrim(p_policy_version), p_text_hash, p_policy_doc_hash);
end $$;

-- revoke_consent is unchanged: its write_consent calls now cascade health -> ai for each grantor, so the
-- parent -> teen cascade (parent revokes health => teen's health off too) also turns the AI rows off.

revoke all on function public.record_consent(text, text, uuid, text, text) from public, anon;
grant execute on function public.record_consent(text, text, uuid, text, text) to authenticated, service_role;
revoke all on function private.write_consent(uuid, text, text, boolean, text, text, text) from public, anon, authenticated;

-- ------------------------------------------------------------------ AI plan context: both consents
create or replace function public.ai_plan_context(p_actor uuid)
returns table (age_band text, health_ok boolean, wrapped_key bytea, key_provider text, kms_key_ref text, injury_category_ct bytea)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare v_band text;
begin
  perform private.require_service();
  if p_actor is null or not app.is_minor_onboarded(p_actor) then raise exception 'forbidden' using errcode = '42501'; end if;
  -- Effective ai_vendor AND health_data (adults: their own; 16-17: teen AND current parent for each).
  if not app.has_consent(p_actor, 'ai_vendor') or not app.has_consent(p_actor, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  if (select count(*) from public.audit_log a
       where a.actor_id = p_actor and a.action = 'ai_plan_requested' and a.at > now() - interval '1 hour') >= 20 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;
  select p.age_band into v_band from public.profiles p where p.id = p_actor;
  perform private.log_audit(p_actor, 'ai_plan_requested', p_actor, '{}'::jsonb);
  return query select v_band, true, k.wrapped_key, k.key_provider, k.kms_key_ref, h.injury_category_ct
    from (select 1) one
    left join private.user_data_keys k on k.user_id = p_actor
    left join public.health_records h on h.user_id = p_actor;
end $$;

-- ------------------------------------------------------------------ health record: weight_goal + partial writes
alter table public.health_records add column weight_goal_ct bytea;   -- JSON string, AES-GCM envelope. Adults only.

drop function public.health_write(uuid, bytea, bytea, bytea);
-- p_set = the fields being written ('injury_notes','health_screen','injury_category','weight_goal').
-- A listed field is replaced by its ciphertext argument (null clears it); an unlisted field keeps its
-- stored value. p_set = null means "all four" (full replace; the pre-weight_goal behaviour).
create or replace function public.health_write(p_actor uuid, p_injury_notes_ct bytea, p_health_screen_ct bytea,
  p_injury_category_ct bytea, p_weight_goal_ct bytea default null, p_set text[] default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_all constant text[] := array['injury_notes','health_screen','injury_category','weight_goal'];
  v_set text[] := coalesce(p_set, v_all);
begin
  perform private.require_service();
  if p_actor is null or not app.is_minor_onboarded(p_actor) or not app.has_consent(p_actor, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  if not (v_set <@ v_all) then raise exception 'invalid_argument' using errcode = '22023'; end if;
  -- Counsel phase4-review #5: no weight targets for 16-17 (clearing is allowed).
  if p_weight_goal_ct is not null and 'weight_goal' = any (v_set)
     and exists (select 1 from public.profiles where id = p_actor and is_minor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from private.user_data_keys where user_id = p_actor) then
    raise exception 'no_data_key' using errcode = '55000';
  end if;
  insert into public.health_records (user_id, enc_version, injury_notes_ct, health_screen_ct, injury_category_ct, weight_goal_ct, updated_at)
  values (p_actor, 1,
          case when 'injury_notes'    = any (v_set) then p_injury_notes_ct end,
          case when 'health_screen'   = any (v_set) then p_health_screen_ct end,
          case when 'injury_category' = any (v_set) then p_injury_category_ct end,
          case when 'weight_goal'     = any (v_set) then p_weight_goal_ct end, now())
  on conflict (user_id) do update
    set enc_version = 1,
        injury_notes_ct    = case when 'injury_notes'    = any (v_set) then excluded.injury_notes_ct    else health_records.injury_notes_ct end,
        health_screen_ct   = case when 'health_screen'   = any (v_set) then excluded.health_screen_ct   else health_records.health_screen_ct end,
        injury_category_ct = case when 'injury_category' = any (v_set) then excluded.injury_category_ct else health_records.injury_category_ct end,
        weight_goal_ct     = case when 'weight_goal'     = any (v_set) then excluded.weight_goal_ct     else health_records.weight_goal_ct end,
        updated_at = now();
  perform private.log_audit(p_actor, 'health_written', p_actor, '{}'::jsonb);   -- never which fields or values
end $$;

drop function public.health_read(uuid, uuid);
create or replace function public.health_read(p_actor uuid, p_target uuid default null)
returns table (wrapped_key bytea, key_provider text, kms_key_ref text,
               injury_notes_ct bytea, health_screen_ct bytea, injury_category_ct bytea, weight_goal_ct bytea)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_target uuid := coalesce(p_target, p_actor);
begin
  perform private.require_service();
  if p_actor is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if v_target = p_actor then
    if not app.is_minor_onboarded(p_actor) then raise exception 'forbidden' using errcode = '42501'; end if;
  else
    if not private.coach_can_see_as(p_actor, v_target) then raise exception 'forbidden' using errcode = '42501'; end if;
    if exists (select 1 from public.profiles where id = v_target and is_minor) then return; end if;
  end if;
  if not app.has_consent(v_target, 'health_data') then raise exception 'consent_required' using errcode = '42501'; end if;
  if v_target <> p_actor then
    perform private.log_audit(p_actor, 'health_read_by_coach', v_target, '{}'::jsonb);
  end if;
  return query select k.wrapped_key, k.key_provider, k.kms_key_ref, h.injury_notes_ct, h.health_screen_ct, h.injury_category_ct, h.weight_goal_ct
    from public.health_records h join private.user_data_keys k on k.user_id = h.user_id
   where h.user_id = v_target;
end $$;

revoke all on function public.health_write(uuid, bytea, bytea, bytea, bytea, text[]), public.health_read(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.health_write(uuid, bytea, bytea, bytea, bytea, text[]), public.health_read(uuid, uuid)
  to service_role;
