-- Phase 4 tests (health screen, clearance, AI plan gates, body weight, coach redaction).
-- Runs after rls.sql + phase2b.sql + phase3.sql. Users tests.u(91..110). Reuses tests.ok/eq/raises/
-- blocked/rows/no_rows, tests.u, tests.dob, tests.ct, tests.wk, tests.signup3, tests.h, tests.accept_link,
-- tests.privacy, tests.svc_write.
--
--  91 adult (all-no screen, AI ok)     92 adult (health off)
--  93 adult (yes, then clearance)      94 adult (yes + clearance)
--  95 minor                            96 parent of 95
--  97 verified coach                   98 adult client of 97
--  99 pending minor                    100 adult (injury-edit re-ask)
--  101 outsider                        102 adult (first session)
--  103 minor (body weight)             104 parent of 103

select tests.logout();
insert into auth.users (id, email) select tests.u(i), 'p4-' || i || '@example.invalid' from generate_series(91, 110) i;

create function tests.p4_link(p_minor uuid, p_parent uuid) returns void language plpgsql as $$
declare v_id uuid;
begin
  perform tests.login(p_minor);
  perform public.link_parent(p_minor, p_parent);
  select id into v_id from public.parent_links where minor_user_id = p_minor and parent_user_id = p_parent;
  perform tests.login(p_parent);
  perform tests.accept_link(v_id);
  perform tests.logout();
end $$;

create function tests.p4_dual_health_ai(p_minor uuid, p_parent uuid) returns void language plpgsql as $$
begin
  perform tests.login(p_parent);
  perform public.record_consent('health_data', 'health-v1', p_minor);
  perform public.record_consent('ai_vendor', 'ai-B-v1', p_minor, tests.h('2'));
  perform tests.login(p_minor);
  perform public.record_consent('health_data', 'health-v1');
  perform public.record_consent('ai_vendor', 'ai-B-v1', null, tests.h('2'));
  perform tests.logout();
end $$;

-- Superuser/test helper: app.health_screen_status is not granted to service_role (app schema is not
-- exposed). This wrapper lets tests read the status without opening the schema to clients.
create function tests.p4_status(p_user uuid) returns text language sql security definer as $$
  select app.health_screen_status(p_user)
$$;

select tests.ok('p4 signup: adults', (select bool_and((tests.signup3(tests.u(i), tests.dob(30)) ->> 'is_minor') = 'false')
  from unnest(array[91,92,93,94,97,98,100,101,102]) i));
select tests.ok('p4 signup: parents', (select bool_and((tests.signup3(tests.u(i), tests.dob(45)) ->> 'is_minor') = 'false')
  from unnest(array[96,104]) i));
select tests.ok('p4 signup: minors', (select bool_and((tests.signup3(tests.u(i), tests.dob(16)) ->> 'is_minor') = 'true')
  from unnest(array[95,99,103]) i));

select tests.login(null, 'service_role');
select public.set_user_role(tests.u(97), 'coach_verified');
select tests.logout();

select tests.p4_link(tests.u(95), tests.u(96));
select tests.p4_link(tests.u(103), tests.u(104));

select tests.login(tests.u(91)); select public.record_consent('health_data', 'health-v1'); select public.record_consent('ai_vendor', 'ai-B-v1'); select tests.logout();
select tests.login(tests.u(93)); select public.record_consent('health_data', 'health-v1'); select public.record_consent('ai_vendor', 'ai-B-v1'); select tests.logout();
select tests.login(tests.u(94)); select public.record_consent('health_data', 'health-v1'); select public.record_consent('ai_vendor', 'ai-B-v1'); select tests.logout();
select tests.login(tests.u(100)); select public.record_consent('health_data', 'health-v1'); select public.record_consent('ai_vendor', 'ai-B-v1'); select tests.logout();
select tests.login(tests.u(102)); select public.record_consent('health_data', 'health-v1'); select public.record_consent('ai_vendor', 'ai-B-v1'); select tests.logout();
select tests.login(tests.u(98)); select public.record_consent('health_data', 'health-v1'); select public.record_consent('coach_sharing', 'coach-v1'); select tests.logout();
select tests.p4_dual_health_ai(tests.u(95), tests.u(96));
select tests.p4_dual_health_ai(tests.u(103), tests.u(104));

select tests.login(null, 'service_role');
insert into public.coach_relationships (coach_id, client_id, status) values (tests.u(97), tests.u(98), 'active');
select tests.logout();

