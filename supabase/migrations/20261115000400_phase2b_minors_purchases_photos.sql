-- Phase 2b / pending minors (Q5), purchases (C5), progress photos (decided: blocked for 16-17).

-- ------------------------------------------------------------------ pending 16-17 accounts (Q5)
-- A "pending" minor is a 16-17 account that has NEVER had a parent link accepted. Remind on days 3
-- and 7; delete the account (auth user, profile and everything that cascades) on day 14.
create table private.pending_minor_reminders (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  reminder_day smallint not null check (reminder_day in (3, 7)),
  claimed_at   timestamptz not null default now(),
  primary key (user_id, reminder_day)
);
alter table private.pending_minor_reminders enable row level security;
alter table private.pending_minor_reminders force row level security;
revoke all on table private.pending_minor_reminders from public, anon, authenticated;

create or replace function app.is_pending_minor(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p
    where p.id = p_user and p.is_minor
      and not exists (select 1 from public.parent_links l where l.minor_user_id = p.id and l.accepted_at is not null))
$$;

-- Service only. Returns each pending minor due a day-3 or day-7 reminder exactly once. The sender
-- (server function, not built yet) uses it; the reminder goes to the minor's own account email.
create or replace function public.claim_pending_minor_reminders()
returns table (user_id uuid, reminder_day smallint)
language plpgsql security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
begin
  perform private.require_service();
  return query
  with due as (
    select p.id, d.day::smallint as day
      from public.profiles p cross join (values (3), (7)) d(day)
     where app.is_pending_minor(p.id) and p.created_at <= now() - make_interval(days => d.day)
       and p.created_at > now() - interval '14 days'
  ), ins as (
    insert into private.pending_minor_reminders (user_id, reminder_day)
    select id, day from due
    on conflict do nothing
    returning pending_minor_reminders.user_id, pending_minor_reminders.reminder_day
  )
  select ins.user_id, ins.reminder_day from ins;
end $$;

-- Service/admin only (daily job). Day 14: delete pending minors entirely. Users under a litigation
-- hold are skipped. Audit keeps only the count, no ids.
create or replace function public.purge_pending_minors()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer; v_ids uuid[];
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select coalesce(array_agg(p.id), '{}') into v_ids from public.profiles p
   where app.is_pending_minor(p.id) and p.created_at <= now() - interval '14 days'
     and not private.on_litigation_hold(p.id);
  delete from auth.users where id = any(v_ids);         -- cascades to profiles and everything below it
  delete from public.profiles where id = any(v_ids);     -- in case an auth row was already gone
  n := coalesce(array_length(v_ids, 1), 0);
  if n > 0 then perform private.log_audit(auth.uid(), 'pending_minors_purged', null, jsonb_build_object('count', n)); end if;
  return n;
end $$;

-- ------------------------------------------------------------------ litigation holds (used by every purge)
create table private.litigation_holds (
  user_id     uuid primary key,       -- no FK: holds outlive accounts
  reason_code text not null check (length(reason_code) between 1 and 64),
  placed_at   timestamptz not null default now(),
  placed_by   uuid,
  released_at timestamptz
);
alter table private.litigation_holds enable row level security;
alter table private.litigation_holds force row level security;
revoke all on table private.litigation_holds from public, anon, authenticated;

create or replace function private.on_litigation_hold(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from private.litigation_holds h where h.user_id = p_user and h.released_at is null)
$$;

