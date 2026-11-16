-- Phase 3 / training setup (goal, style, follow-ups, gym, preferences). One row per user.
--  * No client writes at all: the only writer is public.save_training_setup(jsonb) (definer).
--  * Pending 16-17 accounts (no active parent link) cannot save: they keep steps 6-8 on the device.
--  * Body weights are health data and are NEVER accepted here: unknown keys (current_weight,
--    target_weight, ...) are rejected at every level of the payload.
--  * Minors may only use the minor-safe goal ids (Counsel-approved, phase4-review #1: general_fitness,
--    build_strength, learn_lifts, endurance, sport_event, consistency; single pick) and no pace; adults only lose/gain/maintain (+ pace).
--  * Allowlists come from onboarding-notes.md (styles, follow-ups, the 31 equipment items, presets, accents).
--  * Read: the owner, and the active contracting parent (Counsel Q7). Coaches get no access here.

create table public.training_setups (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  goal          text check (goal is null or goal in
                  ('lose','gain','maintain','general_fitness','build_strength','learn_lifts','endurance','sport_event','consistency')),
  goal_pace     text check (goal_pace is null or goal_pace in ('steady','moderate','fast')),
  styles        text[] check (styles is null or (cardinality(styles) between 1 and 6
                  and styles <@ array['hybrid','hyrox','bodybuilding','powerlifting','crossfit','general']::text[])),
  main_style    text check (main_style is null or main_style in ('hybrid','hyrox','bodybuilding','powerlifting','crossfit','general')),
  days_per_week smallint check (days_per_week is null or days_per_week between 2 and 7),
  followups     jsonb check (followups is null or (jsonb_typeof(followups) = 'object' and octet_length(followups::text) <= 2000)),
  gym           jsonb check (gym is null or (jsonb_typeof(gym) = 'object' and octet_length(gym::text) <= 4000)),
  units         text check (units is null or units in ('lb','kg')),
  distance      text check (distance is null or distance in ('mi','km')),
  accent        text check (accent is null or accent in ('champagne','volt','signal_orange','electric_blue','hot_red','ice_cyan','mono')
                  or accent ~ '^#[0-9A-Fa-f]{6}$'),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (main_style is null or styles is null or main_style = any (styles)),
  check (goal_pace is null or goal in ('lose','gain','maintain')),
  check (completed_at is null or (styles is not null and main_style is not null and days_per_week is not null
         and gym is not null and units is not null and distance is not null and accent is not null))
);
create trigger training_setups_touch before update on public.training_setups
  for each row execute function private.touch_updated_at();

alter table public.training_setups enable row level security;
alter table public.training_setups force row level security;
revoke all on table public.training_setups from public, anon, authenticated;
grant all on table public.training_setups to service_role;
grant select on public.training_setups to authenticated;
create policy training_setups_select_own on public.training_setups for select to authenticated
  using (user_id = (select auth.uid()));
create policy training_setups_select_parent on public.training_setups for select to authenticated
  using (app.is_active_parent_of(user_id));
-- No insert/update/delete grant and no write policy: direct client writes are impossible.

