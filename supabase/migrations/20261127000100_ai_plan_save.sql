-- Save an accepted AI plan as the user's own plan, so the Train tab shows it.
--
-- Flow: the ai-plan server function keeps the draft that passed the safety filter in
-- private.ai_plan_drafts (service role only). "Start this plan" calls mark_ai_plan_accepted(), which
-- copies that server-held draft into plans / plan_days / exercises with owner_id = client_id = the
-- user. The app never sends plan content, so a plan that skipped the filter cannot be saved this way.
-- A rejected draft is still never written anywhere (log_ai_plan_filtered stores the reason code only).

alter table public.plans add column ai_generated boolean not null default false;

-- ------------------------------------------------------------------ server-held draft (one per user)
create table private.ai_plan_drafts (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  draft      jsonb not null check (jsonb_typeof(draft -> 'days') = 'array'),
  created_at timestamptz not null default now()
);
alter table private.ai_plan_drafts enable row level security;
alter table private.ai_plan_drafts force row level security;
revoke all on table private.ai_plan_drafts from public, anon, authenticated;

-- Service only: called by the ai-plan function after the filter passes. Replaces any earlier draft.
create or replace function public.save_ai_plan_draft(p_actor uuid, p_draft jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform private.require_service();
  if p_actor is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_draft is null or jsonb_typeof(p_draft -> 'days') is distinct from 'array'
     or jsonb_array_length(p_draft -> 'days') not between 1 and 7 then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  insert into private.ai_plan_drafts (user_id, draft, created_at) values (p_actor, p_draft, now())
  on conflict (user_id) do update set draft = excluded.draft, created_at = excluded.created_at;
end $$;
revoke all on function public.save_ai_plan_draft(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.save_ai_plan_draft(uuid, jsonb) to service_role;

-- ------------------------------------------------------------------ accept: gates, then save the draft
-- The old no-argument version is replaced (a default argument would make the two ambiguous).
drop function if exists public.mark_ai_plan_accepted();

create or replace function public.mark_ai_plan_accepted(p_plan_name text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid   uuid := auth.uid();
  v_draft jsonb;
  v_name  text := nullif(btrim(left(coalesce(p_plan_name, ''), 120)), '');
  v_plan  uuid;
  v_day   uuid;
  v_fresh boolean;
  d       jsonb;
  e       jsonb;
  i       integer;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not app.can_ai_plan(v_uid) then
    if not app.has_consent(v_uid, 'ai_vendor') or not app.has_consent(v_uid, 'health_data') then
      raise exception 'consent_required' using errcode = '42501';
    end if;
    if app.health_screen_status(v_uid) = 'clearance_needed' then
      raise exception 'clearance_required' using errcode = '42501';
    end if;
    raise exception 'health_screen_required' using errcode = '42501';
  end if;

  -- Only a fresh draft: an old one is from an earlier quiz and is dropped instead of saved.
  delete from private.ai_plan_drafts where user_id = v_uid
    returning draft, created_at > now() - interval '1 day' into v_draft, v_fresh;
  if v_draft is not null and v_fresh then
    -- Earlier AI plans are kept: deleting one would cascade to its exercises and erase the user's
    -- logged sets. The Train tab shows the newest plan (loadAssignedPlan orders by updated_at).
    insert into public.plans (owner_id, client_id, name, ai_generated)
    values (v_uid, v_uid, coalesce(v_name, 'AI plan'), true)
    returning id into v_plan;
    for d in select value from jsonb_array_elements(v_draft -> 'days') loop
      insert into public.plan_days (plan_id, day_key, title, focus, duration_min, rest)
      values (v_plan, d ->> 'day_key', left(d ->> 'title', 80), left(coalesce(d ->> 'focus', ''), 160),
              coalesce((d ->> 'duration_min')::integer, 0), coalesce((d ->> 'rest')::boolean, false))
      returning id into v_day;
      i := 0;
      for e in select value from jsonb_array_elements(coalesce(d -> 'exercises', '[]'::jsonb)) loop
        insert into public.exercises (plan_day_id, name, kind, sets, target, fields, description, position)
        values (v_day, left(e ->> 'name', 80), e ->> 'kind', (e ->> 'sets')::integer, left(coalesce(e ->> 'target', ''), 120),
                array(select jsonb_array_elements_text(coalesce(e -> 'fields', '[]'::jsonb))),
                left(coalesce(e ->> 'description', ''), 240), i);
        i := i + 1;
      end loop;
    end loop;
  end if;

  insert into public.ai_plan_sessions (user_id, accepted_plan_at, updated_at)
  values (v_uid, now(), now())
  on conflict (user_id) do update
    set accepted_plan_at = coalesce(ai_plan_sessions.accepted_plan_at, now()), updated_at = now();
  perform private.log_audit(v_uid, 'ai_plan_accepted', v_uid, '{}'::jsonb);
end $$;
revoke all on function public.mark_ai_plan_accepted(text) from public, anon;
grant execute on function public.mark_ai_plan_accepted(text) to authenticated, service_role;