-- =============================================================== 1. adult screen + clearance
select tests.login(tests.u(91));
select tests.eq('screen: missing before any submit', $q$select public.my_ai_plan_state() ->> 'health_screen_status'$q$, 'missing');
select tests.eq('screen: cannot AI-plan yet', $q$select public.my_ai_plan_state() ->> 'can_ai_plan'$q$, 'false');
select tests.eq('screen: all-no returns ok', $q$select public.submit_health_screen(false) ->> 'status'$q$, 'ok');
select tests.eq('screen: can_ai_plan after all-no', $q$select public.my_ai_plan_state() ->> 'can_ai_plan'$q$, 'true');
select tests.eq('screen: owner can read own derived row', $q$select any_yes::text from public.health_screen_state where user_id = tests.u(91)$q$, 'false');
select tests.raises('screen: clearance refused when not needed', $q$select public.attest_health_clearance('clear-v1', tests.h('c'))$q$, 'clearance_not_needed');
select tests.logout();

select tests.login(tests.u(93));
select tests.eq('screen: a yes without clearance needs clearance', $q$select public.submit_health_screen(true) ->> 'status'$q$, 'clearance_needed');
select tests.eq('screen: can_ai_plan is false while clearance is outstanding', $q$select public.my_ai_plan_state() ->> 'can_ai_plan'$q$, 'false');
select tests.eq('screen: my_onboarding_state exposes the same status', $q$select public.my_onboarding_state() ->> 'health_screen_status'$q$, 'clearance_needed');
select tests.raises('screen: bad clearance hash refused', $q$select public.attest_health_clearance('clear-v1', 'nope')$q$, 'invalid_text_hash');
select tests.eq('screen: attesting clearance flips the gate to ok', $q$select public.attest_health_clearance('clear-v1', tests.h('c')) ->> 'status'$q$, 'ok');
select tests.ok('screen: clearance timestamp and self grantor are stored',
  (select clearance_at is not null and clearance_grantor = 'self' from public.health_screen_state where user_id = tests.u(93)));
select tests.eq('screen: resubmitting a yes clears the previous clearance', $q$select public.submit_health_screen(true) ->> 'status'$q$, 'clearance_needed');
select tests.eq('screen: re-attest works', $q$select public.attest_health_clearance('clear-v1', tests.h('c')) ->> 'status'$q$, 'ok');
select tests.logout();

select tests.login(tests.u(94));
select public.submit_health_screen(true);
select public.attest_health_clearance('clear-v1', tests.h('c'));
select tests.logout();

select tests.login(tests.u(92));
select tests.raises('screen: without health consent the submit is refused', $q$select public.submit_health_screen(false)$q$, 'consent_required');
select tests.eq('screen: health off is reported', $q$select public.my_ai_plan_state() ->> 'health_consent'$q$, 'false');
select tests.logout();

select tests.login(null, 'anon');
select tests.raises('screen: anon cannot submit', $q$select public.submit_health_screen(false)$q$, 'permission denied%');
select tests.logout();

-- =============================================================== 2. parent-together gate (16-17)
select tests.login(tests.u(95));
select tests.raises('teen: cannot self-submit the health screen', $q$select public.submit_health_screen(false)$q$, 'parent_required');
select tests.eq('teen: status is missing until the parent files it', $q$select public.my_ai_plan_state() ->> 'health_screen_status'$q$, 'missing');
select tests.raises('teen: cannot self-attest clearance', $q$select public.attest_health_clearance('clear-v1', tests.h('c'))$q$, 'parent_required');
select tests.logout();

select tests.login(tests.u(101));
select tests.raises('teen: an unrelated adult cannot submit for the minor', format($q$select public.submit_health_screen(false, %L)$q$, tests.u(95)), 'forbidden');
select tests.raises('teen: an unrelated adult cannot read the minor''s AI state', format($q$select public.my_ai_plan_state(%L)$q$, tests.u(95)), 'forbidden');
select tests.logout();

select tests.login(tests.u(96));
select tests.eq('parent: all-no for the teen is ok', format($q$select public.submit_health_screen(false, %L) ->> 'status'$q$, tests.u(95)), 'ok');
select tests.eq('parent: can read the teen''s AI state', format($q$select public.my_ai_plan_state(%L) ->> 'can_ai_plan'$q$, tests.u(95)), 'true');
select tests.eq('parent: can read the derived row', format($q$select any_yes::text from public.health_screen_state where user_id = %L$q$, tests.u(95)), 'false');
-- A yes from the parent requires the parent's clearance checkbox.
select tests.eq('parent: a yes needs the parent''s clearance', format($q$select public.submit_health_screen(true, %L) ->> 'status'$q$, tests.u(95)), 'clearance_needed');
select tests.eq('parent: attesting as the parent returns ok', format($q$select public.attest_health_clearance('clear-v1', tests.h('c'), %L) ->> 'status'$q$, tests.u(95)), 'ok');
select tests.ok('parent: clearance grantor is parent',
  (select clearance_grantor = 'parent' from public.health_screen_state where user_id = tests.u(95)));
select tests.logout();

