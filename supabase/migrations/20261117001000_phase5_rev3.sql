-- Phase 5 / Counsel Rev 3 (Nov 16, 2026). Non-UI enforcement.
--  * Photo export is a client ZIP (format rules live in src/progress/photoExport.ts).
--    offer_progress_photo_export stays the hook; nothing is auto-deleted after it runs.
--  * Purge {date} may be shown only when the daily job is guaranteed to shred due keys
--    by the 30-day deadline (app.photo_purge_deadline_guaranteed).
--  * Teen current weight: one overwritten value. If either health opt-in turns off,
--    the live value is deleted immediately; backups go with the health key within 30 days.
--    The teen is notified when a parent caused the deletion. Turning Health back on
--    starts empty.
--  * Parent export of teen data is a Kevin flag (default on, Counsel recommended) and
--    notifies the teen.

-- ------------------------------------------------------------------ purge-date guarantee (photos)
-- True when the retention policy is enforced and run_retention_purge shreds due photo keys.
-- Client toasts include {date} only when this is true (and a test proves the deadline).
create or replace function app.photo_purge_deadline_guaranteed()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.retention_policies
     where record_type = 'progress_photos' and status = 'enforced')
$$;
revoke all on function app.photo_purge_deadline_guaranteed() from public, anon;
grant execute on function app.photo_purge_deadline_guaranteed() to authenticated;

-- Export must never itself delete photos or schedule a shred.
create or replace function app.photo_export_auto_deletes()
returns boolean language sql immutable as $$ select false $$;
revoke all on function app.photo_export_auto_deletes() from public, anon;
grant execute on function app.photo_export_auto_deletes() to authenticated;

-- ------------------------------------------------------------------ teen notices + current-weight clear
create table public.teen_data_notices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  kind          text not null check (kind in ('weight_deleted_by_parent', 'parent_exported_data')),
  actor_user_id uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  read_at       timestamptz
);
alter table public.teen_data_notices enable row level security;
alter table public.teen_data_notices force row level security;
revoke all on table public.teen_data_notices from public, anon, authenticated;
grant all on table public.teen_data_notices to service_role;
grant select, update (read_at) on public.teen_data_notices to authenticated;
create policy teen_data_notices_select_own on public.teen_data_notices
  for select to authenticated using (user_id = (select auth.uid()));
create policy teen_data_notices_update_own on public.teen_data_notices
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Clear the live current-weight ciphertext immediately. Backups of that ciphertext
-- go away when the health key is shredded (withdrawal path, within 30 days).
create or replace function private.clear_teen_current_weight(p_user uuid, p_actor uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_had boolean := false;
begin
  if not exists (select 1 from public.profiles p where p.id = p_user and p.is_minor and p.deleted_at is null) then
    return false;
  end if;
  select body_weight_ct is not null into v_had
    from public.health_records where user_id = p_user;
  if not coalesce(v_had, false) then
    return false;
  end if;
  update public.health_records
     set body_weight_ct = null, updated_at = now()
   where user_id = p_user;
  -- Tell the teen when a parent (not the teen themselves) caused the deletion.
  if p_actor is not null and p_actor is distinct from p_user then
    insert into public.teen_data_notices (user_id, kind, actor_user_id)
    values (p_user, 'weight_deleted_by_parent', p_actor);
  end if;
  perform private.log_audit(p_actor, 'teen_weight_cleared', p_user, '{}'::jsonb);
  return true;
end $$;
revoke all on function private.clear_teen_current_weight(uuid, uuid) from public, anon, authenticated;

create or replace function private.teen_weight_after_consent()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.kind = 'health_data' and not app.has_consent(new.user_id, 'health_data') then
    perform private.clear_teen_current_weight(new.user_id, coalesce(new.actor_user_id, new.user_id));
  end if;
  return new;
end $$;
drop trigger if exists consents_teen_weight_clear on public.consents;
create trigger consents_teen_weight_clear after insert or update on public.consents
  for each row execute function private.teen_weight_after_consent();
revoke all on function private.teen_weight_after_consent() from public, anon, authenticated;

-- Explicit Clear weight (teen or their parent). Live value goes now; the 30-day
-- backup date is only claimed when Health itself is withdrawn (health-key shred).
create or replace function public.clear_teen_current_weight(p_teen uuid default null)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_teen uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  v_teen := coalesce(p_teen, v_uid);
  if v_teen <> v_uid and not app.is_active_parent_of(v_teen) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_teen and p.is_minor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform private.clear_teen_current_weight(v_teen, v_uid);
end $$;
revoke all on function public.clear_teen_current_weight(uuid) from public, anon;
grant execute on function public.clear_teen_current_weight(uuid) to authenticated;

-- ------------------------------------------------------------------ parent export of teen data (Kevin flag, default on)
create or replace function app.parent_can_export_teen_data()
returns boolean language sql immutable as $$ select true $$;
revoke all on function app.parent_can_export_teen_data() from public, anon;
grant execute on function app.parent_can_export_teen_data() to authenticated;

create table public.teen_data_export_requests (
  id           uuid primary key default gen_random_uuid(),
  teen_id      uuid not null references public.profiles(id) on delete cascade,
  parent_id    uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','processing','completed','rejected')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.teen_data_export_requests enable row level security;
alter table public.teen_data_export_requests force row level security;
revoke all on table public.teen_data_export_requests from public, anon, authenticated;
grant all on table public.teen_data_export_requests to service_role;
grant select on public.teen_data_export_requests to authenticated;
create policy teen_data_export_select_parent_or_teen on public.teen_data_export_requests
  for select to authenticated
  using (parent_id = (select auth.uid()) or teen_id = (select auth.uid()));

create or replace function public.parent_export_teen_data(p_teen uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not app.parent_can_export_teen_data() then
    raise exception 'parent_export_not_allowed' using errcode = '42501';
  end if;
  if not app.is_active_parent_of(p_teen) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_teen and p.is_minor and p.deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.teen_data_export_requests (teen_id, parent_id, status, requested_at)
  values (p_teen, v_uid, 'pending', now())
  returning id into v_id;
  insert into public.teen_data_notices (user_id, kind, actor_user_id)
  values (p_teen, 'parent_exported_data', v_uid);
  perform private.log_audit(v_uid, 'parent_exported_teen_data', p_teen, jsonb_build_object('request_id', v_id));
  return v_id;
end $$;
revoke all on function public.parent_export_teen_data(uuid) from public, anon;
grant execute on function public.parent_export_teen_data(uuid) to authenticated;
