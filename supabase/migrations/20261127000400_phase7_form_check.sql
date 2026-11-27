-- Phase 7 Form check: server side.
--
-- Pose analysis runs on the phone (MediaPipe, face points dropped in native code). The server only
-- ever stores the results a user chooses to keep or share:
--   * form_checks: the numbers (rep count, angles, flags, bar drift) and a body-only skeleton
--     (22 joints × x, y, visibility, about 10 fps). No video, no face points, no free text.
--   * form_check_shares: a share with the user's own active coach.
--       - Adults: their own opt-in. include_video may be true (the upload path lands with the
--         storage bucket in a later PR; video_path stays null until then).
--       - 16–17: skeleton and numbers only, never video, and the coach sees nothing until the
--         parent also approves. Coach review notes to minors wait for the Phase 8 chat safeguards.
--   Revoking a share, ending the coaching relationship or withdrawing coach_sharing consent hides
--   it from the coach immediately (app.coach_can_see).
-- Form-check numbers are consumer health data (health-data policy §3), so saving one needs the
-- effective health_data consent (both opt-ins for 16–17).

-- ------------------------------------------------------------------ shape checks
create or replace function app.form_check_skeleton_ok(p jsonb) returns boolean
language plpgsql immutable set search_path = public, pg_temp as $$
declare f jsonb;
begin
  if p is null then return true; end if;
  if jsonb_typeof(p) <> 'array' or jsonb_array_length(p) > 3000 then return false; end if;
  for f in select value from jsonb_array_elements(p) loop
    if jsonb_typeof(f) <> 'object'
       or (select array_agg(k order by k) from jsonb_object_keys(f) k) <> array['p','t']
       or jsonb_typeof(f -> 't') <> 'number'
       or jsonb_typeof(f -> 'p') <> 'array'
       or jsonb_array_length(f -> 'p') <> 66
       or exists (select 1 from jsonb_array_elements(f -> 'p') v where jsonb_typeof(v) <> 'number') then
      return false;
    end if;
  end loop;
  return true;
end $$;

create or replace function app.form_check_metrics_ok(m jsonb) returns boolean
language sql immutable set search_path = public, pg_temp as $$
  select m is not null and jsonb_typeof(m) = 'object'
     and not exists (select 1 from jsonb_object_keys(m) k
                      where k not in ('movement','repCount','reps','barDrift'))
     and jsonb_typeof(m -> 'reps') = 'array'
     and jsonb_array_length(m -> 'reps') <= 200
     and not exists (select 1 from jsonb_array_elements(m -> 'reps') r, jsonb_object_keys(r) k
                      where k not in ('index','bottomAngle','topAngle','durationMs','flags'))
$$;

-- ------------------------------------------------------------------ tables
create table public.form_checks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  movement     text not null check (movement in ('squat','deadlift','bench_press','overhead_press','push_up')),
  recorded_at  timestamptz not null,
  rep_count    integer not null check (rep_count between 0 and 200),
  metrics      jsonb not null check (app.form_check_metrics_ok(metrics)),
  skeleton     jsonb check (app.form_check_skeleton_ok(skeleton)),
  created_at   timestamptz not null default now()
);
create index form_checks_user_idx on public.form_checks (user_id, recorded_at desc);

create table public.form_check_shares (
  id               uuid primary key default gen_random_uuid(),
  form_check_id    uuid not null references public.form_checks(id) on delete cascade,
  owner_id         uuid not null references public.profiles(id) on delete cascade,
  coach_id         uuid not null references public.profiles(id) on delete cascade,
  include_video    boolean not null default false,
  video_path       text,
  owner_opt_in_at  timestamptz not null default now(),
  parent_opt_in_at timestamptz,
  parent_id        uuid references public.profiles(id),
  coach_note       text check (coach_note is null or char_length(coach_note) <= 2000),
  coach_reviewed_at timestamptz,
  revoked_at       timestamptz,
  created_at       timestamptz not null default now(),
  check (video_path is null or include_video),
  check (video_path is null or revoked_at is null)
);
create unique index form_check_shares_open_uq on public.form_check_shares (form_check_id, coach_id)
  where revoked_at is null;