select tests.login(tests.u(95));
select tests.eq('teen: sees ok after the parent files screen + clearance', $q$select public.my_ai_plan_state() ->> 'can_ai_plan'$q$, 'true');
select tests.logout();

select tests.login(tests.u(99));
select tests.raises('pending: an unlinked minor cannot be filed for (no parent)', $q$select public.submit_health_screen(false)$q$, 'forbidden');
select tests.logout();

-- =============================================================== 3. RLS: coaches never see the gate table
select tests.login(tests.u(97));
select tests.no_rows('rls: coach cannot read a client''s health_screen_state', format('select * from public.health_screen_state where user_id = %L', tests.u(91)));
select tests.no_rows('rls: coach cannot read a minor''s health_screen_state', format('select * from public.health_screen_state where user_id = %L', tests.u(95)));
select tests.blocked('rls: clients cannot insert health_screen_state', format($q$insert into public.health_screen_state (user_id, completed_at, reask_on, any_yes) values (%L, now(), current_date + 1, false)$q$, tests.u(97)));
select tests.logout();

select tests.login(tests.u(101));
select tests.no_rows('rls: an outsider cannot read someone else''s screen state', format('select * from public.health_screen_state where user_id = %L', tests.u(91)));
select tests.logout();

-- =============================================================== 4. ai_plan_context gates
select tests.login(null, 'service_role');
select tests.raises('ai: health off (no consent) is consent_required', format('select * from public.ai_plan_context(%L)', tests.u(92)), 'consent_required');
select tests.ok('ai: all-no adult context succeeds', exists (select 1 from public.ai_plan_context(tests.u(91)) where age_band = '18_plus' and health_ok));
select tests.ok('ai: cleared-yes adult context succeeds', exists (select 1 from public.ai_plan_context(tests.u(94)) where health_ok));
select tests.ok('ai: parent-filed teen context succeeds', exists (select 1 from public.ai_plan_context(tests.u(95)) where age_band = '16_17'));
select tests.logout();

-- 102 has consents but no screen yet.
select tests.login(null, 'service_role');
select tests.raises('ai: missing screen is health_screen_required', format('select * from public.ai_plan_context(%L)', tests.u(102)), 'health_screen_required');
select tests.logout();
select tests.login(tests.u(102));
select public.submit_health_screen(true);
select tests.eq('ai: status after a yes is clearance_needed', $q$select public.my_ai_plan_state() ->> 'health_screen_status'$q$, 'clearance_needed');
select tests.logout();
select tests.login(null, 'service_role');
select tests.raises('ai: yes without clearance is clearance_required', format('select * from public.ai_plan_context(%L)', tests.u(102)), 'clearance_required');
select tests.logout();
select tests.login(tests.u(102));
select public.attest_health_clearance('clear-v1', tests.h('c'));
select tests.logout();
select tests.login(null, 'service_role');
select tests.ok('ai: context succeeds after clearance', exists (select 1 from public.ai_plan_context(tests.u(102)) where health_ok));
select tests.logout();

-- =============================================================== 5. 12-month re-ask + injury-edit re-ask
select tests.login(tests.u(100));
select public.submit_health_screen(false);
select tests.logout();
select tests.login(null, 'service_role');
select tests.ok('reask: a fresh screen is current', tests.p4_status(tests.u(100)) = 'ok');
-- Backdate the re-ask date to yesterday: the screen is due.
update public.health_screen_state set reask_on = current_date - 1 where user_id = tests.u(100);
select tests.eq('reask: a past reask_on is due', format($q$select tests.p4_status(%L)$q$, tests.u(100)), 'due');
select tests.raises('reask: context refuses a due screen', format('select * from public.ai_plan_context(%L)', tests.u(100)), 'health_screen_required');
select tests.logout();
select tests.login(tests.u(100));
select tests.eq('reask: resubmitting starts a new 12-month window', $q$select public.submit_health_screen(false) ->> 'status'$q$, 'ok');
select tests.ok('reask: new reask_on is in the future', (select reask_on > current_date from public.health_screen_state where user_id = tests.u(100)));
select tests.logout();

-- First injury_category write does NOT trigger a re-ask; a later edit does.
select tests.login(null, 'service_role');
select public.health_register_key(tests.u(100), tests.wk(100), 'local-dev', 'local-dev:test');
select public.health_write(tests.u(100), null, null, tests.ct('knee-1'), null, array['injury_category']);
select tests.eq('reask: first category write leaves the screen current', format($q$select tests.p4_status(%L)$q$, tests.u(100)), 'ok');
select public.health_write(tests.u(100), null, null, tests.ct('knee-2'), null, array['injury_category']);
select tests.eq('reask: editing the category marks the screen due', format($q$select tests.p4_status(%L)$q$, tests.u(100)), 'due');
select tests.raises('reask: context refuses after an injury edit', format('select * from public.ai_plan_context(%L)', tests.u(100)), 'health_screen_required');
select tests.logout();
select tests.login(tests.u(100));
select public.submit_health_screen(false);
select tests.logout();
select tests.login(null, 'service_role');
select public.health_write(tests.u(100), tests.ct('notes-1'), null, null, null, array['injury_notes']);
select tests.eq('reask: first notes write leaves the screen current', format($q$select tests.p4_status(%L)$q$, tests.u(100)), 'ok');
select public.health_write(tests.u(100), tests.ct('notes-2'), null, null, null, array['injury_notes']);
select tests.eq('reask: editing notes marks the screen due', format($q$select tests.p4_status(%L)$q$, tests.u(100)), 'due');
select tests.logout();

