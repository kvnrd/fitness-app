-- Option 3: teens may store weigh-in history (both health opt-ins still required
-- via has_consent). Coaches never see a minor's weight, even if a share row exists.

create or replace function app.shares_body_weight_with(p_user uuid, p_coach uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p
                  where p.id = p_user and not p.is_minor and p.deleted_at is null)
     and exists (select 1 from public.body_weight_share s
                  where s.user_id = p_user and s.coach_id = p_coach and s.sharing)
     and exists (select 1 from public.coach_relationships cr
                  where cr.coach_id = p_coach and cr.client_id = p_user and cr.status = 'active')
$$;

create or replace function app.shares_body_weight(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p
                  where p.id = p_user and not p.is_minor and p.deleted_at is null)
     and exists (select 1 from public.body_weight_share s
                  where s.user_id = p_user and s.sharing)
$$;

create or replace function app.coach_may_see_body_weight(p_user uuid, p_coach uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select app.shares_body_weight_with(p_user, p_coach)
$$;
revoke all on function app.coach_may_see_body_weight(uuid, uuid) from public, anon;
grant execute on function app.coach_may_see_body_weight(uuid, uuid) to authenticated;

drop policy if exists weigh_ins_select_coach on public.weigh_ins;
create policy weigh_ins_select_coach on public.weigh_ins for select to authenticated
  using (
    app.shares_body_weight_with(user_id, (select auth.uid()))
    and not exists (select 1 from public.profiles p where p.id = user_id and p.is_minor)
  );


-- Option 3: teens may store weigh-in history and see their own series/trend.
-- has_consent('health_data') already requires both the teen's and the parent's opt-ins.
-- Coaches still never see a minor's weight (shares_body_weight_with / policy above).

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

create or replace function public.progress_weight_series(p_surface text default 'progress')
returns table (recorded_on date, has_ciphertext boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_surface is null or p_surface not in ('progress','home','profile') then
    raise exception 'invalid_surface' using errcode = '22023';
  end if;
  -- Owner-only. Teens with both health opt-ins see their own history like adults.
  if not app.has_consent(v_uid, 'health_data') then return; end if;
  return query
    select w.recorded_on, (w.weight_ct is not null) as has_ciphertext
      from public.weigh_ins w
     where w.user_id = v_uid
     order by w.recorded_on;
end $$;

create or replace function app.can_serve_weight_trend(p_user uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.profiles p
     where p.id = p_user and p.deleted_at is null
       and app.has_consent(p_user, 'health_data')
  )
$$;