create or replace function public.set_litigation_hold(p_user uuid, p_on boolean, p_reason_code text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_on then
    insert into private.litigation_holds (user_id, reason_code, placed_by) values (p_user, coalesce(p_reason_code, 'unspecified'), auth.uid())
    on conflict (user_id) do update set released_at = null, reason_code = excluded.reason_code, placed_at = now(), placed_by = auth.uid();
  else
    update private.litigation_holds set released_at = now() where user_id = p_user and released_at is null;
  end if;
  perform private.log_audit(auth.uid(), case when p_on then 'litigation_hold_placed' else 'litigation_hold_released' end, p_user, '{}'::jsonb);
end $$;

-- ------------------------------------------------------------------ purchases (C5)
-- Unlinked minors cannot buy anything. Adults: yes. 16-17: only with an active contracting parent.
create or replace function app.can_purchase(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select app.is_minor_onboarded(p_user)
$$;

create table public.purchases (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  product_id       text not null check (length(product_id) between 1 and 128),
  store            text not null check (store in ('apple','google','stripe')),
  store_txn_ref    text not null check (length(store_txn_ref) between 1 and 255),  -- transaction id only, no receipt payload
  approved_by      uuid,          -- the parent/guardian for a minor's purchase
  created_at       timestamptz not null default now(),
  unique (store, store_txn_ref)
);
create or replace function private.purchases_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not app.can_purchase(new.user_id) then raise exception 'purchase_not_allowed' using errcode = '42501'; end if;
  if exists (select 1 from public.profiles where id = new.user_id and is_minor)
     and not exists (select 1 from public.parent_links l where l.minor_user_id = new.user_id and l.parent_user_id = new.approved_by
                       and l.status = 'active' and l.is_contracting_party) then
    raise exception 'parent_approval_required' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger purchases_guard before insert or update on public.purchases
  for each row execute function private.purchases_guard();

alter table public.purchases enable row level security;
alter table public.purchases force row level security;
revoke all on table public.purchases from public, anon, authenticated;
grant all on table public.purchases to service_role;
grant select on public.purchases to authenticated;
create policy purchases_select_own on public.purchases for select to authenticated
  using (user_id = (select auth.uid()) or app.is_active_parent_of(user_id));
-- No client insert/update/delete: purchases are recorded by the receipt-validating server (service_role).

create or replace function public.can_purchase()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and app.can_purchase(auth.uid())
$$;

-- ------------------------------------------------------------------ progress photos (decided: blocked for 16-17)
create or replace function app.can_upload_progress_photo(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = p_user and not p.is_minor and p.deleted_at is null)
     and app.has_consent(p_user, 'health_data')
$$;

create table public.progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null check (length(storage_path) between 1 and 512),
  created_at   timestamptz not null default now()
);
create or replace function private.progress_photos_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not app.can_upload_progress_photo(new.user_id) then raise exception 'photo_upload_not_allowed' using errcode = '42501'; end if;
  return new;
end $$;
create trigger progress_photos_guard before insert or update on public.progress_photos
  for each row execute function private.progress_photos_guard();

alter table public.progress_photos enable row level security;
alter table public.progress_photos force row level security;
revoke all on table public.progress_photos from public, anon, authenticated;
grant all on table public.progress_photos to service_role;
grant select, delete on public.progress_photos to authenticated;
grant insert (user_id, storage_path) on public.progress_photos to authenticated;
create policy progress_photos_select_own on public.progress_photos for select to authenticated
  using (user_id = (select auth.uid()));
create policy progress_photos_insert_own on public.progress_photos for insert to authenticated
  with check (user_id = (select auth.uid()) and app.can_upload_progress_photo(user_id)
              and storage_path like (select auth.uid())::text || '/%');
create policy progress_photos_delete_own on public.progress_photos for delete to authenticated
  using (user_id = (select auth.uid()));

-- Supabase Storage: private bucket, uploads only into "<own uid>/..." and only when allowed.
do $$ begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public) values ('progress-photos', 'progress-photos', false)
    on conflict (id) do update set public = false;
    drop policy if exists progress_photos_obj_insert on storage.objects;
    drop policy if exists progress_photos_obj_select on storage.objects;
    drop policy if exists progress_photos_obj_delete on storage.objects;
    create policy progress_photos_obj_insert on storage.objects for insert to authenticated
      with check (bucket_id = 'progress-photos'
                  and (storage.foldername(name))[1] = (select auth.uid())::text
                  and app.can_upload_progress_photo((select auth.uid())));
    create policy progress_photos_obj_select on storage.objects for select to authenticated
      using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
    create policy progress_photos_obj_delete on storage.objects for delete to authenticated
      using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
    -- No UPDATE policy: an object cannot be overwritten in place.
  end if;
end $$;

-- ------------------------------------------------------------------ grants
revoke all on function public.claim_pending_minor_reminders(), public.purge_pending_minors(),
  public.set_litigation_hold(uuid, boolean, text), public.can_purchase() from public, anon, authenticated;
grant execute on function public.can_purchase() to authenticated;
grant execute on function public.claim_pending_minor_reminders(), public.purge_pending_minors(),
  public.set_litigation_hold(uuid, boolean, text), public.can_purchase() to service_role;
revoke all on function app.is_pending_minor(uuid), app.can_purchase(uuid), app.can_upload_progress_photo(uuid) from public, anon;
grant execute on function app.is_pending_minor(uuid), app.can_purchase(uuid), app.can_upload_progress_photo(uuid) to authenticated;
revoke all on function private.on_litigation_hold(uuid), private.purchases_guard(), private.progress_photos_guard() from public, anon, authenticated;