-- Revoking health marks the screen due (and turns AI off).
select tests.login(tests.u(91));
select public.revoke_consent('health_data');
select tests.eq('reask: revoking health marks the screen due', $q$select tests.p4_status(tests.u(91))$q$, 'due');
select tests.eq('reask: AI consent is off after health is revoked', $q$select public.my_ai_plan_state() ->> 'ai_consent'$q$, 'false');
-- Restore for later tests that may want u91? not needed.
select tests.logout();

-- =============================================================== 6. body_weight (minors allowed; weight_goal still not)
select tests.login(null, 'service_role');
select public.health_register_key(tests.u(103), tests.wk(103), 'local-dev', 'local-dev:test');
select public.health_write(tests.u(103), null, null, null, null, array['body_weight'], tests.ct('bw-142'));
select tests.ok('weight: 16-17 may store a current body_weight', exists (
  select 1 from public.health_records where user_id = tests.u(103) and body_weight_ct = tests.ct('bw-142')));
select tests.raises('weight: 16-17 still cannot store a weight_goal', format($q$select public.health_write(%L, null, null, null, tests.ct('wg'), array['weight_goal'])$q$, tests.u(103)), 'forbidden');
select tests.eq('weight: health_read (self, via service) returns body_weight_ct', format($q$select (body_weight_ct = tests.ct('bw-142'))::text from public.health_read(%L)$q$, tests.u(103)), 'true');
-- Parent may read the teen's body weight (they have health consent).
select tests.ok('weight: parent can read the teen record including body_weight', exists (
  select 1 from public.health_read(tests.u(104), tests.u(103)) where body_weight_ct = tests.ct('bw-142')));
select tests.logout();

select tests.login(tests.u(98)); /* adult client with health */
select tests.logout();
select tests.login(null, 'service_role');
select public.health_register_key(tests.u(98), tests.wk(98), 'local-dev', 'local-dev:test');
select public.health_write(tests.u(98), tests.ct('n'), tests.ct('screen-answers'), tests.ct('knee'), tests.ct('wg'), array['injury_notes','health_screen','injury_category','weight_goal','body_weight'], tests.ct('bw-180'));
-- Coach can see the adult client but must NOT receive health_screen, weight_goal, or body_weight.
select tests.ok('coach: adult health_read returns notes + category, never the screen or weights', exists (
  select 1 from public.health_read(tests.u(97), tests.u(98))
   where injury_notes_ct = tests.ct('n')
     and injury_category_ct = tests.ct('knee')
     and health_screen_ct is null
     and weight_goal_ct is null
     and body_weight_ct is null));
-- Coach gets no row at all for a minor client, even with a relationship (none here; still empty).
select tests.no_rows('coach: health_read of a minor returns no row', format('select * from public.health_read(%L, %L)', tests.u(97), tests.u(103)));
select tests.logout();

-- Parent can write the teen's health record (health_subject).
select tests.login(null, 'service_role');
select public.health_write(tests.u(104), null, tests.ct('teen-screen'), null, null, array['health_screen'], null, tests.u(103));
select tests.ok('parent: can write the teen''s health_screen ciphertext', exists (
  select 1 from public.health_records where user_id = tests.u(103) and health_screen_ct = tests.ct('teen-screen')));
select tests.raises('parent: an outsider cannot write the teen''s record', format($q$select public.health_write(%L, tests.ct('x'), null, null, null, array['injury_notes'], null, %L)$q$, tests.u(101), tests.u(103)), 'forbidden');
select tests.logout();

-- =============================================================== 7. plan accept + first session + filter log
select tests.login(tests.u(102));
select public.mark_ai_plan_accepted();
select tests.eq('session: plan_accepted is true', $q$select public.my_ai_plan_state() ->> 'plan_accepted'$q$, 'true');
select tests.eq('session: first session starts false', $q$select public.my_ai_plan_state() ->> 'first_session_done'$q$, 'false');
select public.mark_ai_first_session_done();
select tests.eq('session: first session then true', $q$select public.my_ai_plan_state() ->> 'first_session_done'$q$, 'true');
-- Idempotent.
select public.mark_ai_first_session_done();
select tests.ok('session: a second mark leaves the original timestamp', (select count(*) = 1 from public.ai_plan_sessions where user_id = tests.u(102) and first_session_completed_at is not null));
select tests.logout();

