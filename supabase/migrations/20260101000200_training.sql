-- Phase 2 / training data. Mirrors src/data/types.ts (Program, WorkoutDay, Exercise, SetLog).

create table public.gyms (  -- stub
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(name) between 1 and 120),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.plans (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,  -- the coach
  client_id  uuid references public.profiles(id) on delete set null,          -- assigned client, if any
  gym_id     uuid references public.gyms(id) on delete set null,
  name       text not null check (length(name) between 1 and 120),
  week_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index plans_owner_idx on public.plans (owner_id);
create index plans_client_idx on public.plans (client_id);
create trigger plans_touch before update on public.plans
  for each row execute function private.touch_updated_at();

create table public.plan_days (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references public.plans(id) on delete cascade,
  day_key        text not null check (day_key in ('mon','tue','wed','thu','fri','sat','sun')),
  title          text not null,
  focus          text not null default '',
  duration_min   integer not null default 0 check (duration_min >= 0),
  rest           boolean not null default false,
  notes          text,
  key_points     text[] not null default '{}',   -- WorkoutDay.keyPoints
  video_title    text,
  video_duration text,                           -- WorkoutDay.video.durationLabel
  video_uri      text,
  unique (plan_id, day_key)
);

create table public.exercises (
  id           uuid primary key default gen_random_uuid(),
  plan_day_id  uuid not null references public.plan_days(id) on delete cascade,
  name         text not null,
  kind         text not null check (kind in ('strength','cardio')),
  sets         integer not null default 1 check (sets between 1 and 100),
  target       text not null default '',
  fields       text[] not null default '{}'
               check (fields <@ array['weight','reps','time','distance','calories','power','rpe']::text[]),
  description  text not null default '',
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  position     integer not null default 0
);
create index exercises_day_idx on public.exercises (plan_day_id, position);

-- SetLog values are typed as strings in the app; here they are numeric. The client parses.
-- time is stored as seconds (the app's "mm:ss").
create table public.set_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id) on delete cascade,
  performed_on date not null default current_date,
  set_index    integer not null check (set_index >= 0),
  weight       numeric check (weight is null or weight >= 0),
  reps         integer check (reps is null or reps >= 0),
  time_seconds integer check (time_seconds is null or time_seconds >= 0),
  distance     numeric check (distance is null or distance >= 0),
  calories     numeric check (calories is null or calories >= 0),
  power        numeric check (power is null or power >= 0),
  rpe          numeric check (rpe is null or rpe between 1 and 10),
  done         boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, exercise_id, performed_on, set_index)
);
create index set_logs_exercise_idx on public.set_logs (exercise_id);
create trigger set_logs_touch before update on public.set_logs
  for each row execute function private.touch_updated_at();

-- Caller owns this plan, is a verified coach, and (if the plan is assigned) is still the client's
-- active coach. Ending a relationship therefore also ends the coach's ability to edit that plan.
create or replace function app.can_edit_plan(p_plan uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select app.is_verified_coach() and exists (
    select 1 from public.plans p
    where p.id = p_plan and p.owner_id = auth.uid()
      and (p.client_id is null or app.is_active_coach_of(p.client_id)))
$$;
revoke all on function app.can_edit_plan(uuid) from public, anon;
grant execute on function app.can_edit_plan(uuid) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['gyms','plans','plan_days','exercises','set_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end $$;

-- gyms: stub, creator reads; writes by service only for now.
grant select on public.gyms to authenticated;
create policy gyms_select_creator on public.gyms for select to authenticated
  using (created_by = (select auth.uid()));

-- plans: coach (owner) and assigned client can read. Only a verified coach writes, and only
-- for clients they currently coach.
grant select, insert, delete on public.plans to authenticated;
grant update (name, week_label, client_id, gym_id) on public.plans to authenticated;
create policy plans_select on public.plans for select to authenticated
  using (owner_id = (select auth.uid()) or client_id = (select auth.uid()));
create policy plans_insert on public.plans for insert to authenticated
  with check (owner_id = (select auth.uid()) and app.is_verified_coach()
              and (client_id is null or app.is_active_coach_of(client_id)));
create policy plans_update on public.plans for update to authenticated
  using (owner_id = (select auth.uid()) and app.is_verified_coach())
  with check (owner_id = (select auth.uid()) and app.is_verified_coach()
              and (client_id is null or app.is_active_coach_of(client_id)));
create policy plans_delete on public.plans for delete to authenticated
  using (owner_id = (select auth.uid()) and app.is_verified_coach());

-- plan_days / exercises: readable iff the parent is readable (RLS chains through the subquery).
grant select, insert, update, delete on public.plan_days, public.exercises to authenticated;
create policy plan_days_select on public.plan_days for select to authenticated
  using (exists (select 1 from public.plans p where p.id = plan_id));
create policy plan_days_write on public.plan_days for all to authenticated
  using (app.can_edit_plan(plan_id)) with check (app.can_edit_plan(plan_id));
create policy exercises_select on public.exercises for select to authenticated
  using (exists (select 1 from public.plan_days d where d.id = plan_day_id));
create policy exercises_write on public.exercises for all to authenticated
  using (exists (select 1 from public.plan_days d where d.id = plan_day_id and app.can_edit_plan(d.plan_id)))
  with check (exists (select 1 from public.plan_days d where d.id = plan_day_id and app.can_edit_plan(d.plan_id)));

-- set_logs: owner full access (minors only once a parent is linked); coaches read-only, and only
-- while coach_can_see() holds (active relationship + coach_sharing consent).
grant select, insert, delete on public.set_logs to authenticated;
grant update (set_index, weight, reps, time_seconds, distance, calories, power, rpe, done, performed_on)
  on public.set_logs to authenticated;
create policy set_logs_select_own on public.set_logs for select to authenticated
  using (user_id = (select auth.uid()));
create policy set_logs_select_coach on public.set_logs for select to authenticated
  using (app.coach_can_see(user_id));
create policy set_logs_insert_own on public.set_logs for insert to authenticated
  with check (user_id = (select auth.uid()) and app.is_minor_onboarded(user_id)
              and exists (select 1 from public.exercises e where e.id = exercise_id));
create policy set_logs_update_own on public.set_logs for update to authenticated
  using (user_id = (select auth.uid()) and app.is_minor_onboarded(user_id))
  with check (user_id = (select auth.uid()));
create policy set_logs_delete_own on public.set_logs for delete to authenticated
  using (user_id = (select auth.uid()));
