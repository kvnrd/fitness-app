-- Phase 5 / Progress groundwork (non-UI).
--  * Server-computed strength and cardio chart numbers, PR detection with input limits.
--  * Units and e1RM settings (default Epley, 10-rep cap — Kevin's open decision).
--  * Weigh-ins (ciphertext) only after health_data is on; body-weight share is off by default.
--  * Progress photos: first-use opt-in (never default on), adult + health + opt-in to upload,
--    per-photo coach share for an active 1:1 only. Counsel Phase 3/4 rules are unchanged.

-- ------------------------------------------------------------------ set log PR flag + cardio activity
alter table public.set_logs
  add column if not exists exclude_from_prs boolean not null default false;

grant update (set_index, weight, reps, time_seconds, distance, calories, power, rpe, done, performed_on, exclude_from_prs)
  on public.set_logs to authenticated;

alter table public.exercises
  add column if not exists cardio_activity text
    check (cardio_activity is null or cardio_activity in ('run','bike','row'));

-- ------------------------------------------------------------------ progress settings (units + e1RM)
create table public.progress_settings (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  mass_unit      text not null default 'lb' check (mass_unit in ('lb','kg')),
  distance_unit  text not null default 'mi' check (distance_unit in ('mi','km')),
  e1rm_formula   text not null default 'epley' check (e1rm_formula in ('epley','brzycki')),
  e1rm_rep_cap   integer not null default 10 check (e1rm_rep_cap between 1 and 36),
  updated_at     timestamptz not null default now()
);
alter table public.progress_settings enable row level security;
alter table public.progress_settings force row level security;
revoke all on table public.progress_settings from public, anon, authenticated;
grant all on table public.progress_settings to service_role;
grant select, insert, delete on public.progress_settings to authenticated;
grant update (mass_unit, distance_unit, e1rm_formula, e1rm_rep_cap) on public.progress_settings to authenticated;
create policy progress_settings_own on public.progress_settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function app.progress_settings_for(p_user uuid)
returns public.progress_settings
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare r public.progress_settings;
begin
  select * into r from public.progress_settings where user_id = p_user;
  if not found then
    r.user_id := p_user;
    r.mass_unit := 'lb';
    r.distance_unit := 'mi';
    r.e1rm_formula := 'epley';
    r.e1rm_rep_cap := 10;
  end if;
  return r;
end $$;
revoke all on function app.progress_settings_for(uuid) from public, anon;
grant execute on function app.progress_settings_for(uuid) to authenticated;

-- ------------------------------------------------------------------ e1RM (pounds, same formulas as src/progress/e1rm.ts)
create or replace function app.e1rm(p_weight numeric, p_reps integer, p_formula text default 'epley', p_cap integer default 10)
returns numeric
language plpgsql immutable parallel safe set search_path = public, pg_temp as $$
begin
  if p_formula is null or p_formula not in ('epley','brzycki') then
    raise exception 'unknown_e1rm_formula' using errcode = '22023';
  end if;
  if p_cap is null or p_cap < 1 or p_cap > 36 then
    raise exception 'invalid_e1rm_cap' using errcode = '22023';
  end if;
  if p_weight is null or p_reps is null then return null; end if;
  if p_weight < 50 or p_weight > 700 or p_reps < 1 or p_reps > 50 or p_reps > p_cap then
    return null;
  end if;
  if p_formula = 'epley' then
    return p_weight * (1 + p_reps / 30.0);
  end if;
  return (p_weight * 36) / (37 - p_reps);
end $$;
revoke all on function app.e1rm(numeric, integer, text, integer) from public, anon;
grant execute on function app.e1rm(numeric, integer, text, integer) to authenticated;

create or replace function app.range_start(p_range text, p_now date default current_date)
returns date
language plpgsql immutable parallel safe set search_path = public, pg_temp as $$
begin
  if p_range is null or p_range = 'All' then return null; end if;
  if p_range = '1M' then return p_now - 30; end if;
  if p_range = '3M' then return p_now - 90; end if;
  if p_range = '6M' then return p_now - 180; end if;
  if p_range = '1Y' then return p_now - 365; end if;
  raise exception 'invalid_chart_range' using errcode = '22023';
end $$;
revoke all on function app.range_start(text, date) from public, anon;
grant execute on function app.range_start(text, date) to authenticated;

-- Strength chart points for the caller. Weights in set_logs are canonical pounds.
-- A session is a PR when its best-set e1RM beats the previous best by more than 0.5 lb.
create or replace function public.strength_progress(
  p_exercise uuid,
  p_range text default '3M',
  p_formula text default null,
  p_cap integer default null,
  p_now date default current_date
) returns table (
  performed_on date,
  e1rm numeric,
  top_set numeric,
  volume numeric,
  is_pr boolean
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_settings public.progress_settings;
  v_formula text;
  v_cap integer;
  v_start date;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_exercise is null then raise exception 'invalid_exercise' using errcode = '22023'; end if;
  v_settings := app.progress_settings_for(v_uid);
  v_formula := coalesce(p_formula, v_settings.e1rm_formula);
  v_cap := coalesce(p_cap, v_settings.e1rm_rep_cap);
  v_start := app.range_start(p_range, p_now);
  return query
  with sessions as (
    select l.performed_on,
           max(app.e1rm(l.weight, l.reps, v_formula, v_cap))
             filter (where not l.exclude_from_prs) as e1rm,
           max(l.weight)
             filter (where l.weight between 50 and 700 and l.reps between 1 and 50) as top_set,
           coalesce(sum(l.weight * l.reps)
             filter (where l.weight between 50 and 700 and l.reps between 1 and 50), 0) as volume
      from public.set_logs l
     where l.user_id = v_uid
       and l.exercise_id = p_exercise
       and l.done
       and (v_start is null or l.performed_on >= v_start)
     group by l.performed_on
  ),
  ordered as (
    select s.performed_on, s.e1rm, s.top_set, s.volume,
           max(s.e1rm) over (order by s.performed_on
                             rows between unbounded preceding and 1 preceding) as prev_best
      from sessions s
  )
  select o.performed_on, o.e1rm, o.top_set, o.volume,
         (o.e1rm is not null and (o.prev_best is null or o.e1rm - o.prev_best > 0.5)) as is_pr
    from ordered o
   order by o.performed_on;
end $$;
revoke all on function public.strength_progress(uuid, text, text, integer, date) from public, anon;
grant execute on function public.strength_progress(uuid, text, text, integer, date) to authenticated;

-- Cardio chart points. set_logs.distance is metres; time is seconds. Row splits are always /500 m.
create or replace function public.cardio_progress(
  p_exercise uuid,
  p_range text default '3M',
  p_now date default current_date
) returns table (
  performed_on date,
  distance_m numeric,
  time_seconds numeric,
  pace_sec_per_km numeric,
  split_sec_per_500m numeric,
  speed_km_h numeric,
  power numeric
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_start date;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  v_start := app.range_start(p_range, p_now);
  return query
  select l.performed_on,
         sum(l.distance)::numeric as distance_m,
         sum(l.time_seconds)::numeric as time_seconds,
         case when sum(l.distance) > 0 and sum(l.time_seconds) > 0
              then (sum(l.time_seconds) / (sum(l.distance) / 1000.0))::numeric end as pace_sec_per_km,
         case when sum(l.distance) > 0 and sum(l.time_seconds) > 0
              then (sum(l.time_seconds) * (500.0 / sum(l.distance)))::numeric end as split_sec_per_500m,
         case when sum(l.time_seconds) > 0 and sum(l.distance) > 0
              then ((sum(l.distance) / 1000.0) / (sum(l.time_seconds) / 3600.0))::numeric end as speed_km_h,
         max(l.power)::numeric as power
    from public.set_logs l
    join public.exercises e on e.id = l.exercise_id
   where l.user_id = v_uid
     and l.exercise_id = p_exercise
     and e.kind = 'cardio'
     and l.done
     and (v_start is null or l.performed_on >= v_start)
   group by l.performed_on
   order by l.performed_on;
end $$;
revoke all on function public.cardio_progress(uuid, text, date) from public, anon;
grant execute on function public.cardio_progress(uuid, text, date) to authenticated;

-- ------------------------------------------------------------------ weigh-ins (health data; ciphertext at rest)
create table public.weigh_ins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  recorded_on  date not null,
  weight_ct    bytea not null check (octet_length(weight_ct) between 1 and 4096),
  unit         text not null check (unit in ('lb','kg')),
  created_at   timestamptz not null default now(),
  unique (user_id, recorded_on)
);
create index weigh_ins_user_idx on public.weigh_ins (user_id, recorded_on);

alter table public.weigh_ins enable row level security;
alter table public.weigh_ins force row level security;
revoke all on table public.weigh_ins from public, anon, authenticated;
grant all on table public.weigh_ins to service_role;
grant select, delete on public.weigh_ins to authenticated;
grant insert (user_id, recorded_on, weight_ct, unit) on public.weigh_ins to authenticated;

create table public.body_weight_share (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  sharing    boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.body_weight_share enable row level security;
alter table public.body_weight_share force row level security;
revoke all on table public.body_weight_share from public, anon, authenticated;
grant all on table public.body_weight_share to service_role;
grant select, insert, delete on public.body_weight_share to authenticated;
grant update (sharing) on public.body_weight_share to authenticated;
create policy body_weight_share_own on public.body_weight_share for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function app.shares_body_weight(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.body_weight_share s
     where s.user_id = p_user and s.sharing)
$$;
revoke all on function app.shares_body_weight(uuid) from public, anon;
grant execute on function app.shares_body_weight(uuid) to authenticated;

-- Body-weight sharing: only an active 1:1 coach, and only if the athlete turned the toggle on.
-- Plan followers cannot turn it on. Off by default (no row).
create or replace function public.set_share_body_weight(p_on boolean)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if coalesce(p_on, false) and not exists (
       select 1 from public.coach_relationships cr
        where cr.client_id = v_uid and cr.status = 'active') then
    raise exception 'one_to_one_required' using errcode = '42501';
  end if;
  insert into public.body_weight_share (user_id, sharing, updated_at)
  values (v_uid, coalesce(p_on, false), now())
  on conflict (user_id) do update set sharing = excluded.sharing, updated_at = now();
end $$;
revoke all on function public.set_share_body_weight(boolean) from public, anon;
grant execute on function public.set_share_body_weight(boolean) to authenticated;

create or replace function private.weigh_ins_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not app.has_consent(new.user_id, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = new.user_id and p.deleted_at is null) then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger weigh_ins_guard before insert or update on public.weigh_ins
  for each row execute function private.weigh_ins_guard();

create policy weigh_ins_select_own on public.weigh_ins for select to authenticated
  using (user_id = (select auth.uid()) and app.has_consent(user_id, 'health_data'));
create policy weigh_ins_insert_own on public.weigh_ins for insert to authenticated
  with check (user_id = (select auth.uid()) and app.has_consent(user_id, 'health_data'));
create policy weigh_ins_delete_own on public.weigh_ins for delete to authenticated
  using (user_id = (select auth.uid()));
-- Coach may see ciphertext rows only with the specific share toggle and an active 1:1.
-- They cannot decrypt without the athlete's key; this only exposes metadata + ciphertext.
create policy weigh_ins_select_coach on public.weigh_ins for select to authenticated
  using (app.is_active_coach_of(user_id) and app.shares_body_weight(user_id));

-- ------------------------------------------------------------------ progress photo opt-in + per-photo share
alter table public.progress_photos
  add column if not exists captured_on date;

grant insert (user_id, storage_path, captured_on) on public.progress_photos to authenticated;
grant update (captured_on) on public.progress_photos to authenticated;

create table public.progress_photo_opt_ins (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  opted_in    boolean not null default false,
  opted_in_at timestamptz,
  revoked_at  timestamptz,
  updated_at  timestamptz not null default now(),
  check (opted_in = false or opted_in_at is not null),
  check (opted_in = true or revoked_at is not null or opted_in_at is null)
);
alter table public.progress_photo_opt_ins enable row level security;
alter table public.progress_photo_opt_ins force row level security;
revoke all on table public.progress_photo_opt_ins from public, anon, authenticated;
grant all on table public.progress_photo_opt_ins to service_role;
grant select on public.progress_photo_opt_ins to authenticated;
create policy progress_photo_opt_ins_select_own on public.progress_photo_opt_ins for select to authenticated
  using (user_id = (select auth.uid()));
-- No client insert/update: writes go through set_progress_photo_opt_in.

create or replace function app.has_progress_photo_opt_in(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.progress_photo_opt_ins o
     where o.user_id = p_user and o.opted_in)
$$;
revoke all on function app.has_progress_photo_opt_in(uuid) from public, anon;
grant execute on function app.has_progress_photo_opt_in(uuid) to authenticated;

create or replace function public.set_progress_photo_opt_in(p_on boolean)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if coalesce(p_on, false) then
    if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
      raise exception 'photo_upload_not_allowed' using errcode = '42501';
    end if;
    insert into public.progress_photo_opt_ins (user_id, opted_in, opted_in_at, revoked_at, updated_at)
    values (v_uid, true, now(), null, now())
    on conflict (user_id) do update
      set opted_in = true, opted_in_at = now(), revoked_at = null, updated_at = now();
  else
    insert into public.progress_photo_opt_ins (user_id, opted_in, opted_in_at, revoked_at, updated_at)
    values (v_uid, false, null, now(), now())
    on conflict (user_id) do update
      set opted_in = false, revoked_at = now(), updated_at = now();
  end if;
end $$;
revoke all on function public.set_progress_photo_opt_in(boolean) from public, anon;
grant execute on function public.set_progress_photo_opt_in(boolean) to authenticated;

-- Upload now also requires the first-use opt-in. Age + health_data rules are unchanged.
create or replace function app.can_upload_progress_photo(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = p_user and not p.is_minor and p.deleted_at is null)
     and app.has_consent(p_user, 'health_data')
     and app.has_progress_photo_opt_in(p_user)
$$;

create table public.progress_photo_shares (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid not null references public.progress_photos(id) on delete cascade,
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  shared_at  timestamptz not null default now(),
  revoked_at timestamptz,
  unique (photo_id, coach_id)
);
create index progress_photo_shares_coach_idx on public.progress_photo_shares (coach_id) where revoked_at is null;

alter table public.progress_photo_shares enable row level security;
alter table public.progress_photo_shares force row level security;
revoke all on table public.progress_photo_shares from public, anon, authenticated;
grant all on table public.progress_photo_shares to service_role;
grant select on public.progress_photo_shares to authenticated;
-- Writes go through share/revoke functions.

create or replace function app.coach_can_view_progress_photo(p_photo uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
      from public.progress_photo_shares s
      join public.progress_photos ph on ph.id = s.photo_id
     where s.photo_id = p_photo
       and s.coach_id = auth.uid()
       and s.revoked_at is null
       and app.is_active_coach_of(ph.user_id)
       and app.has_consent(ph.user_id, 'coach_sharing')
       and app.has_progress_photo_opt_in(ph.user_id)
       and not exists (select 1 from public.profiles p where p.id = ph.user_id and p.is_minor)
  )
$$;
revoke all on function app.coach_can_view_progress_photo(uuid) from public, anon;
grant execute on function app.coach_can_view_progress_photo(uuid) to authenticated;

create policy progress_photo_shares_select_owner on public.progress_photo_shares for select to authenticated
  using (exists (select 1 from public.progress_photos ph
                  where ph.id = photo_id and ph.user_id = (select auth.uid())));
create policy progress_photo_shares_select_coach on public.progress_photo_shares for select to authenticated
  using (coach_id = (select auth.uid()) and app.coach_can_view_progress_photo(photo_id));

-- Coaches may read metadata of photos shared with them (not the storage object).
drop policy if exists progress_photos_select_own on public.progress_photos;
create policy progress_photos_select_own on public.progress_photos for select to authenticated
  using (user_id = (select auth.uid()));
create policy progress_photos_select_shared_coach on public.progress_photos for select to authenticated
  using (app.coach_can_view_progress_photo(id));

create or replace function public.share_progress_photo(p_photo uuid, p_coach uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select user_id into v_owner from public.progress_photos where id = p_photo;
  if v_owner is null or v_owner <> v_uid then raise exception 'forbidden' using errcode = '42501'; end if;
  if not app.can_upload_progress_photo(v_uid) then
    raise exception 'photo_upload_not_allowed' using errcode = '42501';
  end if;
  if not app.has_consent(v_uid, 'coach_sharing') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  if not exists (
       select 1 from public.coach_relationships cr
        where cr.coach_id = p_coach and cr.client_id = v_uid and cr.status = 'active') then
    raise exception 'one_to_one_required' using errcode = '42501';
  end if;
  insert into public.progress_photo_shares (photo_id, coach_id, shared_at, revoked_at)
  values (p_photo, p_coach, now(), null)
  on conflict (photo_id, coach_id) do update
    set shared_at = now(), revoked_at = null;
end $$;

create or replace function public.revoke_progress_photo_share(p_photo uuid, p_coach uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not exists (select 1 from public.progress_photos ph where ph.id = p_photo and ph.user_id = v_uid) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.progress_photo_shares
     set revoked_at = now()
   where photo_id = p_photo and coach_id = p_coach and revoked_at is null;
end $$;
revoke all on function public.share_progress_photo(uuid, uuid), public.revoke_progress_photo_share(uuid, uuid) from public, anon;
grant execute on function public.share_progress_photo(uuid, uuid), public.revoke_progress_photo_share(uuid, uuid) to authenticated;

revoke all on function private.weigh_ins_guard() from public, anon, authenticated;