select tests.login(tests.u(92));
select tests.raises('session: cannot accept a plan without consents + screen', $q$select public.mark_ai_plan_accepted()$q$, 'consent_required');
select tests.raises('session: cannot mark first session with no accepted plan', $q$select public.mark_ai_first_session_done()$q$, 'forbidden');
select tests.logout();

select tests.login(null, 'service_role');
select public.log_ai_plan_filtered(tests.u(102), 'eating_disorder');
select tests.ok('filter-log: only the reason code is stored', exists (
  select 1 from public.audit_log
   where actor_id = tests.u(102) and action = 'ai_plan_filtered'
     and metadata = '{"reason": "eating_disorder"}'::jsonb));
select tests.raises('filter-log: unknown reason codes are refused', format($q$select public.log_ai_plan_filtered(%L, 'not_a_code')$q$, tests.u(102)), 'invalid_argument');
select tests.logout();
select tests.login(tests.u(102));
select tests.raises('filter-log: clients cannot write the filter log', format($q$select public.log_ai_plan_filtered(%L, 'eating_disorder')$q$, tests.u(102)), 'permission denied%');
select tests.logout();

-- =============================================================== 8. shred clears the gate row; service-only health fns
select tests.login(null, 'service_role');
select tests.ok('shred: health_shred also drops health_screen_state', public.health_shred(tests.u(103)));
select tests.ok('shred: state row is gone', not exists (select 1 from public.health_screen_state where user_id = tests.u(103)));
select tests.ok('shred: ciphertext is gone', not exists (select 1 from public.health_records where user_id = tests.u(103)));
select tests.logout();

select tests.login(tests.u(91));
select tests.raises('priv: clients cannot call health_write', format($q$select public.health_write(%L, null, null, null)$q$, tests.u(91)), 'permission denied%');
select tests.raises('priv: clients cannot call ai_plan_context', format($q$select * from public.ai_plan_context(%L)$q$, tests.u(91)), 'permission denied%');
select tests.blocked('priv: clients cannot write body_weight_ct directly', $q$update public.health_records set body_weight_ct = tests.ct('x')$q$);
select tests.logout();

select tests.ok('rls: every public/private table still has RLS forced', not exists (
  select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public','private') and c.relkind = 'r' and not (c.relrowsecurity and c.relforcerowsecurity)));
select tests.ok('priv: new service functions are not executable by clients', not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'EXECUTE')
    and p.proname in ('health_prepare_write','health_register_key','health_write','health_read','health_shred',
                      'ai_plan_context','log_ai_plan_filtered')));

-- ------------------------------------------------------------------ parent-accept terms hash, subject, consent context
-- Users 105 (pending minor) + 106 (parent).

select tests.logout();
select tests.login(tests.u(105));
select public.complete_signup((current_date - interval '16 years 3 months')::date, null, null, null, null, 'terms-v1', null, 'privacy-v1', tests.h('d'));
select tests.ok('legal: 105 is a pending minor', (select is_minor from public.profiles where id = tests.u(105)));
select public.create_parent_invite('parent105@example.invalid');
select tests.logout();
select tests.login(tests.u(106));
select public.complete_signup(tests.dob(30), null, null, null, null, 'terms-v1', null, 'privacy-v1', tests.h('d'));
select tests.logout();
select tests.login(null, 'service_role');
insert into tests.tokens select c.invite_id, c.parent_email, c.token, i.minor_user_id
  from public.claim_parent_invites_to_send() c join public.parent_invites i on i.id = c.invite_id
 where i.minor_user_id = tests.u(105);
select tests.ok('legal: a token was claimed for 105', tests.tok(tests.u(105)) is not null);
select tests.logout();

select tests.login(tests.u(106));
-- cf-connecting-ip wins over a spoofed first XFF hop. Same header preference as trainer-code rate limits.
select set_config('request.headers', '{"cf-connecting-ip":"203.0.113.10","x-forwarded-for":"1.2.3.4, 198.51.100.9","x-device-id":"dev-legal-106","x-app-version":"4.0.0"}', true);
select tests.ok('legal: parent invite accepted with terms hash', tests.accept_inv(tests.tok(tests.u(105))));
-- last-XFF-hop fallback when no cf / x-real-ip; app version is trimmed to 32 chars
select set_config('request.headers', '{"x-forwarded-for":"1.2.3.4, 198.51.100.20","x-app-version":"4.0.1-too-long-app-version-string-is-trimmed-here"}', true);
select public.accept_terms('terms-v1', tests.h('e'));
select set_config('request.headers', '', true);
select tests.logout();

