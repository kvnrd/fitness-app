-- Phase 3 / age screen band + signup with terms acceptance.
--  * screen_age also returns the band ('16_17' | '18_plus') WHEN ELIGIBLE, so the client can route the
--    parent flow. An ineligible answer is still just {"eligible": false} (no threshold, no band).
--    Still stores nothing personal (only the per-day aggregate count).
--  * complete_signup records the Terms acceptance as a consent_events row (kind 'terms', grantor self,
--    version, timestamp, optional policy_doc_hash) and, separately, the Privacy Policy acceptance (kind
--    'privacy_policy', version + policy_doc_hash, both REQUIRED). Neither creates a consents row: they are
--    acceptance records, not revocable permissions. There is no Terms document yet, so its hash is optional.
--  * consents.kind gains 'risk_notice' and 'terms'. Both are deliberately NOT accepted by
--    record_consent / revoke_consent (private.consent_target keeps its closed list), so neither can be
--    switched off through the generic consent API. 'risk_notice' is written only by
--    submit_privacy_safety and the parent-accept functions; 'terms' / 'privacy_policy' events only by signup / parent-accept.

-- Counsel: consent logs record the policy version AND the SHA-256 of the policy document itself
-- (policy_doc_hash), next to text_hash (the exact on-screen switch text).
alter table public.consents       add column policy_doc_hash text check (policy_doc_hash is null or policy_doc_hash ~ '^[0-9a-f]{64}$');
alter table public.consent_events add column policy_doc_hash text check (policy_doc_hash is null or policy_doc_hash ~ '^[0-9a-f]{64}$');

alter table public.consents drop constraint consents_kind_check;
alter table public.consents add constraint consents_kind_check
  check (kind in ('health_data','ai_vendor','coach_sharing','parental','risk_notice','terms'));

-- ------------------------------------------------------------------ neutral age screen (anon)
create or replace function public.screen_age(p_birth_date date, p_store_lower integer default null,
  p_store_upper integer default null, p_store_source text default null)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare d record;
begin
  select * into d from private.derive_age(p_birth_date, p_store_lower, p_store_upper, p_store_source);
  if not d.eligible then
    perform private.count_rejection('screen');
    return jsonb_build_object('eligible', false);
  end if;
  return jsonb_build_object('eligible', true, 'band', d.age_band);
end $$;

-- ------------------------------------------------------------------ signup
-- p_terms_version, p_privacy_version and p_privacy_hash are required in practice (missing / malformed
-- raises terms_required) but sit last with defaults because Postgres cannot put a required parameter
-- after defaulted ones; the client calls with named arguments. p_terms_hash is optional.
drop function public.complete_signup(date, text, integer, integer, text);
create or replace function public.complete_signup(p_birth_date date, p_display_name text default null,
  p_store_lower integer default null, p_store_upper integer default null, p_store_source text default null,
  p_terms_version text default null, p_terms_hash text default null,
  p_privacy_version text default null, p_privacy_hash text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_name text := nullif(btrim(p_display_name), '');
  v_terms text := btrim(p_terms_version);
  v_priv text := btrim(p_privacy_version);
  d record;
  v_minor boolean;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- Checked first: an existing account can never be deleted through this function.
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'already_signed_up' using errcode = '23505';
  end if;
  select * into d from private.derive_age(p_birth_date, p_store_lower, p_store_upper, p_store_source);
  if not d.eligible then
    -- Counsel Q4: delete the auth user (and its email) in the SAME request; return so the delete commits.
    delete from auth.users where id = v_uid;
    perform private.count_rejection('signup');
    return jsonb_build_object('eligible', false);
  end if;
  if v_terms is null or length(v_terms) not between 1 and 64
     or (p_terms_hash is not null and p_terms_hash !~ '^[0-9a-f]{64}$')
     or v_priv is null or length(v_priv) not between 1 and 64
     or p_privacy_hash is null or p_privacy_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'terms_required' using errcode = '22023';
  end if;
  if v_name is not null and length(v_name) > 80 then raise exception 'invalid_display_name' using errcode = '22023'; end if;

  insert into public.profiles (id, display_name, adult_on, age_band, age_source, store_signal, age_verified_at)
  values (v_uid, v_name, d.adult_on, d.age_band, d.age_source, d.store_signal, now())
  returning is_minor into v_minor;
  insert into public.user_roles (user_id, role) values (v_uid, 'athlete');   -- minors stay athlete
  -- [ATTORNEY] acceptance of the Terms and of the Privacy Policy: two events, each version + document hash.
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, policy_doc_hash, actor_user_id)
  values (v_uid, 'terms', 'self', true, v_terms, p_terms_hash, v_uid),
         (v_uid, 'privacy_policy', 'self', true, v_priv, p_privacy_hash, v_uid);
  perform private.log_audit(v_uid, 'signup_completed', v_uid, jsonb_build_object('is_minor', v_minor));
  return jsonb_build_object('eligible', true, 'is_minor', v_minor, 'onboarded', app.is_minor_onboarded(v_uid));
end $$;

-- ------------------------------------------------------------------ grants
revoke all on function public.screen_age(date, integer, integer, text),
  public.complete_signup(date, text, integer, integer, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.screen_age(date, integer, integer, text) to anon, authenticated, service_role;
grant execute on function public.complete_signup(date, text, integer, integer, text, text, text, text, text) to authenticated, service_role;
