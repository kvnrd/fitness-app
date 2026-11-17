-- Kevin Nov 17: optional flag TEEN_NO_GOAL_WEIGHT_OR_LOSS_ADVICE is off.
-- Teens with both health opt-ins may store a weight goal. Coaches still never
-- see a minor's weight or health info.

create or replace function app.teen_no_goal_weight_or_loss_advice()
returns boolean
language sql immutable parallel safe security definer set search_path = public, pg_temp as $$
  select false;
$$;
revoke all on function app.teen_no_goal_weight_or_loss_advice() from public, anon;
grant execute on function app.teen_no_goal_weight_or_loss_advice() to authenticated;

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
  -- Kevin Nov 17: TEEN_NO_GOAL_WEIGHT_OR_LOSS_ADVICE is off, so teens with both
  -- health opt-ins may store a weight goal. Flip app.teen_no_goal_weight_or_loss_advice()
  -- to true to restore the refusal. Coaches still never see a minor's weight.
  if p_weight_goal_ct is not null and 'weight_goal' = any (v_set)
     and exists (select 1 from public.profiles where id = v_subject and is_minor)
     and app.teen_no_goal_weight_or_loss_advice() then
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