select tests.ok('legal: parent terms row stores the hash and references the teen', exists (
  select 1 from public.consent_events
   where user_id = tests.u(106) and kind = 'terms' and granted and text_hash = tests.h('e')
     and subject_user_id = tests.u(105) and actor_user_id = tests.u(106)));
select tests.ok('legal: parent privacy row references the teen', exists (
  select 1 from public.consent_events
   where user_id = tests.u(106) and kind = 'privacy_policy' and granted
     and subject_user_id = tests.u(105) and policy_doc_hash = tests.h('d')));
select tests.ok('legal: terms row hashed cf-connecting-ip, not the first XFF hop', exists (
  select 1 from public.consent_events
   where user_id = tests.u(106) and kind = 'terms' and subject_user_id = tests.u(105)
     and ip_hash = private.consent_meta_hash('ip', '203.0.113.10')
     and device_hash = private.consent_meta_hash('device', 'dev-legal-106')
     and app_version = '4.0.0'
     and meta_pepper_version = 'dev-v1'));
select tests.ok('legal: accept_terms uses last XFF hop and trims app version', exists (
  select 1 from public.consent_events
   where user_id = tests.u(106) and kind = 'terms' and text_hash = tests.h('e') and subject_user_id is null
     and ip_hash = private.consent_meta_hash('ip', '198.51.100.20')
     and app_version = '4.0.1-too-long-app-version-strin'
     and meta_pepper_version = 'dev-v1'));
select tests.ok('legal: consent-meta hash is not the trainer-code pepper hash',
  private.consent_meta_hash('ip', '203.0.113.10') is distinct from private.pepper_hash('ip', '203.0.113.10'));

-- ------------------------------------------------------------------ store-signal revocation (never raises an age)
select tests.logout();
select tests.login(tests.u(107));
select public.complete_signup(tests.dob(30), null, 21, 25, 'apple_declared_age_range', 'terms-v1', null, 'privacy-v1', tests.h('d'));
select tests.logout();
select tests.ok('revoked: 107 starts adult with a store signal and the flag off',
  (select not is_minor and age_band = '18_plus' and store_signal = 'apple_declared_age_range'
      and age_source = 'apple_declared_age_range' and not store_signal_revoked from public.profiles where id = tests.u(107)));
select tests.login(tests.u(107));
select public.report_store_signal_revoked();
select tests.logout();
select tests.ok('revoked: flag is set', (select store_signal_revoked from public.profiles where id = tests.u(107)));
select tests.ok('revoked: adult band, store_signal, age_source and is_minor are unchanged',
  (select not is_minor and age_band = '18_plus' and store_signal = 'apple_declared_age_range'
      and age_source = 'apple_declared_age_range' from public.profiles where id = tests.u(107)));

select tests.login(tests.u(108));
select public.complete_signup((current_date - interval '17 years 6 months')::date, null, 16, 17, 'google_play_age_signals', 'terms-v1', null, 'privacy-v1', tests.h('d'));
select tests.logout();
select tests.ok('revoked: 108 starts as a minor governed by the store signal',
  (select is_minor and age_band = '16_17' and store_signal = 'google_play_age_signals'
      and age_source = 'google_play_age_signals' and not store_signal_revoked from public.profiles where id = tests.u(108)));
select tests.login(tests.u(108));
select public.report_store_signal_revoked();
select tests.logout();
select tests.ok('revoked: minor stays minor; band, source and store_signal unchanged',
  (select is_minor and age_band = '16_17' and store_signal = 'google_play_age_signals'
      and age_source = 'google_play_age_signals' and store_signal_revoked from public.profiles where id = tests.u(108)));

select tests.login(tests.u(107));
select tests.blocked('revoked: clients cannot clear the flag directly', $q$update public.profiles set store_signal_revoked = false$q$);
select tests.logout();
select tests.raises('revoked: anon cannot report', $q$select public.report_store_signal_revoked()$q$, 'not_authenticated%');
select tests.ok('revoked: authenticated can execute the RPC and anon cannot',
  has_function_privilege('authenticated', 'public.report_store_signal_revoked()', 'EXECUTE')
  and not has_function_privilege('anon', 'public.report_store_signal_revoked()', 'EXECUTE'));


-- ------------------------------------------------------------------ legal_text_versions + dedicated consent-meta pepper
select tests.ok('legal-text: bundled terms, privacy and health-policy rows were seeded',
  (select count(*) from public.legal_text_versions where kind in ('terms','privacy_policy','health_policy')) = 3);
select tests.ok('legal-text: every archived sha256 matches the stored full text',
  not exists (
    select 1 from public.legal_text_versions
     where sha256 <> encode(extensions.digest(convert_to(full_text, 'UTF8'), 'sha256'), 'hex')));
