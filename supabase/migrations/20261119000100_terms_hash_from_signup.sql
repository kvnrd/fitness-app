-- Signup and parent-invite acceptance store the Terms hash in consent_events.policy_doc_hash (Phase 3), while
-- accept_terms stores it in text_hash (Phase 2b). latest_terms_for read only text_hash, so a brand-new account's
-- signup acceptance came back with no hash and the app sent every new user to "accept the updated terms", and
-- Accept looped. Read either column. No legal text or hash changes.

create or replace function private.latest_terms_for(p_uid uuid)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare r record;
begin
  if p_uid is null then return null; end if;
  -- Own acceptance, or a parent's acceptance that references this account (16–17).
  -- Prefer the newest row. When at ties (now() can be transaction-stable), the identity id wins.
  select e.policy_version as version, coalesce(e.text_hash, e.policy_doc_hash) as hash, e.at
    into r
    from public.consent_events e
   where e.kind = 'terms' and e.granted
     and (e.user_id = p_uid or e.subject_user_id = p_uid)
   order by e.at desc, e.id desc
   limit 1;
  if not found then return null; end if;
  return jsonb_build_object(
    'version', r.version,
    'hash', r.hash,
    'at', r.at,
    'pre_production', r.version ~* 'draft|placeholder'
  );
end $$;

revoke all on function private.latest_terms_for(uuid) from public, anon, authenticated;
