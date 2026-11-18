-- Coach Terms v0.1 DRAFT: consent kind + acceptance RPC (same version/hash rules as Terms).
-- Coach onboarding UI is Phase 6; this only records the acceptance.

alter table public.consents drop constraint if exists consents_kind_check;
alter table public.consents add constraint consents_kind_check
  check (kind in ('health_data','ai_vendor','coach_sharing','parental','risk_notice','terms','coach_terms'));

create or replace function public.accept_coach_terms(p_version text, p_text_hash text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_ver text := btrim(p_version);
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- Coaches are adults. A 16–17 cannot accept Coach Terms.
  if exists (select 1 from public.profiles p where p.id = v_uid and p.is_minor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_ver is null or length(v_ver) not between 1 and 64 then
    raise exception 'invalid_policy_version' using errcode = '22023';
  end if;
  if p_text_hash is null or p_text_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_text_hash' using errcode = '22023';
  end if;
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, actor_user_id)
  values (v_uid, 'coach_terms', 'self', true, v_ver, p_text_hash, v_uid);
  insert into public.consents (user_id, kind, grantor, granted, policy_version, text_hash, granted_at, actor_user_id, updated_at)
  values (v_uid, 'coach_terms', 'self', true, v_ver, p_text_hash, now(), v_uid, now())
  on conflict (user_id, kind, grantor) do update
    set granted = true, policy_version = excluded.policy_version, text_hash = excluded.text_hash,
        granted_at = now(), revoked_at = null, actor_user_id = excluded.actor_user_id, updated_at = now();
end $$;

revoke all on function public.accept_coach_terms(text, text) from public, anon;
grant execute on function public.accept_coach_terms(text, text) to authenticated, service_role;
