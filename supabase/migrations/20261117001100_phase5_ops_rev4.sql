-- Phase 5 / ops + Counsel Rev 3 addendum + Rev 4 (Nov 16, 2026). Non-UI.
--  * Daily run_retention_purge via pg_cron (optional, same pattern as the hourly minor purge),
--    run log, health-check, and photo_purge_deadline_guaranteed tied to a confirmed running job.
--  * Weigh-ins: owner, or a coach only while share is on for that coach. Teens never share.
--    No metadata leaks; not in realtime publications; no push signals.
--  * Teen Health off: AI off (existing cascade), all live health info deleted now, backups
--    via health-key shred within 30 days, one kept notice if a parent caused it.
--  * Download my data: server package + short-lived lock-gated link, logged as a rights request.
--    Parent export stays behind app.parent_can_export_teen_data().

-- ================================================================== daily purge job + health check
create table if not exists private.retention_purge_runs (
  id          uuid primary key default gen_random_uuid(),
  started_at  timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  ok          boolean,
  result      jsonb,
  source      text not null default 'manual' check (source in ('manual','cron'))
);
alter table private.retention_purge_runs enable row level security;
alter table private.retention_purge_runs force row level security;
revoke all on table private.retention_purge_runs from public, anon, authenticated;
grant all on table private.retention_purge_runs to service_role;

create or replace function private.run_retention_purge_work()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r jsonb := '{}'::jsonb; n integer; v_user uuid;
begin
  r := r || jsonb_build_object('minor_flags_recomputed', public.recompute_minor_flags());
  r := r || jsonb_build_object('unprofiled_auth_users', public.purge_unprofiled_auth_users(interval '24 hours'));
  r := r || jsonb_build_object('pending_minors', public.purge_pending_minors());
  r := r || jsonb_build_object('parent_invites_expired', private.expire_parent_invites());

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

  n := 0;
  for v_user in
    select k.user_id from private.photo_data_keys k
     where k.shredded_at is null
       and k.shred_after is not null
       and k.shred_after <= now()
       and not private.on_litigation_hold(k.user_id)
  loop
    perform public.photo_shred(v_user); n := n + 1;
  end loop;
  r := r || jsonb_build_object('photo_shredded', n);

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
revoke all on function private.run_retention_purge_work() from public, anon, authenticated;

