-- Manual and wearable (Apple Health / Garmin) weigh-ins share one consent gate.
-- If either teen health opt-in is off, app.has_consent('health_data') is false and
-- the write is rejected at the database, not only in the UI.

alter table public.weigh_ins
  add column if not exists source text not null default 'manual';

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'weigh_ins_source_check'
       and conrelid = 'public.weigh_ins'::regclass
  ) then
    alter table public.weigh_ins
      add constraint weigh_ins_source_check
      check (source in ('manual', 'apple_health', 'garmin'));
  end if;
end $$;

create or replace function public.ingest_synced_weight(
  p_source text, p_recorded_on date, p_weight_ct bytea, p_unit text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_source is null or p_source not in ('apple_health', 'garmin') then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  if p_recorded_on is null then raise exception 'invalid_argument' using errcode = '22023'; end if;
  if p_unit is null or p_unit not in ('lb', 'kg') then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  if p_weight_ct is null or octet_length(p_weight_ct) not between 1 and 4096 then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  -- Both teen and parent health opt-ins are required (and the adult's own grant).
  if not app.has_consent(v_uid, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  insert into public.weigh_ins (user_id, recorded_on, weight_ct, unit, source)
  values (v_uid, p_recorded_on, p_weight_ct, p_unit, p_source)
  on conflict (user_id, recorded_on) do update
    set weight_ct = excluded.weight_ct,
        unit = excluded.unit,
        source = excluded.source;
end $$;

revoke all on function public.ingest_synced_weight(text, date, bytea, text) from public, anon;
grant execute on function public.ingest_synced_weight(text, date, bytea, text) to authenticated, service_role;
