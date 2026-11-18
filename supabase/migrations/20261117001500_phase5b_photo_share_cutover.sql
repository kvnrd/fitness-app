-- Turning off coach photo sharing cuts access immediately: shares are revoked,
-- shared-copy keys are shredded, issued signed-URL grants are revoked, and
-- photo tables stay out of realtime publications.

create or replace function private.revoke_photo_shares_for_coach(p_user uuid, p_coach uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.progress_photo_shares s
     set revoked_at = now()
   where s.revoked_at is null
     and s.coach_id = p_coach
     and exists (select 1 from public.progress_photos ph
                  where ph.id = s.photo_id and ph.user_id = p_user);
  update public.progress_photo_shared_copies c
     set wrapped_key = null, shredded_at = now()
   where c.coach_id = p_coach
     and exists (select 1 from public.progress_photos ph
                  where ph.id = c.photo_id and ph.user_id = p_user);
  if to_regclass('private.progress_photo_access_grants') is not null then
    update private.progress_photo_access_grants g
       set revoked_at = now()
     where g.revoked_at is null
       and g.coach_id = p_coach
       and exists (select 1 from public.progress_photos ph
                    where ph.id = g.photo_id and ph.user_id = p_user);
  end if;
end $$;

create table if not exists private.progress_photo_access_grants (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid not null references public.progress_photos(id) on delete cascade,
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  share_id   uuid references public.progress_photo_shares(id) on delete cascade,
  token      text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
revoke all on table private.progress_photo_access_grants from public, anon, authenticated;
grant all on table private.progress_photo_access_grants to service_role;
alter table private.progress_photo_access_grants enable row level security;
alter table private.progress_photo_access_grants force row level security;
revoke all on function private.revoke_photo_shares_for_coach(uuid, uuid) from public, anon, authenticated;

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
    perform private.revoke_photo_shares_for_coach(v_uid, p_coach);
  end if;
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, actor_user_id)
  values (v_uid, 'photo_coach_sharing', 'self', coalesce(p_on, false), btrim(p_version), p_text_hash, v_uid);
end $$;

-- Short-lived access grant for a coach-viewable shared copy. Not a Storage signed
-- URL (those need the Storage API); turning share off revokes the grant immediately.
create or replace function public.issue_coach_photo_signed_url(p_photo uuid)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_share uuid;
  v_token text;
  v_exp timestamptz := now() + interval '60 seconds';
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not app.coach_can_view_progress_photo(p_photo) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select s.id into v_share
    from public.progress_photo_shares s
   where s.photo_id = p_photo and s.coach_id = v_uid and s.revoked_at is null
   order by s.shared_at desc limit 1;
  v_token := encode(gen_random_bytes(24), 'hex');
  insert into private.progress_photo_access_grants (photo_id, coach_id, share_id, token, expires_at)
  values (p_photo, v_uid, v_share, v_token, v_exp);
  return jsonb_build_object(
    'token', v_token,
    'expires_at', v_exp,
    'url', 'coach-photo://' || v_token
  );
end $$;
revoke all on function public.issue_coach_photo_signed_url(uuid) from public, anon;
grant execute on function public.issue_coach_photo_signed_url(uuid) to authenticated;

create or replace function app.coach_photo_signed_url_valid(p_token text)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
      from private.progress_photo_access_grants g
     where g.token = p_token
       and g.revoked_at is null
       and g.expires_at > now()
       and app.coach_can_view_progress_photo(g.photo_id)
  )
$$;
revoke all on function app.coach_photo_signed_url_valid(text) from public, anon;
grant execute on function app.coach_photo_signed_url_valid(text) to authenticated;

create or replace function app.progress_photos_published_realtime()
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
      from pg_catalog.pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename in (
         'progress_photos',
         'progress_photo_shares',
         'progress_photo_shared_copies',
         'progress_photo_share_opt_ins'
       )
  )
$$;
revoke all on function app.progress_photos_published_realtime() from public, anon;
grant execute on function app.progress_photos_published_realtime() to authenticated;

do $$
declare t text;
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'public.progress_photos',
      'public.progress_photo_shares',
      'public.progress_photo_shared_copies',
      'public.progress_photo_share_opt_ins'
    ]
    loop
      if exists (
        select 1 from pg_catalog.pg_publication_tables
         where pubname = 'supabase_realtime'
           and schemaname = split_part(t, '.', 1)
           and tablename = split_part(t, '.', 2)
      ) then
        execute format('alter publication supabase_realtime drop table %s', t);
      end if;
    end loop;
  end if;
end $$;