create or replace function private.finish_retention_purge_run(p_source text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id uuid;
  v_started timestamptz := clock_timestamp();
  r jsonb;
begin
  insert into private.retention_purge_runs (started_at, source) values (v_started, coalesce(p_source, 'manual'))
  returning id into v_id;
  begin
    r := private.run_retention_purge_work();
    update private.retention_purge_runs
       set finished_at = clock_timestamp(), ok = true, result = r
     where id = v_id;
    return r;
  exception when others then
    update private.retention_purge_runs
       set finished_at = clock_timestamp(), ok = false,
           result = jsonb_build_object('error', sqlerrm)
     where id = v_id;
    raise;
  end;
end $$;
revoke all on function private.finish_retention_purge_run(text) from public, anon, authenticated;

create or replace function public.run_retention_purge()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return private.finish_retention_purge_run('manual');
end $$;
revoke all on function public.run_retention_purge() from public, anon, authenticated;
grant execute on function public.run_retention_purge() to service_role;

-- Cron / operator wrapper: no client grant. Sets a service-role claim so nested checks pass.
create or replace function private.run_retention_purge_cron()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  perform set_config('request.jwt.claim.role', 'service_role', true);
  return private.finish_retention_purge_run('cron');
end $$;
revoke all on function private.run_retention_purge_cron() from public, anon, authenticated;

do $cron$
begin
  execute 'create extension if not exists pg_cron';
  perform cron.unschedule(j.jobid) from cron.job j where j.jobname = 'retention-purge-daily';
  perform cron.schedule('retention-purge-daily', '20 7 * * *', 'select private.run_retention_purge_cron()');
exception when others then
  raise notice 'pg_cron not available (%); schedule private.run_retention_purge_cron() daily in the operator job runner', sqlerrm;
end
$cron$;

create or replace function public.retention_purge_health()
returns table (
  last_success_at        timestamptz,
  last_run_at            timestamptz,
  last_run_ok            boolean,
  missed_run             boolean,
  overdue_photo_keys     integer,
  overdue_health_keys    integer,
  job_confirmed_running  boolean,
  healthy                boolean
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_success timestamptz;
  v_run_at timestamptz;
  v_ok boolean;
  v_missed boolean;
  v_photo integer;
  v_health integer;
  v_running boolean;
begin
  select r.finished_at, r.ok into v_run_at, v_ok
    from private.retention_purge_runs r
   order by r.started_at desc
   limit 1;
  select max(r.finished_at) into v_success
    from private.retention_purge_runs r
   where r.ok is true;
  v_missed := (v_success is null or v_success < now() - interval '25 hours');

  select count(*)::int into v_photo
    from private.photo_data_keys k
   where k.shredded_at is null
     and k.shred_after is not null
     and k.shred_after <= now()
     and not private.on_litigation_hold(k.user_id);

  select count(*)::int into v_health
    from private.user_data_keys k
   where not app.has_consent(k.user_id, 'health_data')
     and not private.on_litigation_hold(k.user_id)
     and exists (select 1 from public.consents c
                  where c.user_id = k.user_id and c.kind = 'health_data'
                    and c.revoked_at is not null and c.revoked_at <= now() - interval '29 days');

  v_running := (v_success is not null and v_success >= now() - interval '25 hours');
  last_success_at := v_success;
  last_run_at := v_run_at;
  last_run_ok := v_ok;
  missed_run := v_missed;
  overdue_photo_keys := v_photo;
  overdue_health_keys := v_health;
  job_confirmed_running := v_running;
  healthy := v_running and v_photo = 0 and v_health = 0;
  return next;
end $$;
revoke all on function public.retention_purge_health() from public, anon;
grant execute on function public.retention_purge_health() to authenticated, service_role;

-- Toast {date} only once the daily job is confirmed running and no photo shred is overdue.
create or replace function app.photo_purge_deadline_guaranteed()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.retention_policies
     where record_type = 'progress_photos' and status = 'enforced')
     and (select h.job_confirmed_running and h.overdue_photo_keys = 0
            from public.retention_purge_health() h)
$$;
revoke all on function app.photo_purge_deadline_guaranteed() from public, anon;
grant execute on function app.photo_purge_deadline_guaranteed() to authenticated;

-- ================================================================== weigh-ins: per-coach share, no metadata leaks
alter table public.body_weight_share
  add column if not exists coach_id uuid references public.profiles(id) on delete cascade;

update public.body_weight_share s
   set coach_id = cr.coach_id
  from public.coach_relationships cr
 where s.coach_id is null
   and cr.client_id = s.user_id and cr.status = 'active'
   and (select count(*) from public.coach_relationships x
         where x.client_id = s.user_id and x.status = 'active') = 1;

delete from public.body_weight_share where coach_id is null;
alter table public.body_weight_share alter column coach_id set not null;

do $$
begin
  if exists (
    select 1 from pg_constraint
     where conrelid = 'public.body_weight_share'::regclass and contype = 'p'
  ) then
    execute 'alter table public.body_weight_share drop constraint body_weight_share_pkey';
  end if;
end $$;
alter table public.body_weight_share add primary key (user_id, coach_id);
alter table public.body_weight_share drop constraint if exists body_weight_share_not_self;
alter table public.body_weight_share add constraint body_weight_share_not_self check (user_id <> coach_id);

create or replace function app.shares_body_weight_with(p_user uuid, p_coach uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p
                  where p.id = p_user and not p.is_minor and p.deleted_at is null)
     and exists (select 1 from public.body_weight_share s
                  where s.user_id = p_user and s.coach_id = p_coach and s.sharing)
     and exists (select 1 from public.coach_relationships cr
                  where cr.coach_id = p_coach and cr.client_id = p_user and cr.status = 'active')
$$;
revoke all on function app.shares_body_weight_with(uuid, uuid) from public, anon;
grant execute on function app.shares_body_weight_with(uuid, uuid) to authenticated;

create or replace function app.shares_body_weight(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p
                  where p.id = p_user and not p.is_minor and p.deleted_at is null)
     and exists (select 1 from public.body_weight_share s
                  where s.user_id = p_user and s.sharing)
$$;
revoke all on function app.shares_body_weight(uuid) from public, anon;
grant execute on function app.shares_body_weight(uuid) to authenticated;

create or replace function public.set_share_body_weight(p_on boolean)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_coach uuid;
  v_n integer;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
    raise exception 'teen_weight_history_not_allowed' using errcode = '42501';
  end if;
  select count(*) into v_n from public.coach_relationships cr
   where cr.client_id = v_uid and cr.status = 'active';
  if coalesce(p_on, false) and coalesce(v_n, 0) = 0 then
    raise exception 'one_to_one_required' using errcode = '42501';
  end if;
  if coalesce(v_n, 0) = 0 then
    update public.body_weight_share set sharing = false, updated_at = now() where user_id = v_uid;
    return;
  end if;
  if v_n > 1 and coalesce(p_on, false) then
    raise exception 'coach_required' using errcode = '22023';
  end if;
  select cr.coach_id into v_coach from public.coach_relationships cr
   where cr.client_id = v_uid and cr.status = 'active' limit 1;
  insert into public.body_weight_share (user_id, coach_id, sharing, updated_at)
  values (v_uid, v_coach, coalesce(p_on, false), now())
  on conflict (user_id, coach_id) do update set sharing = excluded.sharing, updated_at = now();
  if not coalesce(p_on, false) then
    update public.body_weight_share set sharing = false, updated_at = now()
     where user_id = v_uid and (v_coach is null or coach_id = v_coach);
  end if;
end $$;

create or replace function public.set_share_body_weight(p_coach uuid, p_on boolean)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
    raise exception 'teen_weight_history_not_allowed' using errcode = '42501';
  end if;
  if not exists (
       select 1 from public.coach_relationships cr
        where cr.client_id = v_uid and cr.coach_id = p_coach and cr.status = 'active') then
    raise exception 'one_to_one_required' using errcode = '42501';
  end if;
  insert into public.body_weight_share (user_id, coach_id, sharing, updated_at)
  values (v_uid, p_coach, coalesce(p_on, false), now())
  on conflict (user_id, coach_id) do update set sharing = excluded.sharing, updated_at = now();
end $$;
revoke all on function public.set_share_body_weight(boolean), public.set_share_body_weight(uuid, boolean)
  from public, anon;
grant execute on function public.set_share_body_weight(boolean), public.set_share_body_weight(uuid, boolean)
  to authenticated;

drop policy if exists weigh_ins_select_coach on public.weigh_ins;
create policy weigh_ins_select_coach on public.weigh_ins for select to authenticated
  using (app.shares_body_weight_with(user_id, (select auth.uid())));

-- Keep weigh_ins off realtime publications so turning share off also cuts any stream.
create or replace function app.weigh_ins_published_realtime()
returns boolean language sql stable set search_path = public, pg_temp as $$
  select exists (
    select 1 from pg_catalog.pg_publication_tables
     where schemaname = 'public' and tablename = 'weigh_ins')
$$;
revoke all on function app.weigh_ins_published_realtime() from public, anon;
grant execute on function app.weigh_ins_published_realtime() to authenticated;

create or replace function app.weigh_in_push_signals_enabled()
returns boolean language sql immutable as $$ select false $$;
revoke all on function app.weigh_in_push_signals_enabled() from public, anon;
grant execute on function app.weigh_in_push_signals_enabled() to authenticated;

do $rt$
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime drop table public.weigh_ins';
    exception when undefined_object then
      null;
    when others then
      if sqlerrm not ilike '%is not a member%' and sqlerrm not ilike '%does not exist%' then
        raise;
      end if;
    end;
  end if;
end
$rt$;

-- progress_weight_series is already owner-only (auth.uid()). No coach aggregate of weigh-ins exists.

-- ================================================================== Rev 4: teen Health off deletes all live health info
alter table public.teen_data_notices drop constraint if exists teen_data_notices_kind_check;
alter table public.teen_data_notices
  add constraint teen_data_notices_kind_check
  check (kind in ('weight_deleted_by_parent', 'health_deleted_by_parent', 'parent_exported_data'));

create or replace function private.notice_teen_health_deleted_by_parent(p_user uuid, p_actor uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_actor is null or p_actor is not distinct from p_user then
    return;
  end if;
  -- Once per withdrawal: no second notice until Health is granted again.
  if exists (
    select 1 from public.teen_data_notices n
     where n.user_id = p_user and n.kind = 'health_deleted_by_parent'
       and n.created_at >= coalesce(
         (select max(c.granted_at) from public.consents c
           where c.user_id = p_user and c.kind = 'health_data' and c.granted),
         '-infinity'::timestamptz)
  ) then
    return;
  end if;
  insert into public.teen_data_notices (user_id, kind, actor_user_id)
  values (p_user, 'health_deleted_by_parent', p_actor);
end $$;
revoke all on function private.notice_teen_health_deleted_by_parent(uuid, uuid) from public, anon, authenticated;

-- Delete all live saved health info immediately. Backups go with the health key within 30 days.
-- AI planning is turned off by write_consent (health off cascades to ai_vendor).
create or replace function private.clear_teen_health_data(p_user uuid, p_actor uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.profiles p where p.id = p_user and p.is_minor and p.deleted_at is null) then
    return false;
  end if;
  delete from public.weigh_ins where user_id = p_user;
  delete from public.health_screen_state where user_id = p_user;
  update public.health_records
     set injury_notes_ct = null,
         health_screen_ct = null,
         injury_category_ct = null,
         weight_goal_ct = null,
         body_weight_ct = null,
         updated_at = now()
   where user_id = p_user;
  perform private.notice_teen_health_deleted_by_parent(p_user, p_actor);
  perform private.log_audit(p_actor, 'teen_health_cleared', p_user, '{}'::jsonb);
  return true;
end $$;
revoke all on function private.clear_teen_health_data(uuid, uuid) from public, anon, authenticated;

-- Keep the narrower helper for explicit "Clear weight" (Health stays on).
create or replace function private.clear_teen_current_weight(p_user uuid, p_actor uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_had boolean := false;
begin
  if not exists (select 1 from public.profiles p where p.id = p_user and p.is_minor and p.deleted_at is null) then
    return false;
  end if;
  select body_weight_ct is not null into v_had from public.health_records where user_id = p_user;
  if not coalesce(v_had, false) then
    return false;
  end if;
  update public.health_records set body_weight_ct = null, updated_at = now() where user_id = p_user;
  perform private.log_audit(p_actor, 'teen_weight_cleared', p_user, '{}'::jsonb);
  return true;
end $$;

drop trigger if exists consents_teen_weight_clear on public.consents;
drop function if exists private.teen_weight_after_consent();

create or replace function private.teen_health_after_consent()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- Only on a withdrawal of this row. A parent (or teen) grant while the other
  -- grantor is still off must not re-clear data or send a second notice.
  if new.kind = 'health_data'
     and not new.granted
     and (tg_op = 'INSERT' or old.granted)
     and not app.has_consent(new.user_id, 'health_data') then
    perform private.clear_teen_health_data(new.user_id, coalesce(auth.uid(), new.actor_user_id, new.user_id));
  end if;
  return new;
end $$;
create trigger consents_teen_health_clear after insert or update on public.consents
  for each row execute function private.teen_health_after_consent();
revoke all on function private.teen_health_after_consent() from public, anon, authenticated;

-- ================================================================== Rev 4: Download my data
alter table public.data_export_requests
  add column if not exists token_hash text,
  add column if not exists expires_at timestamptz,
  add column if not exists lock_verified_at timestamptz,
  add column if not exists requested_for uuid,
  add column if not exists actor_user_id uuid;

create table if not exists private.data_export_packages (
  request_id  uuid primary key references public.data_export_requests(id) on delete cascade,
  package     jsonb not null,
  created_at  timestamptz not null default now()
);
alter table private.data_export_packages enable row level security;
alter table private.data_export_packages force row level security;
revoke all on table private.data_export_packages from public, anon, authenticated;
grant all on table private.data_export_packages to service_role;

create or replace function private.data_export_excluded_ok(p jsonb)
returns boolean language sql immutable as $$
  select p ? 'included'
     and not (p->'included') ? 'ip_hash'
     and not (p->'included') ? 'device_hash'
     and not (p->'included') ? 'pepper'
     and not (p->'included') ? 'keys'
     and not (p->'included') ? 'wrapped_keys'
     and not (p->'included') ? 'ai_prompts'
     and not (p->'included') ? 'security_logs'
     and not (p->'included') ? 'safety_records'
     and not (p->'included') ? 'ncmec'
     and not (p->'included'->'account_and_settings') ? 'birth_date'
     and not ((p->'included')::text ilike '%ip_hash%')
     and not ((p->'included')::text ilike '%device_hash%')
     and not ((p->'included')::text ilike '%wrapped_key%')
     and not ((p->'included')::text ilike '%meta_pepper%')
     and not ((p->'included')::text ilike '%encryption_keys%')
$$;

create or replace function private.build_data_export_package(p_user uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_minor boolean;
  v_pkg jsonb;
  v_account jsonb;
  v_health jsonb;
  v_consents jsonb;
begin
  select is_minor into v_minor from public.profiles where id = p_user and deleted_at is null;
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;

  select jsonb_build_object(
           'email', u.email,
           'name', p.display_name,
           'age_range', case when p.is_minor then '16-17' else '18+' end,
           'turns_18_on', p.adult_on,
           'units', jsonb_build_object(
              'mass', s.mass_unit, 'distance', s.distance_unit,
              'e1rm_formula', s.e1rm_formula, 'e1rm_rep_cap', s.e1rm_rep_cap),
           'linked_parent', exists (
              select 1 from public.parent_links l
               where l.minor_user_id = p.id and l.status = 'active' and l.is_contracting_party)
         )
    into v_account
    from public.profiles p
    left join auth.users u on u.id = p.id
    left join lateral app.progress_settings_for(p.id) s on true
   where p.id = p_user;

  select jsonb_build_object(
           'has_injury_notes', h.injury_notes_ct is not null,
           'has_health_screen', h.health_screen_ct is not null,
           'has_injury_category', h.injury_category_ct is not null,
           'has_weight_goal', h.weight_goal_ct is not null,
           'has_body_weight', h.body_weight_ct is not null,
           'health_screen', (select jsonb_build_object(
              'completed_at', st.completed_at, 'any_yes', st.any_yes,
              'clearance_at', st.clearance_at, 'clearance_version', st.clearance_version)
              from public.health_screen_state st where st.user_id = p_user),
           'weigh_in_days', (select coalesce(jsonb_agg(w.recorded_on order by w.recorded_on), '[]'::jsonb)
                               from public.weigh_ins w where w.user_id = p_user)
         )
    into v_health
    from public.health_records h
   where h.user_id = p_user;
  if v_health is null then
    v_health := jsonb_build_object('has_injury_notes', false, 'has_health_screen', false,
                                   'has_injury_category', false, 'has_weight_goal', false,
                                   'has_body_weight', false, 'health_screen', null,
                                   'weigh_in_days', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'kind', e.kind,
           'grantor', e.grantor,
           'granted', e.granted,
           'at', e.at,
           'policy_version', e.policy_version,
           'text_hash', e.text_hash,
           'exact_text', lv.full_text
         ) order by e.at), '[]'::jsonb)
    into v_consents
    from public.consent_events e
    left join public.legal_text_versions lv
      on lv.kind = e.kind and (lv.version = e.policy_version or lv.sha256 = e.text_hash)
   where e.user_id = p_user;

  v_pkg := jsonb_build_object(
    'format', 'zip',
    'contents', 'json_csv_plus_photos',
    'note', 'A downloaded copy isn''t locked or encrypted, and we can''t delete it. Keep it somewhere safe. Some records, like crash reports, are kept by our service providers. Ask us through Your privacy rights.',
    'included', jsonb_build_object(
      'account_and_settings', v_account,
      'training_setup', (select coalesce(to_jsonb(t) - 'user_id', 'null'::jsonb)
                           from public.training_setups t where t.user_id = p_user),
      'workouts_sets_prs', jsonb_build_object(
        'sets', (select coalesce(jsonb_agg(jsonb_build_object(
                   'exercise_id', sl.exercise_id, 'performed_on', sl.performed_on,
                   'set_index', sl.set_index, 'weight', sl.weight, 'reps', sl.reps,
                   'time_seconds', sl.time_seconds, 'distance', sl.distance,
                   'power', sl.power, 'done', sl.done, 'exclude_from_prs', sl.exclude_from_prs)
                   order by sl.performed_on, sl.set_index), '[]'::jsonb)
                   from public.set_logs sl where sl.user_id = p_user)
      ),
      'ai_plans', jsonb_build_object(
        'session', (select to_jsonb(s) - 'user_id' from public.ai_plan_sessions s where s.user_id = p_user)
      ),
      'health_info', v_health,
      'connected_health_apps', '[]'::jsonb,
      'progress_photos', case when v_minor then '[]'::jsonb else (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'file_name', coalesce(ph.captured_on::text || '-photo.jpg', ph.id::text || '.jpg'),
                 'captured_on', ph.captured_on,
                 'metadata_stripped', true)
                 order by ph.captured_on), '[]'::jsonb)
          from public.progress_photos ph
         where ph.user_id = p_user and ph.pending_delete_at is null
      ) end,
      'coach_messages', '[]'::jsonb,
      'privacy_choices', v_consents,
      'who_received_data', jsonb_build_object(
        'coaches', (select coalesce(jsonb_agg(jsonb_build_object(
                      'relationship_status', cr.status, 'started_at', cr.started_at)
                      order by cr.started_at), '[]'::jsonb)
                      from public.coach_relationships cr where cr.client_id = p_user),
        'photo_recipients', case when v_minor then '[]'::jsonb else (
          select coalesce(jsonb_agg(jsonb_build_object('shared_at', s.shared_at)
                           order by s.shared_at), '[]'::jsonb)
            from public.progress_photo_shares s
            join public.progress_photos ph on ph.id = s.photo_id
           where ph.user_id = p_user
        ) end
      ),
      'purchases', (select coalesce(jsonb_agg(to_jsonb(pu) - 'user_id'), '[]'::jsonb)
                      from public.purchases pu where pu.user_id = p_user),
      'requests', jsonb_build_object(
        'data_export', (select coalesce(jsonb_agg(jsonb_build_object(
                          'id', d.id, 'status', d.status, 'requested_at', d.requested_at)
                          order by d.requested_at), '[]'::jsonb)
                          from public.data_export_requests d where d.user_id = p_user),
        'account_deletion', (select coalesce(jsonb_agg(jsonb_build_object(
                               'id', d.id, 'status', d.status, 'requested_at', d.requested_at)
                               order by d.requested_at), '[]'::jsonb)
                               from public.account_deletion_requests d where d.user_id = p_user)
      )
    ),
    'excluded', jsonb_build_array(
      'ip_and_device_hashes',
      'pepper',
      'encryption_keys',
      'other_people''s_data',
      'safety_moderation_ncmec',
      'security_and_rate_limit_logs',
      'ai_system_prompts',
      'vendor_held_crash_and_analytics'
    )
  );
  if not private.data_export_excluded_ok(v_pkg) then
    raise exception 'export_excluded_leak' using errcode = '42501';
  end if;
  return v_pkg;
