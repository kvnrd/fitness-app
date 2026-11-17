-- Phase 5 / Counsel review (Nov 16, 2026). Non-UI enforcement.
--  * Teens: no photos or video; no Progress/Home weight history; Profile current weight only
--    (both health opt-ins, no target); no Lose/Gain/size goals (already in training_setups).
--  * Photo consent logs: Continue records on/off with version+hash; Not now records dismissed;
--    no automatic re-prompts.
--  * Deletion: per-user photo key, shredded within 30 days; export offer required before turn-off.
--  * Coach photo sharing: approved 18+ 1:1 only, per photo, watermarked, no downloads,
--    hash-matching hook on shared copies, separate key so revoke shreds access immediately.

-- ------------------------------------------------------------------ teen weight: no history / trend / sparkline
create or replace function private.weigh_ins_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.profiles p where p.id = new.user_id and p.is_minor) then
    raise exception 'teen_weight_history_not_allowed' using errcode = '42501';
  end if;
  if not app.has_consent(new.user_id, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = new.user_id and p.deleted_at is null) then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  return new;
end $$;

create or replace function public.set_share_body_weight(p_on boolean)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
    raise exception 'teen_weight_history_not_allowed' using errcode = '42501';
  end if;
  if coalesce(p_on, false) and not exists (
       select 1 from public.coach_relationships cr
        where cr.client_id = v_uid and cr.status = 'active') then
    raise exception 'one_to_one_required' using errcode = '42501';
  end if;
  insert into public.body_weight_share (user_id, sharing, updated_at)
  values (v_uid, coalesce(p_on, false), now())
  on conflict (user_id) do update set sharing = excluded.sharing, updated_at = now();
end $$;

