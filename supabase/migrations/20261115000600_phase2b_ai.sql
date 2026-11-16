-- Phase 2b / AI plan (Counsel section 12-13; vendor decided: Anthropic Messages API, backend only).
-- The ai-plan server function calls public.ai_plan_context(p_actor) with the service role. It returns
-- ONLY what the prompt may contain: the age band and (when health_data consent is on) the wrapped DEK
-- and the encrypted injury CATEGORY. Never the name, email, user id, photos, location or free-text notes.

create or replace function public.ai_plan_context(p_actor uuid)
returns table (age_band text, health_ok boolean, wrapped_key bytea, key_provider text, kms_key_ref text, injury_category_ct bytea)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare v_band text; v_health boolean;
begin
  perform private.require_service();
  if p_actor is null or not app.is_minor_onboarded(p_actor) then raise exception 'forbidden' using errcode = '42501'; end if;
  -- Effective ai_vendor consent: adults their own; 16-17 BOTH the teen and the current parent.
  if not app.has_consent(p_actor, 'ai_vendor') then raise exception 'consent_required' using errcode = '42501'; end if;
  -- Cost / abuse limit: 20 plan requests per user per hour (counted from audit_log, no content stored).
  if (select count(*) from public.audit_log a
       where a.actor_id = p_actor and a.action = 'ai_plan_requested' and a.at > now() - interval '1 hour') >= 20 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;
  select p.age_band into v_band from public.profiles p where p.id = p_actor;
  v_health := app.has_consent(p_actor, 'health_data');
  perform private.log_audit(p_actor, 'ai_plan_requested', p_actor, '{}'::jsonb);
  if v_health then
    return query select v_band, true, k.wrapped_key, k.key_provider, k.kms_key_ref, h.injury_category_ct
      from (select 1) one
      left join private.user_data_keys k on k.user_id = p_actor
      left join public.health_records h on h.user_id = p_actor;
  else
    return query select v_band, false, null::bytea, null::text, null::text, null::bytea;
  end if;
end $$;

revoke all on function public.ai_plan_context(uuid) from public, anon, authenticated;
grant execute on function public.ai_plan_context(uuid) to service_role;