end $$;
revoke all on function private.build_data_export_package(uuid), private.data_export_excluded_ok(jsonb)
  from public, anon, authenticated;

create or replace function public.prepare_data_export(p_lock_passed boolean, p_for_user uuid default null)
returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_actor uuid := auth.uid();
  v_subject uuid;
  v_id uuid;
  v_token text;
  v_hash text;
  v_exp timestamptz := now() + interval '15 minutes';
  v_pkg jsonb;
begin
  if v_actor is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  v_subject := coalesce(p_for_user, v_actor);
  if v_subject <> v_actor then
    if not app.parent_can_export_teen_data() then
      raise exception 'parent_export_not_allowed' using errcode = '42501';
    end if;
    if not app.is_active_parent_of(v_subject) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
  end if;
  if coalesce(p_lock_passed, false) is not true then
    raise exception 'lock_required' using errcode = '42501';
  end if;

  insert into public.data_export_requests (user_id, requested_for, actor_user_id, status, requested_at)
  values (v_subject, v_subject, v_actor, 'pending', now())
  on conflict (user_id) where status = 'pending'
  do update set requested_at = public.data_export_requests.requested_at,
                requested_for = excluded.requested_for,
                actor_user_id = excluded.actor_user_id
  returning id into v_id;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(convert_to(v_token, 'utf8'), 'sha256'), 'hex');
  v_pkg := private.build_data_export_package(v_subject);

  update public.data_export_requests
     set token_hash = v_hash,
         expires_at = v_exp,
         lock_verified_at = now(),
         requested_for = v_subject,
         actor_user_id = v_actor,
         status = 'processing'
   where id = v_id;
  insert into private.data_export_packages (request_id, package)
  values (v_id, v_pkg)
  on conflict (request_id) do update set package = excluded.package, created_at = now();

  perform private.log_audit(v_actor, 'data_export_requested', v_subject,
                            jsonb_build_object('request_id', v_id, 'rights_request', true));

  if v_subject is distinct from v_actor then
    insert into public.teen_data_notices (user_id, kind, actor_user_id)
    values (v_subject, 'parent_exported_data', v_actor);
  end if;

  return jsonb_build_object(
    'request_id', v_id,
    'token', v_token,
    'expires_at', v_exp,
    'delivery', 'short_lived_in_app_link',
    'manifest', v_pkg->'included'
  );
