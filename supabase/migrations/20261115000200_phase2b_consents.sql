-- Phase 2b / consents (Counsel Q2, Q6, Q10, section 12).
--  * Each consent row now has a grantor: 'self' or 'parent'. For a 16-17 user a scope is ON only when
--    BOTH the teen's row and the current active contracting parent's row are granted. Either can turn
--    it off.
--  * The teen's switch is locked (record_consent raises parent_consent_required) until the parent has
--    granted that scope. When the parent revokes, the teen's grant is revoked too, so turning it back
--    on needs both again.
--  * Grants record the policy version AND a SHA-256 of the exact text shown (retention table: "version,
--    text hash, timestamps").

alter table public.consents
  add column grantor   text not null default 'self' check (grantor in ('self','parent')),
  add column text_hash text check (text_hash is null or text_hash ~ '^[0-9a-f]{64}$');
-- Phase 2 rows written by a parent acting for a minor become the parent's rows.
update public.consents set grantor = 'parent'
 where kind = 'parental' or (actor_user_id is not null and actor_user_id <> user_id);
alter table public.consents drop constraint consents_pkey;
alter table public.consents add primary key (user_id, kind, grantor);
alter table public.consents add constraint consents_parental_is_parent_chk check (kind <> 'parental' or grantor = 'parent');

alter table public.consent_events
  add column grantor   text not null default 'self' check (grantor in ('self','parent')),
  add column text_hash text check (text_hash is null or text_hash ~ '^[0-9a-f]{64}$');
update public.consent_events set grantor = 'parent'
 where kind = 'parental' or (actor_user_id is not null and actor_user_id <> user_id);

-- Effective consent. Adults: own row. Minors: own row AND the row of the CURRENT active contracting
-- parent (a former parent's grant does not count). 'parental' is the parent's row only.
create or replace function app.has_consent(p_user uuid, p_kind text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  with parent_ok as (
    select exists (select 1 from public.consents c
                     join public.parent_links l on l.minor_user_id = c.user_id and l.parent_user_id = c.actor_user_id
                    where c.user_id = p_user and c.kind = p_kind and c.grantor = 'parent'
                      and c.granted and c.revoked_at is null
                      and l.status = 'active' and l.is_contracting_party) as ok
  ), self_ok as (
    select exists (select 1 from public.consents c
                    where c.user_id = p_user and c.kind = p_kind and c.grantor = 'self'
                      and c.granted and c.revoked_at is null) as ok
  )
  select case
    when p_kind = 'parental' then (select ok from parent_ok)
    when exists (select 1 from public.profiles p where p.id = p_user and p.is_minor)
      then (select ok from self_ok) and (select ok from parent_ok)
    else (select ok from self_ok)
  end
$$;

drop function public.record_consent(text, text, uuid);
drop function public.revoke_consent(text, uuid);
drop function private.consent_target(text, uuid);

-- Returns who the consent is about and in which capacity the caller acts.
create or replace function private.consent_target(p_kind text, p_for_user uuid, out o_target uuid, out o_grantor text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  o_target := coalesce(p_for_user, v_uid);
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_kind is null or p_kind not in ('health_data','ai_vendor','coach_sharing','parental') then
    raise exception 'invalid_consent_kind' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = o_target and deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if o_target <> v_uid then
    if not app.is_active_parent_of(o_target) then raise exception 'forbidden' using errcode = '42501'; end if;
    o_grantor := 'parent';
  else
    if p_kind = 'parental' then raise exception 'forbidden' using errcode = '42501'; end if;
    o_grantor := 'self';
  end if;
end $$;

create or replace function private.write_consent(p_target uuid, p_kind text, p_grantor text, p_granted boolean,
  p_version text, p_text_hash text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_granted then
    insert into public.consents (user_id, kind, grantor, granted, policy_version, text_hash, granted_at, revoked_at, actor_user_id, updated_at)
    values (p_target, p_kind, p_grantor, true, p_version, p_text_hash, now(), null, auth.uid(), now())
    on conflict (user_id, kind, grantor) do update
      set granted = true, policy_version = excluded.policy_version, text_hash = excluded.text_hash, granted_at = now(),
          revoked_at = null, actor_user_id = auth.uid(), updated_at = now();
  else
    update public.consents set granted = false, revoked_at = now(), actor_user_id = auth.uid(), updated_at = now()
     where user_id = p_target and kind = p_kind and grantor = p_grantor and granted
    returning policy_version, text_hash into p_version, p_text_hash;
    if not found then return; end if;
  end if;
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, actor_user_id)
  values (p_target, p_kind, p_grantor, p_granted, p_version, p_text_hash, auth.uid());
  perform private.log_audit(auth.uid(), case when p_granted then 'consent_granted' else 'consent_revoked' end, p_target,
                            jsonb_build_object('kind', p_kind, 'grantor', p_grantor));
end $$;

create or replace function public.record_consent(p_kind text, p_policy_version text, p_for_user uuid default null,
  p_text_hash text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t record;
begin
  select * into t from private.consent_target(p_kind, p_for_user);
  if p_policy_version is null or length(btrim(p_policy_version)) not between 1 and 64 then
    raise exception 'invalid_policy_version' using errcode = '22023';
  end if;
  if p_text_hash is not null and p_text_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_text_hash' using errcode = '22023';
  end if;
  -- Minor's own switch stays locked until the current parent has granted the same scope (Counsel Q2).
  if t.o_grantor = 'self' and exists (select 1 from public.profiles where id = t.o_target and is_minor) then
    if not exists (select 1 from public.consents c
                     join public.parent_links l on l.minor_user_id = c.user_id and l.parent_user_id = c.actor_user_id
                    where c.user_id = t.o_target and c.kind = p_kind and c.grantor = 'parent'
                      and c.granted and c.revoked_at is null and l.status = 'active' and l.is_contracting_party) then
      raise exception 'parent_consent_required' using errcode = '42501';
    end if;
  end if;
  perform private.write_consent(t.o_target, p_kind, t.o_grantor, true, btrim(p_policy_version), p_text_hash);
end $$;

create or replace function public.revoke_consent(p_kind text, p_for_user uuid default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare t record;
begin
  select * into t from private.consent_target(p_kind, p_for_user);
  perform private.write_consent(t.o_target, p_kind, t.o_grantor, false, null, null);
  -- Parent turning a scope off also turns the teen's switch off (both must turn it on again).
  if t.o_grantor = 'parent' and p_kind <> 'parental' then
    perform private.write_consent(t.o_target, p_kind, 'self', false, null, null);
  end if;
end $$;

revoke all on function public.record_consent(text, text, uuid, text), public.revoke_consent(text, uuid) from public, anon;
grant execute on function public.record_consent(text, text, uuid, text), public.revoke_consent(text, uuid) to authenticated, service_role;
revoke all on function private.consent_target(text, uuid), private.write_consent(uuid, text, text, boolean, text, text) from public, anon, authenticated;