create index form_check_shares_coach_idx on public.form_check_shares (coach_id) where revoked_at is null;

-- A minor's share can never carry video, whoever writes the row.
create or replace function private.form_check_share_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.profiles p where p.id = new.owner_id and p.is_minor)
     and (new.include_video or new.video_path is not null) then
    raise exception 'minor_video_never_shared' using errcode = '42501';
  end if;
  if new.owner_id <> (select f.user_id from public.form_checks f where f.id = new.form_check_id) then
    raise exception 'owner_mismatch' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger form_check_share_guard before insert or update on public.form_check_shares
  for each row execute function private.form_check_share_guard();

-- ------------------------------------------------------------------ visibility
-- The calling coach may see this share: their own share, not revoked, still the client's active
-- coach with coach_sharing consent, and for a minor the parent has approved.
create or replace function app.coach_sees_form_check_share(p_share uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.form_check_shares s
      join public.profiles p on p.id = s.owner_id
     where s.id = p_share and s.coach_id = auth.uid() and s.revoked_at is null
       and app.coach_can_see(s.owner_id)
       and (not p.is_minor or s.parent_opt_in_at is not null))
$$;

create or replace function app.coach_sees_form_check(p_form_check uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.form_check_shares s
                  where s.form_check_id = p_form_check and app.coach_sees_form_check_share(s.id))
$$;

-- The caller is the active contracting parent of p_minor.
create or replace function app.is_contracting_parent_of(p_minor uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.parent_links l
                  where l.minor_user_id = p_minor and l.parent_user_id = auth.uid()
                    and l.status = 'active' and l.is_contracting_party)
$$;

-- ------------------------------------------------------------------ RLS
alter table public.form_checks enable row level security;
alter table public.form_checks force row level security;
alter table public.form_check_shares enable row level security;
alter table public.form_check_shares force row level security;

revoke all on table public.form_checks, public.form_check_shares from public, anon, authenticated;
grant select, delete on public.form_checks to authenticated;
grant select on public.form_check_shares to authenticated;
grant all on public.form_checks, public.form_check_shares to service_role;

create policy form_checks_owner_select on public.form_checks for select to authenticated
  using (user_id = auth.uid());
create policy form_checks_owner_delete on public.form_checks for delete to authenticated
  using (user_id = auth.uid());
create policy form_checks_coach_select on public.form_checks for select to authenticated
  using (app.coach_sees_form_check(id));

create policy form_check_shares_owner_select on public.form_check_shares for select to authenticated
  using (owner_id = auth.uid());
create policy form_check_shares_parent_select on public.form_check_shares for select to authenticated
  using (app.is_contracting_parent_of(owner_id));
create policy form_check_shares_coach_select on public.form_check_shares for select to authenticated
  using (app.coach_sees_form_check_share(id));