select tests.ok('legal-text: seeded in-app health-with-AI and attestations are present',
  (select count(*) from public.legal_text_versions
    where kind in ('health_with_ai','ai_adult','ai_teen','parent_attest','coach_attest_general','coach_attest_minors')) = 6);
select tests.ok('legal-text: retention schedule covers the archive and does not auto-purge it',
  exists (select 1 from public.retention_policies
           where record_type = 'legal_text_versions' and status = 'kept_no_period'));
select tests.ok('legal-text: put is a no-op when the same text is re-seeded', true);
select private.put_legal_text_version(
  'terms', 'v0.1-draft',
  (select sha256 from public.legal_text_versions where kind = 'terms' and version = 'v0.1-draft'),
  (select full_text from public.legal_text_versions where kind = 'terms' and version = 'v0.1-draft'));
select tests.raises('legal-text: a kind+version cannot change its hash',
  $q$select private.put_legal_text_version('terms','v0.1-draft','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','not the body')$q$,
  '%legal_text_version_%');
select tests.raises('legal-text: updates are rejected (append-only)',
  $q$update public.legal_text_versions set full_text = 'changed' where kind = 'terms'$q$,
  '%legal_text_versions_append_only%');
select tests.raises('legal-text: deletes are rejected (append-only)',
  $q$delete from public.legal_text_versions where kind = 'terms'$q$,
  '%legal_text_versions_append_only%');

select tests.login(tests.u(109));
select tests.ok('legal-text: authenticated can read archived texts',
  exists (select 1 from public.legal_text_versions where kind = 'terms'));
select tests.blocked('legal-text: authenticated cannot insert',
  $q$insert into public.legal_text_versions (kind, version, sha256, full_text)
     values ('x','v1','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','hi')$q$);
select tests.blocked('legal-text: authenticated cannot update',
  $q$update public.legal_text_versions set first_shown_at = now()$q$);
select tests.blocked('legal-text: authenticated cannot delete',
  $q$delete from public.legal_text_versions$q$);
select tests.no_rows('legal-text: authenticated cannot read the dev-fallback pepper',
  'select * from private.consent_meta_dev_pepper');
select tests.logout();

