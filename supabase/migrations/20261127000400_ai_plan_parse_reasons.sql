-- Two more reason codes for the AI plan filter log, so intermittent "We couldn't use this plan" failures
-- can be told apart: 'truncated' (the reply hit max_tokens) and 'day_count' (wrong number of training
-- days). 'unparseable' stays for every other unreadable reply. Still the reason code alone: the
-- rejected draft, the prompt and the model output are never written anywhere.
create or replace function public.log_ai_plan_filtered(p_actor uuid, p_reason_code text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform private.require_service();
  if p_actor is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_reason_code is null or p_reason_code not in
       ('eating_disorder','body_shaming','medical_treatment','minor_weight_loss','minor_restricted',
        'unparseable','truncated','day_count','refusal') then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  perform private.log_audit(p_actor, 'ai_plan_filtered', p_actor, jsonb_build_object('reason', p_reason_code));
end $$;
revoke all on function public.log_ai_plan_filtered(uuid, text) from public, anon, authenticated;
grant execute on function public.log_ai_plan_filtered(uuid, text) to service_role;