end $$;

-- Token is shown once; the package is returned only while the link is unexpired.
create or replace function public.fetch_data_export(p_token text)
returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_actor uuid := auth.uid();
  v_hash text;
  v_req public.data_export_requests%rowtype;
  v_pkg jsonb;
begin
  if v_actor is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_token is null or length(p_token) < 16 then
    raise exception 'not_found' using errcode = '42501';
  end if;
  v_hash := encode(extensions.digest(convert_to(p_token, 'utf8'), 'sha256'), 'hex');
  select * into v_req from public.data_export_requests
   where token_hash = v_hash
     and (actor_user_id = v_actor or user_id = v_actor)
   order by requested_at desc
   limit 1;
  if not found then raise exception 'not_found' using errcode = '42501'; end if;
  if v_req.expires_at is null or v_req.expires_at <= now() then
    raise exception 'link_expired' using errcode = '42501';
  end if;
  select p.package into v_pkg from private.data_export_packages p where p.request_id = v_req.id;
  if v_pkg is null then raise exception 'not_found' using errcode = '42501'; end if;
  update public.data_export_requests
     set status = 'completed', completed_at = coalesce(completed_at, now())
   where id = v_req.id and status <> 'completed';
  return v_pkg;
end $$;

revoke all on function public.prepare_data_export(boolean, uuid), public.fetch_data_export(text)
  from public, anon;
grant execute on function public.prepare_data_export(boolean, uuid), public.fetch_data_export(text)
  to authenticated;

-- Parent export uses the same packer and stays behind the Kevin flag.
create or replace function public.parent_export_teen_data(p_teen uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v jsonb;
  v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not app.parent_can_export_teen_data() then
    raise exception 'parent_export_not_allowed' using errcode = '42501';
  end if;
  if not app.is_active_parent_of(p_teen) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  -- Lock must be re-checked by the client; this entry point records the request
  -- and notice. The signed link is issued by prepare_data_export after the lock.
  v := public.prepare_data_export(true, p_teen);
  v_id := (v ->> 'request_id')::uuid;
  return v_id;
end $$;