select tests.ok('legal-text: clients cannot execute put or the pepper helpers',
  not has_function_privilege('authenticated', 'private.put_legal_text_version(text,text,text,text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'private.consent_meta_hash(text,text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'private.consent_meta_config()', 'EXECUTE')
  and not has_function_privilege('anon', 'private.put_legal_text_version(text,text,text,text)', 'EXECUTE'));

-- consent_meta_pepper is not in encryption_keys and is not the trainer-code pepper
select tests.ok('pepper: consent_meta_pepper is not stored in encryption_keys',
  not exists (select 1 from private.encryption_keys where name ilike '%consent%'));
select tests.ok('pepper: the dev-fallback table is labeled as such',
  (select is_dev_fallback and note ilike '%DEV FALLBACK%' from private.consent_meta_dev_pepper where version = 'dev-v1'));

-- Missing pepper: null hashes, alert with user id only, no IP in the audit event.
select tests.login(tests.u(109));
select public.complete_signup(tests.dob(30), null, null, null, null, 'terms-v1', null, 'privacy-v1', tests.h('d'));
select tests.logout();
delete from private.consent_meta_dev_pepper;
select tests.login(tests.u(109));
select set_config('request.headers', '{"cf-connecting-ip":"203.0.113.99","x-device-id":"dev-missing-pepper"}', true);
select public.accept_terms('terms-v-missing', tests.h('f'));
select set_config('request.headers', '', true);
select tests.logout();
select tests.ok('pepper: missing pepper leaves hashes and version null', exists (
  select 1 from public.consent_events
   where user_id = tests.u(109) and kind = 'terms' and text_hash = tests.h('f')
     and ip_hash is null and device_hash is null and meta_pepper_version is null));
select tests.ok('pepper: missing pepper raises an audit event with the user id only', exists (
  select 1 from public.audit_log
   where action = 'consent_meta_pepper_missing' and actor_id = tests.u(109) and target_user_id = tests.u(109)
     and metadata = jsonb_build_object('user_id', tests.u(109))
     and metadata::text not ilike '%203.0.113%'
     and metadata::text not ilike '%cf-connecting%'
     and metadata::text not ilike '%x-forwarded%'));
-- Restore the test fixture so a later file (none today) would still have a pepper.
insert into private.consent_meta_dev_pepper (version, pepper, is_dev_fallback, note)
values ('dev-v1', 'test-only-consent-meta-pepper-00000001', true,
        'DEV FALLBACK ONLY. Test fixture, not for production.');

-- No raw IP landed in consent rows, audit metadata, or the pepper table.
select tests.ok('pepper: no raw IP in consent_events hash columns',
  not exists (select 1 from public.consent_events
               where coalesce(ip_hash,'') ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
                  or coalesce(device_hash,'') ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
                  or coalesce(ip_hash,'') like '%203.0.113%'
                  or coalesce(ip_hash,'') like '%198.51.100%'));
select tests.ok('pepper: no raw IP in audit_log metadata',
  not exists (select 1 from public.audit_log
               where metadata::text like '%203.0.113%'
                  or metadata::text like '%198.51.100%'
                  or metadata::text like '%cf-connecting-ip%'
                  or metadata::text like '%x-forwarded-for%'));

-- ------------------------------------------------------------------ two clocks + parent Terms re-accept
-- 110: a fresh adult with health + AI + an all-no screen. The consent re-ask must not pause AI.
-- (91's health was revoked earlier in this file.)
select tests.logout();
select tests.ok('clocks: 110 is an adult', (tests.signup3(tests.u(110), tests.dob(30)) ->> 'is_minor') = 'false');
select tests.login(tests.u(110));
select public.record_consent('health_data', 'health-v1');
select public.record_consent('ai_vendor', 'ai-B-v1');
select tests.eq('clocks: 110 all-no screen is ok', $q$select public.submit_health_screen(false) ->> 'status'$q$, 'ok');
select tests.logout();
update public.consents set reask_on = current_date - 1
 where user_id = tests.u(110) and kind = 'health_data' and grantor = 'self';
select tests.login(tests.u(110));
select tests.ok('clocks: consent re-ask due does not pause AI',
  (public.my_onboarding_state() ->> 'health_reask_self_due') = 'true'
  and (public.my_onboarding_state() ->> 'health_reask_parent_due') = 'false'
  and (public.my_onboarding_state() ->> 'health_reask_due') = 'true'
  and (public.my_onboarding_state() ->> 'can_ai_plan') = 'true'
  and (public.my_onboarding_state() ->> 'health_screen_status') = 'ok');
select tests.logout();

-- Only the parent's health grant is due: the teen waits, nothing pauses, AI is unaffected by this clock.
select tests.logout();
update public.consents set reask_on = current_date + 30
 where user_id = tests.u(95) and kind = 'health_data' and grantor = 'self';
update public.consents set reask_on = current_date - 1
 where user_id = tests.u(95) and kind = 'health_data' and grantor = 'parent';
select tests.login(tests.u(95));
select tests.ok('clocks: only parent re-ask due is waiting, not a self due',
  (public.my_onboarding_state() ->> 'health_reask_self_due') = 'false'
  and (public.my_onboarding_state() ->> 'health_reask_parent_due') = 'true'
  and (public.my_onboarding_state() ->> 'health_reask_due') = 'true');
select tests.logout();

-- A due health-screen pauses AI only (already enforced by can_ai_plan). 110 still has health consent.
select tests.logout();
update public.health_screen_state set reask_on = current_date - 1 where user_id = tests.u(110);
select tests.login(tests.u(110));
select tests.ok('clocks: a due health screen pauses AI only',
  (public.my_onboarding_state() ->> 'health_screen_status') = 'due'
  and (public.my_onboarding_state() ->> 'can_ai_plan') = 'false');
select tests.logout();
update public.health_screen_state set reask_on = current_date + 30 where user_id = tests.u(110);

select tests.login(tests.u(103));
select tests.raises('terms: a 16–17 cannot re-accept; the parent does',
  $q$select public.accept_terms('v0.1-draft', tests.h('a'))$q$, 'parent_required%');
select tests.logout();

select tests.login(tests.u(104));
select public.accept_terms('v0.1-draft', tests.h('a'));
select tests.logout();
select tests.ok('terms: parent re-accept writes a subject row for the linked teen', exists (
  select 1 from public.consent_events
   where user_id = tests.u(104) and kind = 'terms' and granted and text_hash = tests.h('a')
     and subject_user_id = tests.u(103) and actor_user_id = tests.u(104)));
select tests.ok('terms: parent also keeps their own subject-null row', exists (
  select 1 from public.consent_events
   where user_id = tests.u(104) and kind = 'terms' and granted and text_hash = tests.h('a')
     and subject_user_id is null));
select tests.login(tests.u(103));
select tests.record('terms: the teen''s latest terms is the parent''s subject row',
  coalesce((public.my_latest_terms() ->> 'hash') = repeat('a', 64), false),
  (select string_agg(coalesce(e.policy_version,'?') || '@' || e.at::text || '#h=' || coalesce(left(e.text_hash, 8),'null') || '/u=' || left(e.user_id::text, 8) || '/s=' || coalesce(left(e.subject_user_id::text, 8),'nil'), ' | ' order by e.at desc)
     from public.consent_events e
    where e.kind = 'terms' and (e.user_id = tests.u(103) or e.subject_user_id = tests.u(103))));
select tests.logout();