-- ------------------------------------------------------------------ validators (private, pure)
create or replace function private.jnum_ok(p_val jsonb, p_lo numeric, p_hi numeric, p_int boolean default false)
returns boolean language sql immutable as $$
  select jsonb_typeof(p_val) = 'number'
     and (p_val #>> '{}')::numeric between p_lo and p_hi
     and (not p_int or (p_val #>> '{}')::numeric = trunc((p_val #>> '{}')::numeric))
$$;

create or replace function private.jkeys_within(p_obj jsonb, p_allowed text[])
returns boolean language sql immutable as $$
  select jsonb_typeof(p_obj) = 'object'
     and not exists (select 1 from jsonb_object_keys(p_obj) k where k <> all (p_allowed))
$$;

-- array of distinct strings, every one in the allowlist
create or replace function private.jstrings_within(p_arr jsonb, p_allowed text[], p_max integer)
returns boolean language plpgsql immutable as $$
declare v_n integer; v_d integer; v_ok boolean;
begin
  if jsonb_typeof(p_arr) <> 'array' then return false; end if;
  if exists (select 1 from jsonb_array_elements(p_arr) e where jsonb_typeof(e) <> 'string') then return false; end if;
  select count(*), count(distinct s.e), coalesce(bool_and(s.e = any (p_allowed)), true)
    into v_n, v_d, v_ok from jsonb_array_elements_text(p_arr) s(e);
  return v_ok and v_n = v_d and v_n <= p_max;
end $$;

-- Follow-ups: one optional section per PICKED style, each with a closed set of keys.
create or replace function private.setup_followups_ok(f jsonb, p_styles text[])
returns boolean language plpgsql immutable as $$
declare k text; s jsonb; m text;
begin
  if f is null then return true; end if;
  if not private.jkeys_within(f, array['hybrid','hyrox','bodybuilding','powerlifting','crossfit']) then return false; end if;
  if octet_length(f::text) > 2000 then return false; end if;
  for k, s in select * from jsonb_each(f) loop
    if p_styles is null or not (k = any (p_styles)) then return false; end if;
    if k = 'hybrid' then
      if not private.jkeys_within(s, array['run_lift_pct']) then return false; end if;
      if s ? 'run_lift_pct' and not private.jnum_ok(s -> 'run_lift_pct', 0, 100, true) then return false; end if;
    elsif k = 'hyrox' then
      if not private.jkeys_within(s, array['race_date','division']) then return false; end if;
      if s ? 'division' and (jsonb_typeof(s -> 'division') <> 'string' or (s ->> 'division') <> all (array['open','pro','doubles'])) then return false; end if;
      if s ? 'race_date' and jsonb_typeof(s -> 'race_date') <> 'null' then
        if jsonb_typeof(s -> 'race_date') <> 'string' or (s ->> 'race_date') !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
        begin perform (s ->> 'race_date')::date; exception when others then return false; end;
      end if;
    elsif k = 'bodybuilding' then
      if not private.jkeys_within(s, array['focus']) then return false; end if;
      if s ? 'focus' and not private.jstrings_within(s -> 'focus', array['balanced','chest','back','legs','shoulders','arms','glutes'], 7) then return false; end if;
    elsif k = 'powerlifting' then
      if not private.jkeys_within(s, array['compete','maxes']) then return false; end if;
      if s ? 'compete' and jsonb_typeof(s -> 'compete') <> 'boolean' then return false; end if;
      if s ? 'maxes' and jsonb_typeof(s -> 'maxes') <> 'null' then
        if not private.jkeys_within(s -> 'maxes', array['squat','bench','deadlift']) then return false; end if;
        for m in select jsonb_object_keys(s -> 'maxes') loop
          if not private.jnum_ok(s -> 'maxes' -> m, 1, 2000) then return false; end if;
        end loop;
      end if;
    elsif k = 'crossfit' then
      if not private.jkeys_within(s, array['experience']) then return false; end if;
      if s ? 'experience' and (jsonb_typeof(s -> 'experience') <> 'string'
         or (s ->> 'experience') <> all (array['beginner','intermediate','experienced'])) then return false; end if;
    end if;
  end loop;
  return true;
end $$;

-- Gym: name <= 40, preset, equipment items (the 31 from onboarding-notes) and max-weight caps.
create or replace function private.setup_gym_ok(g jsonb)
returns boolean language plpgsql immutable as $$
declare
  v_items constant text[] := array[
    'barbell','dumbbells','kettlebells','ez_bar','plates',
    'squat_rack','power_rack','bench','smith_machine',
    'cable_stack','lat_pulldown','leg_press','leg_extension_curl','chest_press','seated_row','shoulder_press','hack_squat','pec_deck',
    'treadmill','bike','rower','skierg','elliptical','stair_climber','assault_bike',
    'pull_up_bar','bands','dip_station','sled','plyo_box','trx'];
  m text;
begin
  if g is null then return true; end if;
  if not private.jkeys_within(g, array['name','preset','items','maxes']) then return false; end if;
  if octet_length(g::text) > 4000 then return false; end if;
  if not (g ? 'name' and g ? 'preset' and g ? 'items') then return false; end if;
  if jsonb_typeof(g -> 'name') <> 'string' or length(btrim(g ->> 'name')) not between 1 and 40
     or (g ->> 'name') ~ '[[:cntrl:]]' then return false; end if;
  if jsonb_typeof(g -> 'preset') <> 'string'
     or (g ->> 'preset') <> all (array['full','home','hotel','bodyweight','custom']) then return false; end if;
  if not private.jstrings_within(g -> 'items', v_items, 31) then return false; end if;
  if g ? 'maxes' and jsonb_typeof(g -> 'maxes') <> 'null' then
    if not private.jkeys_within(g -> 'maxes', array['barbell','dumbbells','kettlebells']) then return false; end if;
    for m in select jsonb_object_keys(g -> 'maxes') loop
      if not private.jnum_ok(g -> 'maxes' -> m, 1, 1500) then return false; end if;
      if not (g -> 'items') @> to_jsonb(m) then return false; end if;   -- a cap needs that item selected
    end loop;
  end if;
  return true;
end $$;

-- ------------------------------------------------------------------ the only writer
-- p_setup keys present REPLACE that field (JSON null clears it); absent keys keep the stored value, so a
-- teen can save the goal first and upload the device-only steps 6-8 later. completed_at is set the first
-- time every required field is present. Any invalid payload raises the same generic invalid_setup.
create or replace function public.save_training_setup(p_setup jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_minor boolean;
  v_cur public.training_setups%rowtype;
  v_goal text; v_pace text; v_styles text[]; v_main text; v_days smallint; v_follow jsonb; v_gym jsonb;
  v_units text; v_dist text; v_accent text;
  v_complete boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- Pending 16-17 (no active contracting parent) and unknown users: one generic refusal.
  if not app.is_minor_onboarded(v_uid) then raise exception 'not_allowed' using errcode = '42501'; end if;
  if p_setup is null or not private.jkeys_within(p_setup,
       array['goal','goal_pace','styles','main_style','days_per_week','followups','gym','units','distance','accent']) then
    raise exception 'invalid_setup' using errcode = '22023';
  end if;
  select is_minor into v_minor from public.profiles where id = v_uid;
  select * into v_cur from public.training_setups where user_id = v_uid;

  v_goal   := case when p_setup ? 'goal'          then p_setup ->> 'goal'          else v_cur.goal end;
  v_pace   := case when p_setup ? 'goal_pace'     then p_setup ->> 'goal_pace'     else v_cur.goal_pace end;
  v_main   := case when p_setup ? 'main_style'    then p_setup ->> 'main_style'    else v_cur.main_style end;
  v_units  := case when p_setup ? 'units'         then p_setup ->> 'units'         else v_cur.units end;
  v_dist   := case when p_setup ? 'distance'      then p_setup ->> 'distance'      else v_cur.distance end;
  v_accent := case when p_setup ? 'accent'        then p_setup ->> 'accent'        else v_cur.accent end;
  v_follow := case when p_setup ? 'followups'     then nullif(p_setup -> 'followups', 'null'::jsonb) else v_cur.followups end;
  v_gym    := case when p_setup ? 'gym'           then nullif(p_setup -> 'gym', 'null'::jsonb)       else v_cur.gym end;
  v_styles := v_cur.styles;
  v_days   := v_cur.days_per_week;

  if p_setup ? 'styles' then
    if jsonb_typeof(p_setup -> 'styles') = 'null' then v_styles := null;
    elsif private.jstrings_within(p_setup -> 'styles',
            array['hybrid','hyrox','bodybuilding','powerlifting','crossfit','general'], 6)
          and jsonb_array_length(p_setup -> 'styles') >= 1 then
      select array_agg(s.e order by s.o) into v_styles from jsonb_array_elements_text(p_setup -> 'styles') with ordinality s(e, o);
    else raise exception 'invalid_setup' using errcode = '22023'; end if;
  end if;
  if p_setup ? 'days_per_week' then
    if jsonb_typeof(p_setup -> 'days_per_week') = 'null' then v_days := null;
    elsif private.jnum_ok(p_setup -> 'days_per_week', 2, 7, true) then v_days := (p_setup ->> 'days_per_week')::numeric::smallint;
    else raise exception 'invalid_setup' using errcode = '22023'; end if;
  end if;

  -- Goal rules by age band. Minors: minor-safe ids only, never a pace. Adults: lose/gain/maintain (+ pace).
  if v_goal is not null then
    if v_minor then
      if v_goal <> all (array['general_fitness','build_strength','learn_lifts','endurance','sport_event','consistency']) or v_pace is not null then
        raise exception 'invalid_setup' using errcode = '22023';
      end if;
    elsif v_goal <> all (array['lose','gain','maintain']) then
      raise exception 'invalid_setup' using errcode = '22023';
    end if;
  elsif v_pace is not null then
    raise exception 'invalid_setup' using errcode = '22023';
  end if;
  if v_pace is not null and v_pace <> all (array['steady','moderate','fast']) then raise exception 'invalid_setup' using errcode = '22023'; end if;
  if v_main is not null and (v_styles is null or not (v_main = any (v_styles))) then raise exception 'invalid_setup' using errcode = '22023'; end if;
  if v_units is not null and v_units <> all (array['lb','kg']) then raise exception 'invalid_setup' using errcode = '22023'; end if;
  if v_dist is not null and v_dist <> all (array['mi','km']) then raise exception 'invalid_setup' using errcode = '22023'; end if;
  if v_accent is not null and v_accent <> all (array['champagne','volt','signal_orange','electric_blue','hot_red','ice_cyan','mono'])
     and v_accent !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'invalid_setup' using errcode = '22023'; end if;
  if not private.setup_followups_ok(v_follow, v_styles) or not private.setup_gym_ok(v_gym) then
    raise exception 'invalid_setup' using errcode = '22023';
  end if;

  v_complete := v_styles is not null and v_main is not null and v_days is not null and v_gym is not null
                and v_units is not null and v_dist is not null and v_accent is not null;

  insert into public.training_setups (user_id, goal, goal_pace, styles, main_style, days_per_week, followups, gym,
                                      units, distance, accent, completed_at)
  values (v_uid, v_goal, v_pace, v_styles, v_main, v_days, v_follow, v_gym, v_units, v_dist, v_accent,
          case when v_complete then now() end)
  on conflict (user_id) do update set
    goal = excluded.goal, goal_pace = excluded.goal_pace, styles = excluded.styles, main_style = excluded.main_style,
    days_per_week = excluded.days_per_week, followups = excluded.followups, gym = excluded.gym,
    units = excluded.units, distance = excluded.distance, accent = excluded.accent,
    completed_at = case when v_complete then coalesce(public.training_setups.completed_at, now()) end;
  perform private.log_audit(v_uid, 'training_setup_saved', v_uid, '{}'::jsonb);   -- no content in the audit row
  return jsonb_build_object('completed', v_complete);
end $$;

-- ------------------------------------------------------------------ grants
revoke all on function public.save_training_setup(jsonb) from public, anon, authenticated;
grant execute on function public.save_training_setup(jsonb) to authenticated, service_role;
revoke all on function private.jnum_ok(jsonb, numeric, numeric, boolean), private.jkeys_within(jsonb, text[]),
  private.jstrings_within(jsonb, text[], integer), private.setup_followups_ok(jsonb, text[]), private.setup_gym_ok(jsonb)
  from public, anon, authenticated;