-- Trend/sparkline series. Never returns rows for a 16–17, on any surface.
-- Progress and Home must not be given teen weight data even if Health data is on.
create or replace function public.progress_weight_series(p_surface text default 'progress')
returns table (recorded_on date, has_ciphertext boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_minor boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_surface is null or p_surface not in ('progress','home','profile') then
    raise exception 'invalid_surface' using errcode = '22023';
  end if;
  select is_minor into v_minor from public.profiles where id = v_uid;
  -- Teens: no card/trend/sparkline on Progress or Home, and no history on Profile either
  -- (Profile may only show the optional current value from health_records.body_weight_ct).
  if coalesce(v_minor, true) then return; end if;
  if not app.has_consent(v_uid, 'health_data') then return; end if;
  return query
    select w.recorded_on, (w.weight_ct is not null) as has_ciphertext
      from public.weigh_ins w
     where w.user_id = v_uid
     order by w.recorded_on;
end $$;
revoke all on function public.progress_weight_series(text) from public, anon;
grant execute on function public.progress_weight_series(text) to authenticated;

create or replace function app.can_serve_weight_trend(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = p_user and not p.is_minor and p.deleted_at is null)
$$;
revoke all on function app.can_serve_weight_trend(uuid) from public, anon;
grant execute on function app.can_serve_weight_trend(uuid) to authenticated;

-- Video (none in Phase 5 UI). Still blocked for everyone under 18 on the server.
create or replace function app.can_upload_progress_video(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select false
$$;
create or replace function public.upload_progress_video()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
    raise exception 'photo_upload_not_allowed' using errcode = '42501';
  end if;
  raise exception 'video_upload_not_allowed' using errcode = '42501';
end $$;
revoke all on function app.can_upload_progress_video(uuid), public.upload_progress_video() from public, anon;
grant execute on function app.can_upload_progress_video(uuid), public.upload_progress_video() to authenticated;

-- ------------------------------------------------------------------ photo keys (separate from health keys) + export + shred
-- Multiple keys per user so delete-all can schedule the old key for shred
-- while photos stay on and a new key can be registered for later shots.
create table private.photo_data_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  wrapped_key  bytea not null check (octet_length(wrapped_key) between 16 and 4096),
  key_provider text not null check (key_provider in ('aws-kms','local-dev')),
  kms_key_ref  text not null check (length(kms_key_ref) between 1 and 2048),
  active       boolean not null default true,
  shred_after  timestamptz,
  shredded_at  timestamptz,
  created_at   timestamptz not null default now()
);
create unique index photo_data_keys_one_active
  on private.photo_data_keys (user_id) where active and shredded_at is null;
alter table private.photo_data_keys enable row level security;
alter table private.photo_data_keys force row level security;
revoke all on table private.photo_data_keys from public, anon, authenticated;
grant all on table private.photo_data_keys to service_role;

alter table public.progress_photo_opt_ins
  add column if not exists export_offered_at timestamptz;

alter table public.progress_photos
  add column if not exists pending_delete_at timestamptz;

-- The original guard ran on UPDATE too, so marking pending_delete after the
-- opt-in is already off would raise photo_upload_not_allowed. Allow that path.
create or replace function private.progress_photos_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and new.pending_delete_at is distinct from old.pending_delete_at then
    return new;
  end if;
  if not app.can_upload_progress_photo(new.user_id) then
    raise exception 'photo_upload_not_allowed' using errcode = '42501';
  end if;
  return new;
end $$;

create table public.progress_photo_export_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending','processing','completed','rejected')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.progress_photo_export_requests enable row level security;
alter table public.progress_photo_export_requests force row level security;
revoke all on table public.progress_photo_export_requests from public, anon, authenticated;
grant all on table public.progress_photo_export_requests to service_role;
grant select on public.progress_photo_export_requests to authenticated;
create policy progress_photo_export_select_own on public.progress_photo_export_requests
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.register_photo_key(p_wrapped_key bytea, p_key_provider text, p_kms_key_ref text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_active uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not app.can_upload_progress_photo(v_uid) then
    raise exception 'photo_upload_not_allowed' using errcode = '42501';
  end if;
  select id into v_active from private.photo_data_keys
   where user_id = v_uid and active and shredded_at is null and shred_after is null;
  if v_active is not null then
    update private.photo_data_keys
       set wrapped_key = p_wrapped_key, key_provider = p_key_provider, kms_key_ref = p_kms_key_ref
     where id = v_active
     returning id into v_id;
  else
    insert into private.photo_data_keys (user_id, wrapped_key, key_provider, kms_key_ref, active)
    values (v_uid, p_wrapped_key, p_key_provider, p_kms_key_ref, true)
    returning id into v_id;
  end if;
  return v_id;
end $$;
revoke all on function public.register_photo_key(bytea, text, text) from public, anon;
grant execute on function public.register_photo_key(bytea, text, text) to authenticated;

create or replace function public.offer_progress_photo_export()
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
    raise exception 'photo_upload_not_allowed' using errcode = '42501';
  end if;
  insert into public.progress_photo_opt_ins (user_id, opted_in, opted_in_at, revoked_at, updated_at, export_offered_at)
  values (v_uid, false, null, null, now(), now())
  on conflict (user_id) do update set export_offered_at = now(), updated_at = now();
  insert into public.progress_photo_export_requests (user_id, status, requested_at)
  values (v_uid, 'pending', now())
  returning id into v_id;
  perform private.log_audit(v_uid, 'progress_photo_export_offered', v_uid, '{}'::jsonb);
  return v_id;
end $$;
revoke all on function public.offer_progress_photo_export() from public, anon;
grant execute on function public.offer_progress_photo_export() to authenticated;

-- Crypto-shred due keys only. Does not change the opt-in (delete-all leaves photos on).
-- Shared-copy keys are already destroyed on revoke / turn-off / delete-all.
create or replace function public.photo_shred(p_user uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer := 0;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if private.on_litigation_hold(p_user) then return false; end if;
  update public.progress_photo_shared_copies c
     set wrapped_key = null, shredded_at = coalesce(c.shredded_at, now())
   where c.wrapped_key is not null
     and exists (select 1 from public.progress_photos ph
                  where ph.id = c.photo_id and ph.user_id = p_user);
  delete from private.photo_data_keys
   where user_id = p_user
     and shredded_at is null
     and shred_after is not null
     and shred_after <= now();
  get diagnostics n = row_count;
  perform private.log_audit(auth.uid(), 'photo_shredded', p_user, '{}'::jsonb);
  return n > 0;
end $$;
revoke all on function public.photo_shred(uuid) from public, anon, authenticated;
grant execute on function public.photo_shred(uuid) to service_role;

-- Revoke every share and destroy shared-copy keys immediately (turn-off and delete-all).
create or replace function private.revoke_all_photo_shares(p_user uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.progress_photo_shares s
     set revoked_at = now()
   where s.revoked_at is null
     and exists (select 1 from public.progress_photos ph
                  where ph.id = s.photo_id and ph.user_id = p_user);
  update public.progress_photo_shared_copies c
     set wrapped_key = null, shredded_at = now()
   where exists (select 1 from public.progress_photos ph
                  where ph.id = c.photo_id and ph.user_id = p_user);
end $$;

create or replace function private.schedule_photo_key_shred(p_user uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update private.photo_data_keys
     set active = false,
         shred_after = coalesce(shred_after, now() + interval '29 days')
   where user_id = p_user and shredded_at is null;
end $$;

-- ------------------------------------------------------------------ share opt-in, shared copies, recipients
create table public.progress_photo_share_opt_ins (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  opted_in    boolean not null default false,
  opted_in_at timestamptz,
  revoked_at  timestamptz,
  updated_at  timestamptz not null default now(),
  primary key (user_id, coach_id),
  check (user_id <> coach_id),
  check (opted_in = false or opted_in_at is not null)
);
alter table public.progress_photo_share_opt_ins enable row level security;
alter table public.progress_photo_share_opt_ins force row level security;
revoke all on table public.progress_photo_share_opt_ins from public, anon, authenticated;
grant all on table public.progress_photo_share_opt_ins to service_role;
grant select on public.progress_photo_share_opt_ins to authenticated;
create policy progress_photo_share_opt_ins_select_own on public.progress_photo_share_opt_ins
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function app.has_progress_photo_share_opt_in(p_user uuid, p_coach uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.progress_photo_share_opt_ins o
     where o.user_id = p_user and o.coach_id = p_coach and o.opted_in)
$$;
revoke all on function app.has_progress_photo_share_opt_in(uuid, uuid) from public, anon;
grant execute on function app.has_progress_photo_share_opt_in(uuid, uuid) to authenticated;

create or replace function app.is_approved_adult_coach(p_coach uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = p_coach and not p.is_minor and p.deleted_at is null)
     and exists (select 1 from public.user_roles r where r.user_id = p_coach and r.role = 'coach_verified')
$$;
revoke all on function app.is_approved_adult_coach(uuid) from public, anon;
grant execute on function app.is_approved_adult_coach(uuid) to authenticated;

create or replace function app.athlete_initials(p_user uuid)
returns text language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(nullif(upper(left(regexp_replace(coalesce(p.display_name, ''), '\s+', '', 'g'), 2)), ''), 'A')
    from public.profiles p where p.id = p_user
$$;
revoke all on function app.athlete_initials(uuid) from public, anon;
grant execute on function app.athlete_initials(uuid) to authenticated;

-- Separate bucket/key for shared copies. Coach never gets the athlete's original object.
create table public.progress_photo_shared_copies (
  id                  uuid primary key default gen_random_uuid(),
  share_id            uuid not null unique references public.progress_photo_shares(id) on delete cascade,
  photo_id            uuid not null references public.progress_photos(id) on delete cascade,
  coach_id            uuid not null references public.profiles(id) on delete cascade,
  watermark_initials  text not null check (length(watermark_initials) between 1 and 8),
  watermarked         boolean not null default false,
  safety_check        text not null default 'pending' check (safety_check in ('pending','passed','failed')),
  wrapped_key         bytea check (wrapped_key is null or octet_length(wrapped_key) between 16 and 4096),
  shredded_at         timestamptz,
  created_at          timestamptz not null default now()
);
create table public.progress_photo_recipients (
  photo_id   uuid not null references public.progress_photos(id) on delete cascade,
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (photo_id, coach_id)
);
alter table public.progress_photo_shared_copies enable row level security;
alter table public.progress_photo_shared_copies force row level security;
alter table public.progress_photo_recipients enable row level security;
alter table public.progress_photo_recipients force row level security;
revoke all on table public.progress_photo_shared_copies, public.progress_photo_recipients from public, anon, authenticated;
grant all on table public.progress_photo_shared_copies, public.progress_photo_recipients to service_role;
grant select on public.progress_photo_shared_copies, public.progress_photo_recipients to authenticated;

create or replace function app.coach_can_view_progress_photo(p_photo uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
      from public.progress_photo_shares s
      join public.progress_photos ph on ph.id = s.photo_id
      join public.progress_photo_shared_copies c on c.share_id = s.id
     where s.photo_id = p_photo
       and s.coach_id = auth.uid()
       and s.revoked_at is null
       and c.watermarked
       and c.safety_check = 'passed'
       and c.wrapped_key is not null
       and c.shredded_at is null
       and app.is_active_coach_of(ph.user_id)
       and app.is_approved_adult_coach(auth.uid())
       and app.has_progress_photo_opt_in(ph.user_id)
       and app.has_progress_photo_share_opt_in(ph.user_id, auth.uid())
       and not exists (select 1 from public.profiles p where p.id = ph.user_id and p.is_minor)
  )
$$;

create policy progress_photo_shared_copies_select_owner on public.progress_photo_shared_copies
  for select to authenticated
  using (exists (select 1 from public.progress_photos ph
                  where ph.id = photo_id and ph.user_id = (select auth.uid())));
create policy progress_photo_shared_copies_select_coach on public.progress_photo_shared_copies
  for select to authenticated
  using (coach_id = (select auth.uid()) and app.coach_can_view_progress_photo(photo_id));
create policy progress_photo_recipients_select_owner on public.progress_photo_recipients
  for select to authenticated
  using (exists (select 1 from public.progress_photos ph
                  where ph.id = photo_id and ph.user_id = (select auth.uid())));

-- ------------------------------------------------------------------ consent logging (Continue / Not now), no auto re-prompt
create or replace function app.progress_photo_reprompt_due(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select false
$$;
revoke all on function app.progress_photo_reprompt_due(uuid) from public, anon;
grant execute on function app.progress_photo_reprompt_due(uuid) to authenticated;

create or replace function private.photo_text_ok(p_version text, p_hash text)
returns boolean language sql immutable as $$
  select p_version is not null and length(btrim(p_version)) between 1 and 64
     and p_hash is not null and p_hash ~ '^[0-9a-f]{64}$'
$$;

-- Replace the boolean-only signature: Continue must send a version and hash.
drop function if exists public.set_progress_photo_opt_in(boolean);

create or replace function public.set_progress_photo_opt_in(p_on boolean, p_version text, p_text_hash text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_had_photos boolean;
  v_was_on boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not private.photo_text_ok(p_version, p_text_hash) then
    raise exception 'invalid_text_hash' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
    raise exception 'photo_upload_not_allowed' using errcode = '42501';
  end if;
  select coalesce(o.opted_in, false) into v_was_on
    from public.progress_photo_opt_ins o where o.user_id = v_uid;
  v_was_on := coalesce(v_was_on, false);
  v_had_photos := exists (select 1 from public.progress_photos ph where ph.user_id = v_uid);

  if coalesce(p_on, false) then
    insert into public.progress_photo_opt_ins (user_id, opted_in, opted_in_at, revoked_at, updated_at)
    values (v_uid, true, now(), null, now())
    on conflict (user_id) do update
      set opted_in = true, opted_in_at = now(), revoked_at = null, updated_at = now();
  else
    -- Export must be offered first when turning off after photos exist or the switch was on.
    if (v_was_on or v_had_photos) and not exists (
         select 1 from public.progress_photo_opt_ins o
          where o.user_id = v_uid and o.export_offered_at is not null) then
      raise exception 'export_required' using errcode = '42501';
    end if;
    insert into public.progress_photo_opt_ins (user_id, opted_in, opted_in_at, revoked_at, updated_at)
    values (v_uid, false, null, now(), now())
    on conflict (user_id) do update
      set opted_in = false, revoked_at = now(), updated_at = now();
    perform private.revoke_all_photo_shares(v_uid);
    update public.progress_photos set pending_delete_at = coalesce(pending_delete_at, now())
     where user_id = v_uid and pending_delete_at is null;
    perform private.schedule_photo_key_shred(v_uid);
  end if;

  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, actor_user_id)
  values (v_uid, 'progress_photos', 'self', coalesce(p_on, false), btrim(p_version), p_text_hash, v_uid);
end $$;

create or replace function public.dismiss_progress_photo_opt_in()
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- Not now: log dismissed only. Opt-in state is unchanged. No version/hash, no re-prompt clock.
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, actor_user_id)
  values (v_uid, 'progress_photos', 'self', false, 'dismissed', null, v_uid);
end $$;

-- Delete all photos: same deletion path as turn-off (export first, device copy is a
-- client hook, server key shred within 30 days, coach access revoked now) but the
-- opt-in stays on so the user can take new photos.
create or replace function public.delete_all_progress_photos()
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_had_photos boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
    raise exception 'photo_upload_not_allowed' using errcode = '42501';
  end if;
  v_had_photos := exists (
    select 1 from public.progress_photos ph
     where ph.user_id = v_uid and ph.pending_delete_at is null);
  if v_had_photos and not exists (
       select 1 from public.progress_photo_opt_ins o
        where o.user_id = v_uid and o.export_offered_at is not null) then
    raise exception 'export_required' using errcode = '42501';
  end if;
  perform private.revoke_all_photo_shares(v_uid);
  update public.progress_photos set pending_delete_at = coalesce(pending_delete_at, now())
   where user_id = v_uid and pending_delete_at is null;
  perform private.schedule_photo_key_shred(v_uid);
  -- Opt-in is left on. A later register_photo_key issues a fresh key for new shots.
end $$;

create or replace function public.set_photo_coach_share_opt_in(p_coach uuid, p_on boolean, p_version text, p_text_hash text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not private.photo_text_ok(p_version, p_text_hash) then
    raise exception 'invalid_text_hash' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
    raise exception 'photo_upload_not_allowed' using errcode = '42501';
  end if;
  if not app.is_approved_adult_coach(p_coach) then
    raise exception 'one_to_one_required' using errcode = '42501';
  end if;
  if not exists (
       select 1 from public.coach_relationships cr
        where cr.coach_id = p_coach and cr.client_id = v_uid and cr.status = 'active') then
    raise exception 'one_to_one_required' using errcode = '42501';
  end if;
  if coalesce(p_on, false) then
    insert into public.progress_photo_share_opt_ins (user_id, coach_id, opted_in, opted_in_at, revoked_at, updated_at)
    values (v_uid, p_coach, true, now(), null, now())
    on conflict (user_id, coach_id) do update
      set opted_in = true, opted_in_at = now(), revoked_at = null, updated_at = now();
  else
    insert into public.progress_photo_share_opt_ins (user_id, coach_id, opted_in, opted_in_at, revoked_at, updated_at)
    values (v_uid, p_coach, false, null, now(), now())
    on conflict (user_id, coach_id) do update
      set opted_in = false, revoked_at = now(), updated_at = now();
  end if;
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, actor_user_id)
  values (v_uid, 'photo_coach_sharing', 'self', coalesce(p_on, false), btrim(p_version), p_text_hash, v_uid);
end $$;

create or replace function public.dismiss_photo_coach_share_opt_in()
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, actor_user_id)
  values (v_uid, 'photo_coach_sharing', 'self', false, 'dismissed', null, v_uid);
end $$;

revoke all on function
  public.set_progress_photo_opt_in(boolean, text, text),
  public.dismiss_progress_photo_opt_in(),
  public.delete_all_progress_photos(),
  public.set_photo_coach_share_opt_in(uuid, boolean, text, text),
  public.dismiss_photo_coach_share_opt_in()
  from public, anon;
grant execute on function
  public.set_progress_photo_opt_in(boolean, text, text),
  public.dismiss_progress_photo_opt_in(),
  public.delete_all_progress_photos(),
  public.set_photo_coach_share_opt_in(uuid, boolean, text, text),
  public.dismiss_photo_coach_share_opt_in()
  to authenticated;
revoke all on function private.revoke_all_photo_shares(uuid), private.schedule_photo_key_shred(uuid)
  from public, anon, authenticated;

-- ------------------------------------------------------------------ share_progress_photo: 18+ approved 1:1, per photo, copy + watermark hook
-- 008 returned void; drop so the uuid return type can be applied.
drop function if exists public.share_progress_photo(uuid, uuid);
create or replace function public.share_progress_photo(p_photo uuid, p_coach uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_share uuid;
  v_initials text;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select user_id into v_owner from public.progress_photos where id = p_photo;
  if v_owner is null or v_owner <> v_uid then raise exception 'forbidden' using errcode = '42501'; end if;
  if not app.can_upload_progress_photo(v_uid) then
    raise exception 'photo_upload_not_allowed' using errcode = '42501';
  end if;
  -- Relationship first: there is no share opt-in without an approved 1:1.
  if not app.is_approved_adult_coach(p_coach) then
    raise exception 'one_to_one_required' using errcode = '42501';
  end if;
  if not exists (
       select 1 from public.coach_relationships cr
        where cr.coach_id = p_coach and cr.client_id = v_uid and cr.status = 'active') then
    raise exception 'one_to_one_required' using errcode = '42501';
  end if;
  if not app.has_progress_photo_share_opt_in(v_uid, p_coach) then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  v_initials := app.athlete_initials(v_uid);
  insert into public.progress_photo_shares (photo_id, coach_id, shared_at, revoked_at)
  values (p_photo, p_coach, now(), null)
  on conflict (photo_id, coach_id) do update
    set shared_at = now(), revoked_at = null
  returning id into v_share;
  insert into public.progress_photo_recipients (photo_id, coach_id)
  values (p_photo, p_coach)
  on conflict (photo_id, coach_id) do nothing;
  -- Shared copy starts pending: not viewable until watermarked and the safety check passes.
  insert into public.progress_photo_shared_copies
    (share_id, photo_id, coach_id, watermark_initials, watermarked, safety_check, wrapped_key, shredded_at)
  values (v_share, p_photo, p_coach, v_initials, false, 'pending', null, null)
  on conflict (share_id) do update
    set shredded_at = null, wrapped_key = null, watermarked = false, safety_check = 'pending',
        watermark_initials = excluded.watermark_initials;
  return v_share;
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
  -- Separate shared-copy key is destroyed immediately so access ends now.
  update public.progress_photo_shared_copies c
     set wrapped_key = null, shredded_at = now()
    from public.progress_photo_shares s
   where c.share_id = s.id and s.photo_id = p_photo and s.coach_id = p_coach;
end $$;

-- Watermark + hash-matching hook (vendor listed in Privacy Policy §8.1). Service only.
-- No UI. Marks the shared copy viewable when both steps have completed.
create or replace function public.finalize_shared_photo_copy(p_share uuid, p_wrapped_key bytea, p_safety text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_safety is null or p_safety not in ('pending','passed','failed') then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  update public.progress_photo_shared_copies
     set watermarked = true,
         safety_check = p_safety,
         wrapped_key = case when p_safety = 'passed' then p_wrapped_key else null end,
         shredded_at = case when p_safety = 'passed' then null else shredded_at end
   where share_id = p_share;
end $$;

revoke all on function public.share_progress_photo(uuid, uuid), public.revoke_progress_photo_share(uuid, uuid)
  from public, anon;
grant execute on function public.share_progress_photo(uuid, uuid), public.revoke_progress_photo_share(uuid, uuid)
  to authenticated;
revoke all on function public.finalize_shared_photo_copy(uuid, bytea, text) from public, anon, authenticated;
grant execute on function public.finalize_shared_photo_copy(uuid, bytea, text) to service_role;

-- ------------------------------------------------------------------ retention: photo key shred within 30 days
insert into public.retention_policies (record_type, keep_rule, implemented, status) values
  ('progress_photos',
   'Removed from the phone right away and from servers and backups within 30 days of delete or turning photos off, by destroying the per-user photo key. Shared copies are shredded on revoke immediately.',
   'photo_shred() destroys private.photo_data_keys (and shared-copy keys) 29 days after photos are turned off, or sooner on an explicit shred. Litigation holds skip it.',
   'enforced')
on conflict (record_type) do update set keep_rule = excluded.keep_rule, implemented = excluded.implemented, status = excluded.status;

create or replace function public.run_retention_purge()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r jsonb := '{}'::jsonb; n integer; v_user uuid;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;

  r := r || jsonb_build_object('minor_flags_recomputed', public.recompute_minor_flags());
  r := r || jsonb_build_object('unprofiled_auth_users', public.purge_unprofiled_auth_users(interval '24 hours'));
  r := r || jsonb_build_object('pending_minors', public.purge_pending_minors());
  r := r || jsonb_build_object('parent_invites_expired', private.expire_parent_invites());

  -- health data: shred 29 days after the effective health_data consent was revoked (deadline is 30).
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

  -- Progress photos: shred the per-user key once shred_after is due (set 29 days after turn-off).
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

revoke all on function public.run_retention_purge() from public, anon, authenticated;
grant execute on function public.run_retention_purge() to service_role;

revoke all on function private.photo_text_ok(text, text), private.weigh_ins_guard() from public, anon, authenticated;

-- Hide photos that are pending delete (turn-off / delete-all) from listing.
drop policy if exists progress_photos_select_own on public.progress_photos;
create policy progress_photos_select_own on public.progress_photos for select to authenticated
  using (user_id = (select auth.uid()) and pending_delete_at is null);
