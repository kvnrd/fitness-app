-- Phase 6 Coach Studio: the nine build rules, Coach Terms before apply,
-- and 3-strike copyright closure.

select tests.logout();
insert into auth.users (id, email)
  select tests.u(i), 'p6-' || i || '@example.invalid' from generate_series(140, 147) i;

select tests.ok('phase6 signup: adults',
  (select bool_and((tests.signup(tests.u(i), tests.dob(32)) ->> 'is_minor') = 'false')
     from unnest(array[140,141,142,145,146]) i));
select tests.ok('phase6 signup: Sam is a minor',
  (tests.signup(tests.u(143), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.p4_link(tests.u(143), tests.u(142));

select tests.login(null, 'service_role');
select public.set_user_role(tests.u(141), 'coach_verified');
select public.set_user_role(tests.u(145), 'coach_verified');
select public.set_coach_nsopw(tests.u(141), 'passed', 'nsopw-test-141');
select public.set_coach_minor_training(tests.u(141), 'training-test-141');
select tests.logout();

-- ------------------------------------------------------------------ 3. deletion calendar (date + int, America/Denver)
select tests.eq('deletion: sample trigger 2026-11-17 reminder',
  $q$select reminder_on::text from app.deletion_schedule(date '2026-11-17')$q$, '2026-12-10');
select tests.eq('deletion: sample due is trigger+30',
  $q$select due_on::text from app.deletion_schedule(date '2026-11-17')$q$, '2026-12-17');
select tests.eq('deletion: sample day 31 pause',
  $q$select pause_on::text from app.deletion_schedule(date '2026-11-17')$q$, '2026-12-18');
select tests.eq('deletion: sample day 45 suspend (Kevin enforcement, not a coach-facing deadline)',
  $q$select suspend_on::text from app.deletion_schedule(date '2026-11-17')$q$, '2027-01-01');
select tests.eq('deletion: DST-boundary trigger 2026-10-25 due is calendar +30, not a timestamptz interval',
  $q$select due_on::text from app.deletion_schedule(date '2026-10-25')$q$, '2026-11-24');

-- End a relationship: access is cut off and the 30-day clock starts.
select tests.login(null, 'service_role');
insert into public.coach_relationships (coach_id, client_id, status, started_at)
values (tests.u(141), tests.u(140), 'active', now());
select tests.logout();
select tests.login(tests.u(140));
select public.end_coach_relationship((select id from public.coach_relationships
  where coach_id = tests.u(141) and client_id = tests.u(140) and status = 'active'));
select tests.eq('deletion: ended relationship is ended',
  $q$select status from public.coach_relationships where coach_id = tests.u(141) and client_id = tests.u(140) order by ended_at desc limit 1$q$,
  'ended');
select tests.ok('deletion: a request is opened on the Denver calendar',
  exists (select 1 from public.coach_deletion_requests r
           where r.coach_id = tests.u(141) and r.client_id = tests.u(140)
             and r.trigger_on = app.today_denver()
             and r.due_on = r.trigger_on + 30
             and r.reminder_on = r.trigger_on + 23
             and r.pause_on = r.trigger_on + 31
             and r.suspend_on = r.trigger_on + 45));
select tests.logout();

-- Confirm requires all seven item answers and the attestation.
select tests.login(tests.u(141));
select tests.raises('deletion: confirm refused without attestation',
  format($q$select public.confirm_client_deletion(%L, '{"a":"Deleted","b":"Deleted","c":"Deleted","d":"Deleted","e":"Deleted","f":"Deleted","g":"None"}'::jsonb, false, 'v1', repeat('a', 64))$q$,
    (select id from public.coach_deletion_requests where client_id = tests.u(140))),
  'attestation_required');
select tests.raises('deletion: confirm refused with six item rows',
  format($q$select public.confirm_client_deletion(%L, '{"a":"Deleted","b":"Deleted","c":"Deleted","d":"Deleted","e":"Deleted","f":"Deleted"}'::jsonb, true, 'v1', repeat('a', 64))$q$,
    (select id from public.coach_deletion_requests where client_id = tests.u(140))),
  'items_incomplete');
select public.confirm_client_deletion(
  (select id from public.coach_deletion_requests where client_id = tests.u(140)),
  '{"notes":"Deleted","plan":"Deleted","photos":"Deleted","video":"Deleted","measurements":"Deleted","files":"Deleted","kept":"None"}'::jsonb,
  true, 'deletion-attest-v1', repeat('a', 64));
select tests.ok('deletion: confirm stores the seven answers and the hash',
  exists (select 1 from public.coach_deletion_requests
           where client_id = tests.u(140) and confirmed_at is not null
             and attestation_hash = repeat('a', 64)
             and jsonb_typeof(items) = 'object'
             and (select count(*) from jsonb_object_keys(items)) = 7));
select tests.logout();

-- Day 23 / 31 / 45 jobs against a second open request with fixed dates.
select tests.login(null, 'service_role');
insert into public.coach_relationships (coach_id, client_id, status, started_at, ended_at)
values (tests.u(145), tests.u(140), 'ended', now() - interval '40 days', now() - interval '2 days');
select private.open_deletion_request(
  (select id from public.coach_relationships where coach_id = tests.u(145) and client_id = tests.u(140) and status = 'ended'),
  date '2026-11-17');
select tests.eq('jobs: before the reminder day nothing is stamped',
  format($q$select (reminder_sent_at is null and pause_applied_at is null and suspend_applied_at is null)::text
            from public.coach_deletion_requests where coach_id = %L$q$, tests.u(145)),
  'true');
-- A non-admin cannot run the job.
select tests.logout();
select tests.login(tests.u(140));
select tests.raises('jobs: a client cannot process deletion deadlines',
  $q$select public.process_deletion_deadlines(date '2026-12-10')$q$,
  'forbidden');
select tests.logout();
select tests.login(null, 'service_role');
select tests.ok('jobs: day 23 sends the reminder', public.process_deletion_deadlines(date '2026-12-10') >= 1);
select tests.ok('jobs: day 23 stamped the reminder and has not paused yet',
  exists (select 1 from public.coach_deletion_requests where coach_id = tests.u(145) and reminder_sent_at is not null and pause_applied_at is null));
select tests.ok('jobs: day 31 pauses new clients and opens a T&S ticket', public.process_deletion_deadlines(date '2026-12-18') >= 1);
select tests.ok('jobs: day 31 stamped the pause and a T&S ticket',
  exists (select 1 from public.profiles where id = tests.u(145) and new_clients_paused_at is not null)
  and exists (select 1 from public.trust_safety_tickets where coach_id = tests.u(145) and kind = 'deletion_overdue'));
select tests.ok('jobs: day 45 suspends the coach (enforcement, not a product deadline string)', public.process_deletion_deadlines(date '2027-01-01') >= 1);
select tests.ok('jobs: day 45 stamped the suspension',
  exists (select 1 from public.profiles where id = tests.u(145) and coach_suspended_at is not null));
-- Redeem must fail without leaking the pause/suspension.
select tests.logout();
create table tests.p6_codes (label text primary key, code text not null);
grant select, insert on tests.p6_codes to public, authenticated, service_role;
select tests.login(null, 'service_role');
insert into tests.p6_codes (label, code)
  values ('suspended', public.create_trainer_code(25, 30, tests.u(145)) ->> 'code');
select tests.logout();
select tests.login(tests.u(146));
select tests.eq('jobs: redeem of a real code from a suspended coach is false',
  format($q$select public.redeem_trainer_code(%L, 'dev-146')::text$q$, (select code from tests.p6_codes where label = 'suspended')),
  'false');
select tests.ok('jobs: no relationship was created',
  not exists (select 1 from public.coach_relationships where coach_id = tests.u(145) and client_id = tests.u(146) and status in ('pending','active')));
select tests.logout();

-- A live coach can still issue a code that an adult redeems.
select tests.login(null, 'service_role');
insert into tests.p6_codes (label, code)
  values ('live', public.create_trainer_code(25, 30, tests.u(141)) ->> 'code');
select tests.logout();
select tests.login(tests.u(146));
select tests.eq('redeem: a live verified coach still works',
  format($q$select public.redeem_trainer_code(%L, 'dev-146b')::text$q$, (select code from tests.p6_codes where label = 'live')),
  'true');
select tests.logout();

-- ------------------------------------------------------------------ apply requires Coach Terms; never auto-approves
select tests.login(tests.u(146));
-- 146 already redeemed, still an athlete. Apply should require terms first.
-- Wait: after redeem, role is still athlete. Good. But they may still apply.
-- If redeem succeeded, they're a client of 141 and still athlete.
select tests.raises('apply: Coach Terms required before submit',
  $q$select public.apply_for_coach(true, 'coach-attest-general-v1', repeat('e', 64))$q$,
  'coach_terms_required');
select public.accept_coach_terms('coach-terms-v0.1-draft', repeat('c', 64));
select tests.ok('apply: accept_coach_terms logs kind coach_terms',
  exists (select 1 from public.consent_events
           where user_id = tests.u(146) and kind = 'coach_terms' and granted));
select public.apply_for_coach(true, 'coach-attest-general-v1', repeat('e', 64), false, null, null, 'NASM-CPT', 'NASM', current_date + 365);
select tests.eq('apply: leaves the application submitted',
  $q$select status from public.coach_applications where applicant_id = tests.u(146)$q$,
  'submitted');
select tests.eq('apply: role is coach_pending, never auto-verified',
  $q$select role from public.user_roles where user_id = tests.u(146)$q$,
  'coach_pending');
select tests.raises('apply: applicant cannot self-approve',
  format($q$select public.review_coach_application((select id from public.coach_applications where applicant_id = %L), true)$q$, tests.u(146)),
  'forbidden');
select tests.logout();
select tests.login(tests.u(7));
select tests.logout();
create table tests.p6_app as select id from public.coach_applications where applicant_id = tests.u(146);
grant select on tests.p6_app to public, authenticated, service_role;
select tests.login(tests.u(7));
select tests.raises('apply: admin cannot approve before identity passes',
  $q$select public.review_coach_application((select id from tests.p6_app), true)$q$,
  'identity_check_required');
select tests.logout();

-- ------------------------------------------------------------------ flags default off; hash-matching covers photos and demo videos
select tests.eq('flags: DMCA form is off', $q$select app.dmca_form_enabled()::text$q$, 'false');
select tests.eq('flags: hash-matching is off', $q$select app.hash_matching_live()::text$q$, 'false');
select tests.login(tests.u(141));
select tests.raises('hash: clients cannot enqueue',
  format($q$select public.enqueue_hash_match('photo', %L)$q$, tests.u(140)),
  'permission denied%');
select tests.logout();
select tests.login(null, 'service_role');
select tests.eq('hash: enqueue is a no-op while the vendor is off (photo)',
  format($q$select public.enqueue_hash_match('photo', %L)::text$q$, tests.u(140)),
  'false');
select tests.eq('hash: enqueue is a no-op while the vendor is off (demo video)',
  format($q$select public.enqueue_hash_match('demo_video', %L)::text$q$, tests.u(140)),
  'false');
select tests.ok('hash: the vendor queue stays empty while the flag is off',
  not exists (select 1 from private.hash_match_queue));
update private.app_flags set enabled = true where flag_name = 'hash_matching_live';
select tests.ok('hash: when live, a photo enqueues', public.enqueue_hash_match('photo', tests.u(140)));
select tests.ok('hash: when live, a demo video enqueues', public.enqueue_hash_match('demo_video', tests.u(140)));
select tests.eq('hash: both kinds are in the queue', $q$select count(*)::text from private.hash_match_queue$q$, '2');
update private.app_flags set enabled = false where flag_name = 'hash_matching_live';
select tests.logout();

-- ------------------------------------------------------------------ 3-strike close (rolling 12 calendar months, inclusive)
select tests.login(tests.u(141));
select tests.raises('strikes: a coach cannot record a notice',
  format($q$select public.record_copyright_notice(%L, true, date '2026-11-17')$q$, tests.u(141)),
  'forbidden');
select tests.logout();
select tests.login(null, 'service_role');
select public.record_copyright_notice(tests.u(141), true, date '2025-04-30'); -- outside every later 12-month window
select public.record_copyright_notice(tests.u(141), false, date '2026-06-01'); -- not upheld
select public.record_copyright_notice(tests.u(141), true, date '2025-11-17'); -- inclusive start
select public.record_copyright_notice(tests.u(141), true, date '2026-05-01');
select tests.eq('strikes: two upheld in the inclusive 12-month window do not close',
  format($q$select (account_closed_at is null)::text from public.profiles where id = %L$q$, tests.u(141)),
  'true');
select tests.eq('strikes: the stale and the not-upheld notices are outside the count',
  $q$select app.upheld_strikes(tests.u(141), date '2026-11-17')::text$q$,
  '2');
select public.record_copyright_notice(tests.u(141), true, date '2026-11-17');
select tests.ok('strikes: the third upheld notice in 12 months closes the account',
  exists (select 1 from public.profiles where id = tests.u(141) and account_closed_at is not null)
  and exists (select 1 from public.user_roles where user_id = tests.u(141) and role = 'athlete'));
select tests.logout();

-- ------------------------------------------------------------------ 70e: parent approval alone shares nothing
select tests.login(null, 'service_role');
-- 141 was just closed; use a fresh verified coach: reopen 145 is suspended.
-- Promote nobody — mint a new coach 147.
select tests.logout();
select tests.ok('70e signup: coach 147',
  (tests.signup(tests.u(147), tests.dob(34)) ->> 'is_minor') = 'false');
select tests.logout();
select private.upsert_minors_attestation(tests.u(147), null, 'coach-attest-minors-v1', tests.h('8'));
select tests.login(null, 'service_role');
select public.set_user_role(tests.u(147), 'coach_verified');
select public.set_coach_nsopw(tests.u(147), 'passed', 'nsopw-test-147');
select public.set_coach_minor_training(tests.u(147), 'training-test-147');
insert into public.coach_relationships (coach_id, client_id, status, started_at)
values (tests.u(147), tests.u(143), 'active', now());
select tests.logout();

-- Dual coach_sharing grants (parent + teen) would normally open coach_can_see.
-- Start the 70e path with parent approval only, then grant both consents, and
-- the coach still sees nothing until Sam also agrees on the approval row.
select tests.login(tests.u(142));
select public.parent_approve_teen_coaching(tests.u(143), tests.u(147));
select public.record_consent('coach_sharing', 'coach-share-v1', tests.u(143));
select tests.logout();
select tests.login(tests.u(143));
select public.record_consent('coach_sharing', 'coach-share-v1');
select tests.logout();

select tests.ok('70e: parent approval alone does not start sharing',
  exists (select 1 from public.teen_coaching_approvals
           where minor_id = tests.u(143) and coach_id = tests.u(147)
             and parent_approved_at is not null and teen_agreed_at is null
             and sharing_started_at is null)
  and not app.teen_coaching_share_active(tests.u(143), tests.u(147)));
select tests.login(tests.u(147));
select tests.eq('70e: the coach sees nothing while 70e is pending, even with both coach_sharing grants',
  format($q$select app.coach_can_see(%L)::text$q$, tests.u(143)),
  'false');
select tests.logout();
select tests.login(tests.u(143));
select public.teen_agree_teen_coaching(tests.u(147));
select tests.logout();
select tests.ok('70e: sharing starts only after Sam also agrees',
  app.teen_coaching_share_active(tests.u(143), tests.u(147)));
select tests.login(tests.u(147));
select tests.eq('70e: the coach can see Sam only after both agreed',
  format($q$select app.coach_can_see(%L)::text$q$, tests.u(143)),
  'true');
select tests.eq('70e: coaches still never see a minor''s weight',
  format($q$select app.coach_may_see_body_weight(%L, %L)::text$q$, tests.u(143), tests.u(147)),
  'false');
select tests.logout();

-- ------------------------------------------------------------------ 8. parent sees only "Coaching ended"
select tests.login(tests.u(143));
select public.end_coach_relationship((select id from public.coach_relationships
  where coach_id = tests.u(147) and client_id = tests.u(143) and status = 'active'));
select tests.logout();
select tests.login(tests.u(142));
select tests.eq('parent: after a teen ends coaching, the label is Coaching ended',
  format($q$select public.parent_coaching_label(%L)$q$, tests.u(143)),
  'Coaching ended');
select tests.no_rows('parent: T&S safety notices are not visible on the product surface',
  $q$select * from public.parent_safety_notices$q$);
select tests.raises('parent: cannot write a T&S safety notice',
  format($q$select public.set_parent_safety_notice(%L, %L, 'safety')$q$, tests.u(142), tests.u(143)),
  'forbidden');
select tests.logout();
select tests.login(tests.u(7));
select public.set_parent_safety_notice(tests.u(142), tests.u(143), 'admin-only safety context');
select tests.ok('parent: a platform admin can record an internal T&S note',
  exists (select 1 from public.parent_safety_notices where parent_id = tests.u(142)));
select tests.logout();
select tests.login(tests.u(142));
select tests.eq('parent: the product label is still only Coaching ended after the T&S note',
  format($q$select public.parent_coaching_label(%L)$q$, tests.u(143)),
  'Coaching ended');
select tests.no_rows('parent: the T&S note still does not appear to the parent',
  $q$select * from public.parent_safety_notices$q$);
select tests.logout();
