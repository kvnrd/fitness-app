-- Kevin's Phase 5 decisions:
--   * parent export of teen data is off (RPCs refuse the path);
--   * set_logs.weight is canonical pounds; set_logs.distance is canonical miles.
-- Display units stay on progress_settings (default lb / mi).
-- No production set_logs existed when this landed, so distance is not converted.

comment on column public.set_logs.weight is 'Canonical pounds.';
comment on column public.set_logs.distance is 'Canonical miles.';

create or replace function app.parent_can_export_teen_data()
returns boolean language sql immutable as $$ select false $$;

-- Cardio chart points. set_logs.distance is miles; time is seconds.
-- Row splits stay seconds per 500 m (distance is converted to metres only for that math).
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
  with sessions as (
    select l.performed_on,
           (sum(l.distance) * 1609.344)::numeric as distance_m,
           sum(l.time_seconds)::numeric as time_seconds,
           max(l.power)::numeric as power
      from public.set_logs l
      join public.exercises e on e.id = l.exercise_id
     where l.user_id = v_uid
       and l.exercise_id = p_exercise
       and e.kind = 'cardio'
       and l.done
       and (v_start is null or l.performed_on >= v_start)
     group by l.performed_on
  )
  select s.performed_on,
         s.distance_m,
         s.time_seconds,
         case when s.distance_m > 0 and s.time_seconds > 0
              then (s.time_seconds / (s.distance_m / 1000.0))::numeric end as pace_sec_per_km,
         case when s.distance_m > 0 and s.time_seconds > 0
              then (s.time_seconds * (500.0 / s.distance_m))::numeric end as split_sec_per_500m,
         case when s.time_seconds > 0 and s.distance_m > 0
              then ((s.distance_m / 1000.0) / (s.time_seconds / 3600.0))::numeric end as speed_km_h,
         s.power
    from sessions s
   order by s.performed_on;
end $$;
revoke all on function public.cardio_progress(uuid, text, date) from public, anon;
grant execute on function public.cardio_progress(uuid, text, date) to authenticated;
