-- Terms of Service bundled as v0.1-draft. Acceptances of a draft or placeholder version are
-- pre-production and must be repeated when a non-draft version ships. [ATTORNEY]

create or replace function public.my_latest_terms()
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); r record;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select e.policy_version as version, e.text_hash as hash, e.at
    into r
    from public.consent_events e
   where e.user_id = v_uid and e.kind = 'terms' and e.granted
   order by e.at desc
   limit 1;
  if not found then return null; end if;
  return jsonb_build_object(
    'version', r.version,
    'hash', r.hash,
    'at', r.at,
    'pre_production', r.version ~* 'draft|placeholder'
  );
end $$;
revoke all on function public.my_latest_terms() from public, anon;
grant execute on function public.my_latest_terms() to authenticated, service_role;

create or replace function public.accept_terms(p_version text, p_text_hash text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_ver text := btrim(p_version);
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if v_ver is null or length(v_ver) not between 1 and 64 then
    raise exception 'invalid_policy_version' using errcode = '22023';
  end if;
  if p_text_hash is null or p_text_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_text_hash' using errcode = '22023';
  end if;
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, text_hash, actor_user_id)
  values (v_uid, 'terms', 'self', true, v_ver, p_text_hash, v_uid);
  insert into public.consents (user_id, kind, grantor, granted, policy_version, text_hash, granted_at, actor_user_id, updated_at)
  values (v_uid, 'terms', 'self', true, v_ver, p_text_hash, now(), v_uid, now())
  on conflict (user_id, kind, grantor) do update
    set granted = true, policy_version = excluded.policy_version, text_hash = excluded.text_hash,
        granted_at = now(), revoked_at = null, actor_user_id = excluded.actor_user_id, updated_at = now();
end $$;
revoke all on function public.accept_terms(text, text) from public, anon;
grant execute on function public.accept_terms(text, text) to authenticated, service_role;