-- ------------------------------------------------------------------ RPCs
create or replace function public.save_form_check(
  p_movement text, p_recorded_at timestamptz, p_metrics jsonb, p_skeleton jsonb default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if not app.has_consent(v_uid, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  if not app.form_check_metrics_ok(p_metrics) then
    raise exception 'invalid_metrics' using errcode = '22023';
  end if;
  if not app.form_check_skeleton_ok(p_skeleton) then
    raise exception 'invalid_skeleton' using errcode = '22023';
  end if;
  if p_metrics ->> 'movement' is distinct from p_movement then
    raise exception 'invalid_metrics' using errcode = '22023';
  end if;
  insert into public.form_checks (user_id, movement, recorded_at, rep_count, metrics, skeleton)
  values (v_uid, p_movement, p_recorded_at, jsonb_array_length(p_metrics -> 'reps'), p_metrics, p_skeleton)
  returning id into v_id;
  return v_id;
end $$;

-- Share with the caller's own active coach. A minor's share waits for the parent.
create or replace function public.share_form_check(p_form_check uuid, p_coach uuid, p_include_video boolean default false)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_minor boolean; v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if not exists (select 1 from public.form_checks f where f.id = p_form_check and f.user_id = v_uid) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.coach_relationships cr
                  join public.user_roles r on r.user_id = cr.coach_id and r.role = 'coach_verified'
                 where cr.coach_id = p_coach and cr.client_id = v_uid and cr.status = 'active') then
    raise exception 'not_your_coach' using errcode = '42501';
  end if;
  select p.is_minor into v_minor from public.profiles p where p.id = v_uid;
  if v_minor and coalesce(p_include_video, false) then
    raise exception 'minor_video_never_shared' using errcode = '42501';
  end if;
  insert into public.form_check_shares (form_check_id, owner_id, coach_id, include_video)
  values (p_form_check, v_uid, p_coach, coalesce(p_include_video, false))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.parent_approve_form_check_share(p_share uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  select s.owner_id into v_owner from public.form_check_shares s where s.id = p_share and s.revoked_at is null;
  if v_owner is null or not app.is_contracting_parent_of(v_owner) then
    raise exception 'not_parent' using errcode = '42501';
  end if;
  update public.form_check_shares set parent_opt_in_at = now(), parent_id = auth.uid()
   where id = p_share and parent_opt_in_at is null;
end $$;

-- The owner, or a minor's parent, can stop a share at any time. A shared video copy is dropped.
create or replace function public.revoke_form_check_share(p_share uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  select s.owner_id into v_owner from public.form_check_shares s where s.id = p_share;
  if v_owner is null or not (v_owner = auth.uid() or app.is_contracting_parent_of(v_owner)) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  update public.form_check_shares set revoked_at = now(), video_path = null
   where id = p_share and revoked_at is null;
end $$;

-- Coach review note (adults only for now).
create or replace function public.coach_review_form_check(p_share uuid, p_note text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_owner uuid;
begin
  if not app.coach_sees_form_check_share(p_share) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  select s.owner_id into v_owner from public.form_check_shares s where s.id = p_share;
  if exists (select 1 from public.profiles p where p.id = v_owner and p.is_minor) then
    raise exception 'minor_review_note_not_allowed' using errcode = '42501';
  end if;
  if p_note is null or char_length(btrim(p_note)) = 0 or char_length(p_note) > 2000 then
    raise exception 'invalid_note' using errcode = '22023';
  end if;
  update public.form_check_shares set coach_note = p_note, coach_reviewed_at = now() where id = p_share;
end $$;

revoke all on function
  app.form_check_skeleton_ok(jsonb), app.form_check_metrics_ok(jsonb),
  app.coach_sees_form_check_share(uuid), app.coach_sees_form_check(uuid), app.is_contracting_parent_of(uuid),
  private.form_check_share_guard(),
  public.save_form_check(text, timestamptz, jsonb, jsonb),
  public.share_form_check(uuid, uuid, boolean),
  public.parent_approve_form_check_share(uuid),
  public.revoke_form_check_share(uuid),
  public.coach_review_form_check(uuid, text)
  from public, anon;
grant execute on function
  app.form_check_skeleton_ok(jsonb), app.form_check_metrics_ok(jsonb),
  app.coach_sees_form_check_share(uuid), app.coach_sees_form_check(uuid), app.is_contracting_parent_of(uuid),
  public.save_form_check(text, timestamptz, jsonb, jsonb),
  public.share_form_check(uuid, uuid, boolean),
  public.parent_approve_form_check_share(uuid),
  public.revoke_form_check_share(uuid),
  public.coach_review_form_check(uuid, text)
  to authenticated, service_role;
