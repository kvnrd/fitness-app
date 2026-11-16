-- Phase 2b tests (Counsel's must-change items). Runs after rls.sql in the same database, reusing its
-- helpers (tests.ok/eq/raises/blocked/rows/no_rows, tests.u, tests.dob, tests.ct, tests.wk, tests.svc_write).
-- Users here are tests.u(20..40) so they never collide with rls.sql fixtures.

select tests.logout();
insert into auth.users (id, email) select tests.u(i), 'p2b-' || i || '@example.invalid' from generate_series(20, 40) i;

create function tests.signup(p_user uuid, p_dob date, p_lower integer default null, p_upper integer default null, p_src text default null)
returns jsonb language plpgsql as $$
declare r jsonb;
begin
  perform tests.login(p_user);
  r := public.complete_signup(p_dob, null, p_lower, p_upper, p_src, 'terms-v1', null, 'privacy-v1', repeat('d', 64));
  perform tests.logout();
  return r;
end $$;

-- =============================================================== age derivation (C1, C2)
select tests.eq('age: adult DOB, no store signal -> 18_plus',
  format('select age_band || %L || coalesce(adult_on::text, %L) || %L || age_source from private.derive_age(%L, null, null, null)', '|', 'null', '|', tests.dob(30)),
  '18_plus|null|self_declared_dob');
select tests.eq('age: store 16-17 beats adult DOB (lowest age wins)',
  format('select (eligible and age_band = %L and adult_on = (current_date + interval %L)::date and age_source = %L and store_signal = %L)::text from private.derive_age(%L, 16, 17, %L)',
         '16_17', '2 years', 'apple_declared_age_range', 'apple_declared_age_range', tests.dob(30), 'apple_declared_age_range'),
  'true');
select tests.eq('age: minor DOB beats an adult store signal',
  format('select (age_band = %L and adult_on = (%L::date + interval %L)::date and age_source = %L and store_signal = %L)::text from private.derive_age(%L, 18, null, %L)',
         '16_17', tests.dob(17), '18 years', 'self_declared_dob', 'google_play_age_signals', tests.dob(17), 'google_play_age_signals'),
  'true');
select tests.eq('age: store "under 13" (upper bound only) rejects an adult DOB',
  format('select eligible::text from private.derive_age(%L, null, 12, %L)', tests.dob(30), 'apple_declared_age_range'), 'false');
select tests.eq('age: store 13-15 rejects (13-15 stays blocked)',
  format('select eligible::text from private.derive_age(%L, 13, 15, %L)', tests.dob(30), 'google_play_age_signals'), 'false');
select tests.eq('age: DOB 15 rejected', format('select eligible::text from private.derive_age(%L, null, null, null)', tests.dob(15)), 'false');
select tests.eq('age: DOB 16 is a minor with adult_on = DOB + 18y',
  format('select (age_band = %L and adult_on = (%L::date + interval %L)::date)::text from private.derive_age(%L, null, null, null)', '16_17', tests.dob(16), '18 years', tests.dob(16)), 'true');
select tests.raises('age: bounds without a source rejected', format('select * from private.derive_age(%L, 16, 17, null)', tests.dob(30)), 'invalid_age_signal');
select tests.raises('age: upper < lower rejected', format('select * from private.derive_age(%L, 17, 16, %L)', tests.dob(30), 'apple_declared_age_range'), 'invalid_age_signal');
select tests.raises('age: unknown store source rejected', format('select * from private.derive_age(%L, 18, null, %L)', tests.dob(30), 'some_other_store'), 'invalid_age_signal');
select tests.raises('age: missing DOB rejected', 'select * from private.derive_age(null, null, null, null)', 'invalid_birth_date');

-- =============================================================== neutral age screen before any account (C6, Q3)
select tests.login(null, 'anon');
select tests.eq('screen: anon can screen an eligible DOB', format('select public.screen_age(%L) ->> %L', tests.dob(30), 'eligible'), 'true');
select tests.eq('screen: anon screen of under-13 is just "not eligible"', format('select public.screen_age(%L)::text', tests.dob(10)), '{"eligible": false}');
select tests.eq('screen: 13-15 gives the same answer as under-13 (no threshold leak)', format('select public.screen_age(%L)::text', tests.dob(14)), '{"eligible": false}');
select tests.eq('screen: store signal is applied before signup', format('select public.screen_age(%L, null, 12, %L) ->> %L', tests.dob(30), 'apple_declared_age_range', 'eligible'), 'false');
select tests.no_rows('screen: anon cannot read rejection counts', 'select * from private.signup_screen_counts');
select tests.logout();
select tests.ok('screen: only aggregate counts are kept', (select sum(n) >= 3 from private.signup_screen_counts where stage = 'screen'));
select tests.ok('screen: counts table has no personal columns', not exists (select 1 from information_schema.columns
  where table_schema = 'private' and table_name = 'signup_screen_counts' and column_name not in ('day','stage','outcome','n')));
select tests.ok('screen: no profile or auth user created by screening', (select count(*) from public.profiles where id >= tests.u(20)) = 0);

-- =============================================================== signup with age band + adult_on (C1, C2, Q4)
select tests.ok('signup: adult', (tests.signup(tests.u(20), tests.dob(30)) ->> 'is_minor') = 'false');
select tests.ok('signup: 16-year-old is a minor', (tests.signup(tests.u(21), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.ok('signup: parent (adult)', (tests.signup(tests.u(22), tests.dob(45)) ->> 'is_minor') = 'false');
select tests.ok('signup: adult DOB + store 16-17 -> minor', (tests.signup(tests.u(23), tests.dob(30), 16, 17, 'apple_declared_age_range') ->> 'is_minor') = 'true');
select tests.ok('signup: store age source + timestamp recorded, not the payload',
  (select age_source = 'apple_declared_age_range' and store_signal = 'apple_declared_age_range' and age_verified_at is not null
     and adult_on = (current_date + interval '2 years')::date from public.profiles where id = tests.u(23)));
select tests.ok('signup: DOB 17 + store 18+ -> minor (DOB is lower)', (tests.signup(tests.u(24), tests.dob(17), 18, null, 'google_play_age_signals') ->> 'is_minor') = 'true');
select tests.ok('signup: store "under 13" overrides an adult DOB at signup',
  (tests.signup(tests.u(25), tests.dob(30), null, 12, 'apple_declared_age_range') ->> 'eligible') = 'false');
select tests.ok('signup: ...and the auth user (email) was deleted in the same request',
  not exists (select 1 from auth.users where id = tests.u(25)) and not exists (select 1 from public.profiles where id = tests.u(25)));
select tests.ok('signup: signup rejections counted (aggregate only)', (select sum(n) >= 1 from private.signup_screen_counts where stage = 'signup'));
select tests.login(tests.u(20));
select tests.raises('signup: an existing account cannot be deleted by re-submitting an under-13 DOB',
  format('select public.complete_signup(%L)', tests.dob(10)), 'already_signed_up');
select tests.logout();
select tests.ok('signup: existing account untouched after that attempt', exists (select 1 from auth.users where id = tests.u(20)) and exists (select 1 from public.profiles where id = tests.u(20)));
select tests.ok('C2: profiles has no date-of-birth column', not exists (select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles' and (column_name ilike '%birth%' or column_name ilike '%dob%')));
select tests.ok('C1: no column anywhere can hold a raw store payload (no json in profiles, no *payload*/raw* columns)', not exists (
  select 1 from information_schema.columns where table_schema in ('public','private')
    and ((table_name = 'profiles' and data_type in ('json','jsonb')) or column_name ilike '%payload%' or column_name ilike 'raw%')));
select tests.raises('C2: a minor band without adult_on is impossible',
  $q$insert into public.profiles (id, age_band, age_source, age_verified_at, is_minor, adult_on) values ('00000000-0000-0000-0000-0000000000ff', '16_17', 'self_declared_dob', now(), true, null)$q$, '%');
select tests.login(tests.u(21));
select tests.no_rows('C2: the minor cannot read own adult_on (no column grant)', 'select adult_on from public.profiles where id = tests.u(21)');
select tests.logout();

-- turning 18: adult_on reached -> recompute flips is_minor and age_band; adult_on is kept (retention)
select tests.ok('signup: u33 minor', (tests.signup(tests.u(33), tests.dob(17)) ->> 'is_minor') = 'true');
alter table public.profiles disable trigger profiles_derive_age;
update public.profiles set adult_on = current_date - 1 where id = tests.u(33);
alter table public.profiles enable trigger profiles_derive_age;
select tests.login(null, 'service_role');
select tests.ok('adult_on: recompute flips a user who turned 18', public.recompute_minor_flags() >= 1);
select tests.logout();
select tests.ok('adult_on: now 18_plus, adult_on kept', (select not is_minor and age_band = '18_plus' and adult_on is not null from public.profiles where id = tests.u(33)));

-- =============================================================== coaches are 18+ (Q11)
select tests.login(null, 'service_role');
select tests.raises('coach 18+: service cannot make a minor a coach', format('select public.set_user_role(%L, %L)', tests.u(21), 'coach_verified'), 'coach_must_be_adult');
select tests.raises('coach 18+: service cannot make a minor coach_pending', format('select public.set_user_role(%L, %L)', tests.u(21), 'coach_pending'), 'coach_must_be_adult');
select tests.logout();
select tests.raises('coach 18+: even a direct table write is refused', format($q$update public.user_roles set role = 'coach_verified' where user_id = %L$q$, tests.u(23)), 'coach_must_be_adult');
select tests.login(tests.u(21));
select tests.raises('coach 18+: a minor cannot apply', $q$select public.apply_for_coach(true, 'coach-attest-v1')$q$, 'forbidden');
select tests.login(tests.u(20));
select tests.raises('coach 18+: attestation version required', $q$select public.apply_for_coach(true, '')$q$, 'attestation_required');
select tests.logout();

-- =============================================================== parent link for u21, then dual consents (Q2)
select tests.login(tests.u(21)); select public.link_parent(tests.u(21), tests.u(22));
select tests.login(tests.u(22)); select tests.accept_link((select id from public.parent_links where minor_user_id = tests.u(21)));
select tests.login(tests.u(21));
select tests.raises('dual: teen AI switch locked until parent agrees', $q$select public.record_consent('ai_vendor', 'ai-B-v1')$q$, 'parent_consent_required');
select tests.login(tests.u(22));
select public.record_consent('health_data', 'health-v1', tests.u(21));
select public.record_consent('ai_vendor', 'ai-B-parent-v1', tests.u(21), repeat('a', 64));
select tests.eq('dual: parent alone does not turn it on', $q$select app.has_consent(tests.u(21), 'ai_vendor')::text$q$, 'false');
select tests.login(tests.u(21));
select tests.raises('consent: malformed text hash rejected', $q$select public.record_consent('ai_vendor', 'ai-B-v1', null, 'not-a-hash')$q$, 'invalid_text_hash');
select public.record_consent('health_data', 'health-v1');
select public.record_consent('ai_vendor', 'ai-B-v1', null, repeat('b', 64));
select tests.eq('dual: teen + parent = on', $q$select app.has_consent(tests.u(21), 'ai_vendor')::text$q$, 'true');
select tests.eq('consent: text hash + grantor stored on the event', $q$select count(*)::text from public.consent_events where user_id = tests.u(21) and kind = 'ai_vendor' and granted and text_hash is not null and grantor in ('self','parent')$q$, '2');
select public.revoke_consent('ai_vendor');
select tests.eq('dual: teen alone can turn it off', $q$select app.has_consent(tests.u(21), 'ai_vendor')::text$q$, 'false');
select public.record_consent('ai_vendor', 'ai-B-v1', null, repeat('b', 64));
select tests.eq('dual: teen can turn it back on while the parent grant stands', $q$select app.has_consent(tests.u(21), 'ai_vendor')::text$q$, 'true');
select tests.login(tests.u(22));
select public.revoke_consent('ai_vendor', tests.u(21));
select tests.eq('dual: parent can turn it off', $q$select app.has_consent(tests.u(21), 'ai_vendor')::text$q$, 'false');
select tests.eq('dual: parent revocation also turns the teen switch off', $q$select (not granted)::text from public.consents where user_id = tests.u(21) and kind = 'ai_vendor' and grantor = 'self'$q$, 'true');
select tests.login(tests.u(21));
select tests.raises('dual: teen switch is locked again after parent revokes', $q$select public.record_consent('ai_vendor', 'ai-B-v1')$q$, 'parent_consent_required');
select tests.raises('dual: teen cannot grant on the parent''s behalf', format($q$select public.record_consent('ai_vendor', 'v1', %L)$q$, tests.u(21)), 'parent_consent_required');
select tests.login(tests.u(20));
select tests.raises('dual: an unrelated adult cannot grant for the teen', format($q$select public.record_consent('ai_vendor', 'v1', %L)$q$, tests.u(21)), 'forbidden');
select public.record_consent('health_data', 'health-v1');
select public.record_consent('ai_vendor', 'ai-B-v1');
select tests.eq('adult: own grant is enough', $q$select app.has_consent(tests.u(20), 'ai_vendor')::text$q$, 'true');
-- health + AI for the teen (both parties) for the photo / purchase / AI tests below
select tests.login(tests.u(22));
select public.record_consent('health_data', 'health-v1', tests.u(21));
select public.record_consent('ai_vendor', 'ai-B-parent-v1', tests.u(21));
select tests.login(tests.u(21));
select public.record_consent('health_data', 'health-v1');
select public.record_consent('ai_vendor', 'ai-B-v1');
select tests.logout();

-- former parent's grant does not count for a new parent (u24 minor; u22 then u20)
select tests.login(tests.u(24)); select public.link_parent(tests.u(24), tests.u(22));
select tests.login(tests.u(22)); select tests.accept_link((select id from public.parent_links where minor_user_id = tests.u(24)));
select public.record_consent('coach_sharing', 'v1', tests.u(24));
select public.revoke_parent_link((select id from public.parent_links where minor_user_id = tests.u(24)));
select tests.login(tests.u(24)); select public.link_parent(tests.u(24), tests.u(20));
select tests.login(tests.u(20)); select tests.accept_link((select id from public.parent_links where minor_user_id = tests.u(24) and status = 'pending'));
select tests.login(tests.u(24));
select tests.raises('dual: a former parent''s grant does not unlock the teen', $q$select public.record_consent('coach_sharing', 'v1')$q$, 'parent_consent_required');
select tests.logout();

-- =============================================================== purchases (C5)
select tests.login(tests.u(23));   -- minor (store signal), no parent link
select tests.eq('C5: unlinked minor cannot purchase', 'select public.can_purchase()::text', 'false');
select tests.login(tests.u(21));
select tests.eq('C5: linked minor can purchase (with parent approval)', 'select public.can_purchase()::text', 'true');
select tests.blocked('C5: client cannot insert purchases', format($q$insert into public.purchases (user_id, product_id, store, store_txn_ref) values (%L, 'pro', 'apple', 't1')$q$, tests.u(21)));
select tests.login(tests.u(20));
select tests.eq('C5: adult can purchase', 'select public.can_purchase()::text', 'true');
select tests.login(null, 'service_role');
select tests.raises('C5: server cannot record a purchase for an unlinked minor', format($q$insert into public.purchases (user_id, product_id, store, store_txn_ref) values (%L, 'pro', 'apple', 't2')$q$, tests.u(23)), 'purchase_not_allowed');
select tests.raises('C5: linked minor purchase needs the parent''s approval', format($q$insert into public.purchases (user_id, product_id, store, store_txn_ref) values (%L, 'pro', 'apple', 't3')$q$, tests.u(21)), 'parent_approval_required');
select tests.affected('C5: linked minor purchase approved by the active parent', format($q$insert into public.purchases (user_id, product_id, store, store_txn_ref, approved_by) values (%L, 'pro', 'apple', 't4', %L)$q$, tests.u(21), tests.u(22)), 1);
select tests.affected('C5: adult purchase', format($q$insert into public.purchases (user_id, product_id, store, store_txn_ref) values (%L, 'pro', 'google', 't5')$q$, tests.u(20)), 1);
select tests.login(tests.u(22));
select tests.rows('C5: parent sees the minor''s purchase', format('select * from public.purchases where user_id = %L', tests.u(21)), 1);
select tests.login(tests.u(23));
select tests.no_rows('C5: other users see no purchases', 'select * from public.purchases');
select tests.logout();

-- =============================================================== progress photos blocked for 16-17
select tests.login(tests.u(20));
select public.record_consent('health_data', 'health-v1');
select tests.affected('photos: adult with health consent can add a photo row', format($q$insert into public.progress_photos (user_id, storage_path) values (%L, %L)$q$, tests.u(20), tests.u(20)::text || '/a.jpg'), 1);
select tests.blocked('photos: adult cannot write into another user''s folder', format($q$insert into public.progress_photos (user_id, storage_path) values (%L, %L)$q$, tests.u(20), tests.u(21)::text || '/a.jpg'));
select tests.affected('photos: adult storage upload into own folder', format($q$insert into storage.objects (bucket_id, name) values ('progress-photos', %L)$q$, tests.u(20)::text || '/a.jpg'), 1);
select tests.blocked('photos: storage upload into another folder refused', format($q$insert into storage.objects (bucket_id, name) values ('progress-photos', %L)$q$, tests.u(21)::text || '/x.jpg'));
select tests.blocked('photos: no in-place overwrite (no update policy)', $q$update storage.objects set name = name || '.2' where bucket_id = 'progress-photos'$q$);
select tests.login(tests.u(21));   -- linked minor, health consent on (both)
select tests.eq('photos: minor has health consent (so the block is the age rule)', $q$select app.has_consent(tests.u(21), 'health_data')::text$q$, 'true');
select tests.blocked('photos: 16-17 cannot add a photo row', format($q$insert into public.progress_photos (user_id, storage_path) values (%L, %L)$q$, tests.u(21), tests.u(21)::text || '/a.jpg'));
select tests.blocked('photos: 16-17 storage upload refused', format($q$insert into storage.objects (bucket_id, name) values ('progress-photos', %L)$q$, tests.u(21)::text || '/a.jpg'));
select tests.no_rows('photos: minor sees no other user''s objects', $q$select * from storage.objects where bucket_id = 'progress-photos'$q$);
select tests.login(tests.u(22));   -- adult without health consent
select tests.blocked('photos: adult without health consent refused', format($q$insert into storage.objects (bucket_id, name) values ('progress-photos', %L)$q$, tests.u(22)::text || '/a.jpg'));
select tests.login(null, 'service_role');
select tests.raises('photos: even the service role cannot add a minor''s photo row', format($q$insert into public.progress_photos (user_id, storage_path) values (%L, %L)$q$, tests.u(21), tests.u(21)::text || '/a.jpg'), 'photo_upload_not_allowed');
select tests.logout();
select tests.ok('photos: bucket is private', (select not public from storage.buckets where id = 'progress-photos'));

-- =============================================================== pending minors: reminders + day-14 purge (Q5)
select tests.ok('pending: u26', (tests.signup(tests.u(26), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.ok('pending: u27', (tests.signup(tests.u(27), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.ok('pending: u28', (tests.signup(tests.u(28), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.ok('pending: u29', (tests.signup(tests.u(29), tests.dob(17)) ->> 'is_minor') = 'true');
-- u29 had a link accepted and later revoked: not "pending", never auto-purged
select tests.login(tests.u(29)); select public.link_parent(tests.u(29), tests.u(22));
select tests.login(tests.u(22)); select tests.accept_link((select id from public.parent_links where minor_user_id = tests.u(29)));
select public.revoke_parent_link((select id from public.parent_links where minor_user_id = tests.u(29)));
select tests.logout();
update public.profiles set created_at = now() - interval '15 days' where id in (tests.u(26), tests.u(27), tests.u(29));
update public.profiles set created_at = now() - interval '4 days' where id = tests.u(28);
select tests.login(null, 'service_role');
select public.set_litigation_hold(tests.u(27), true, 'test');
select tests.eq('reminders: day-3 reminder due for the 4-day-old pending minor only',
  'select string_agg(reminder_day::text, $$,$$) from public.claim_pending_minor_reminders() where user_id = tests.u(28)', '3');
select tests.eq('reminders: claimed once (idempotent)', 'select count(*)::text from public.claim_pending_minor_reminders()', '0');
select tests.eq('purge: exactly one pending minor purged on day 14', 'select public.purge_pending_minors()::text', '1');
select tests.logout();
select tests.ok('purge: day-14 pending minor and auth user (email) gone', not exists (select 1 from public.profiles where id = tests.u(26)) and not exists (select 1 from auth.users where id = tests.u(26)));
select tests.ok('purge: litigation hold keeps the account', exists (select 1 from public.profiles where id = tests.u(27)));
select tests.ok('purge: 4-day-old pending minor kept', exists (select 1 from public.profiles where id = tests.u(28)));
select tests.ok('purge: minor whose link was once accepted is not purged', exists (select 1 from public.profiles where id = tests.u(29)));
select tests.ok('purge: linked minor kept', exists (select 1 from public.profiles where id = tests.u(21)));
select tests.ok('purge: audit keeps the count only (no user id)', exists (select 1 from public.audit_log where action = 'pending_minors_purged' and target_user_id is null and metadata = '{"count": 1}'::jsonb));
select tests.login(tests.u(28));
select tests.raises('purge: clients cannot run it', 'select public.purge_pending_minors()', 'permission denied%');
select tests.raises('reminders: clients cannot claim', 'select * from public.claim_pending_minor_reminders()', 'permission denied%');
select tests.raises('holds: clients cannot place holds', format('select public.set_litigation_hold(%L, false)', tests.u(27)), 'permission denied%');
select tests.logout();

-- backup purge of auth users that never finished the age step
insert into auth.users (id, email, created_at) values (tests.u(41), 'stale@example.invalid', now() - interval '2 days'), (tests.u(42), 'fresh@example.invalid', now());
select tests.login(null, 'service_role');
select tests.ok('backup purge: removes stale unprofiled auth users only', public.purge_unprofiled_auth_users() >= 1);
select tests.logout();
select tests.ok('backup purge: stale gone, fresh kept, profiled users kept', not exists (select 1 from auth.users where id = tests.u(41))
  and exists (select 1 from auth.users where id = tests.u(42)) and exists (select 1 from auth.users where id = tests.u(20)));

-- =============================================================== retention (Q8, Q10)
select tests.ok('retention: u31 adult', (tests.signup(tests.u(31), tests.dob(40)) ->> 'is_minor') = 'false');
select tests.ok('retention: u32 adult', (tests.signup(tests.u(32), tests.dob(40)) ->> 'is_minor') = 'false');
select tests.login(tests.u(31)); select public.record_consent('health_data', 'health-v1');
select tests.svc_write(tests.u(31), 'old notes', 'screen');
select tests.login(tests.u(31)); select public.revoke_consent('health_data');
select tests.login(tests.u(20));
select tests.svc_write(tests.u(20), 'recent', 'screen');
select tests.login(tests.u(20)); select public.revoke_consent('health_data');
select tests.login(tests.u(32)); select public.record_consent('health_data', 'health-v1'); select public.record_consent('ai_vendor', 'ai-B-v1'); select public.revoke_consent('ai_vendor');
select tests.logout();
update public.consents set revoked_at = now() - interval '30 days' where user_id = tests.u(31) and kind = 'health_data';
-- account deletion: consent history survives with a retention date
delete from auth.users where id = tests.u(32);
-- 5 events: the signup 'terms' + 'privacy_policy' acceptances (Phase 3), the health grant, the ai_vendor grant and revoke
select tests.ok('retention: consent history outlives the deleted account', (select count(*) = 5 from public.consent_events where user_id = tests.u(32)));
select tests.ok('retention: adult consent history kept 4 years after deletion', (select bool_and(retain_until between now() + interval '4 years' - interval '1 minute' and now() + interval '4 years' + interval '1 minute') from public.consent_events where user_id = tests.u(32)));
insert into public.consent_events (user_id, kind, grantor, granted, policy_version, actor_user_id) values (tests.u(28), 'ai_vendor', 'self', true, 'v1', tests.u(28));
select public.set_litigation_hold(tests.u(28), false) from (select tests.login(null, 'service_role')) x;
select tests.logout();
delete from auth.users where id = tests.u(28);
select tests.ok('retention: a minor''s consent history is kept until at least their 22nd birthday', (select bool_and(retain_until >= now() + interval '5 years') from public.consent_events where user_id = tests.u(28)));
-- aged fixtures
update public.consent_events set retain_until = now() - interval '1 day' where user_id = tests.u(32);
insert into public.consent_events (user_id, kind, grantor, granted, policy_version, retain_until) values (tests.u(27), 'ai_vendor', 'self', false, 'v1', now() - interval '1 day');
insert into public.data_export_requests (user_id, status, requested_at, completed_at) values
  (tests.u(35), 'completed', now() - interval '5 years', now() - interval '5 years'),
  (tests.u(36), 'completed', now() - interval '3 years', now() - interval '3 years'),
  (tests.u(37), 'pending',   now() - interval '6 years', null);
insert into public.audit_log (at, actor_id, action, target_user_id) values
  (now() - interval '3 years', tests.u(38), 'health_read_by_coach', tests.u(39)),
  (now() - interval '1 year',  tests.u(38), 'health_read_by_coach', tests.u(39)),
  (now() - interval '3 years', tests.u(38), 'signup_completed', tests.u(38));
select tests.login(tests.u(1));
select tests.raises('retention: clients cannot run the purge', 'select public.run_retention_purge()', 'permission denied%');
select tests.no_rows('retention: non-admins cannot read the schedule', 'select * from public.retention_policies');
select tests.login(tests.u(7));
select tests.ok('retention: platform admin reads the schedule', (select count(*) >= 10 from public.retention_policies));
select tests.login(null, 'service_role');
select tests.ok('retention: purge runs and reports counts', (public.run_retention_purge() ->> 'health_shredded')::int >= 1);
select tests.logout();
select tests.ok('retention: health data shredded 30 days after health consent revoked (record + wrapped key)',
  not exists (select 1 from public.health_records where user_id = tests.u(31)) and not exists (select 1 from private.user_data_keys where user_id = tests.u(31)));
select tests.ok('retention: recently revoked health data kept inside the 30-day window', exists (select 1 from private.user_data_keys where user_id = tests.u(20)));
select tests.ok('retention: expired consent history purged', not exists (select 1 from public.consent_events where user_id = tests.u(32)));
select tests.ok('retention: litigation hold keeps expired consent history', exists (select 1 from public.consent_events where user_id = tests.u(27)));
select tests.ok('retention: privacy request logs purged after 4 years, kept before, open ones kept',
  not exists (select 1 from public.data_export_requests where user_id = tests.u(35))
  and exists (select 1 from public.data_export_requests where user_id = tests.u(36))
  and exists (select 1 from public.data_export_requests where user_id = tests.u(37)));
select tests.ok('retention: coach access audit purged after 2 years only',
  (select count(*) = 1 from public.audit_log where action = 'health_read_by_coach' and actor_id = tests.u(38))
  and exists (select 1 from public.audit_log where action = 'signup_completed' and actor_id = tests.u(38)));

-- =============================================================== AI plan context (section 13)
select tests.ok('ai: u34 adult', (tests.signup(tests.u(34), tests.dob(30)) ->> 'is_minor') = 'false');
select tests.login(null, 'service_role');
select tests.raises('ai: no ai_vendor consent -> refused', format('select * from public.ai_plan_context(%L)', tests.u(34)), 'consent_required');
select tests.login(tests.u(34));
select tests.raises('ai: AI cannot be granted without health (Counsel phase4-review #2)', $q$select public.record_consent('ai_vendor', 'ai-B-v1')$q$, 'health_required');
select public.record_consent('health_data', 'health-v1'); select public.record_consent('ai_vendor', 'ai-B-v1');
select tests.svc_write(tests.u(34), 'free text that must never reach the AI', 'screen');
select tests.eq('ai: with health consent only the encrypted category + wrapped key come back', format('select (health_ok and injury_category_ct = tests.ct(%L) and wrapped_key is not null)::text from public.ai_plan_context(%L)', 'knee', tests.u(34)), 'true');
select tests.ok('ai: context exposes no name/email/user id/notes/photo/location columns', not exists (
  select 1 from pg_proc p, unnest(p.proargnames) a(n) where p.proname = 'ai_plan_context'
    and a.n not in ('p_actor','age_band','health_ok','wrapped_key','key_provider','kms_key_ref','injury_category_ct')));
select tests.eq('ai: linked minor with teen + parent opt-in gets 16_17 context', format('select age_band from public.ai_plan_context(%L)', tests.u(21)), '16_17');
select tests.login(tests.u(20)); select public.record_consent('health_data', 'health-v1', tests.u(24)); select public.record_consent('ai_vendor', 'ai-B-parent-v1', tests.u(24));
select tests.login(null, 'service_role');
select tests.raises('ai: minor with only the parent''s opt-in refused', format('select * from public.ai_plan_context(%L)', tests.u(24)), 'consent_required');
select tests.raises('ai: unlinked (pending) minor refused', format('select * from public.ai_plan_context(%L)', tests.u(23)), 'forbidden');
select tests.logout();
insert into public.audit_log (actor_id, action, target_user_id) select tests.u(34), 'ai_plan_requested', tests.u(34) from generate_series(1, 20);
select tests.login(null, 'service_role');
select tests.raises('ai: rate limited after 20 requests an hour', format('select * from public.ai_plan_context(%L)', tests.u(34)), 'rate_limited');
select tests.login(tests.u(34));
select tests.raises('ai: clients cannot call the context function', format('select * from public.ai_plan_context(%L)', tests.u(34)), 'permission denied%');
select tests.logout();

-- =============================================================== global invariants after Phase 2b
select tests.ok('rls: every table in public/private still has RLS enabled AND forced', not exists (
  select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public','private') and c.relkind = 'r' and not (c.relrowsecurity and c.relforcerowsecurity)));
select tests.ok('privileges: anon can execute only screen_age in public', not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE') and p.proname <> 'screen_age'));
select tests.ok('privileges: service-only Phase 2b functions are not executable by clients', not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'EXECUTE')
    and p.proname in ('health_prepare_write','health_register_key','health_write','health_read','health_shred','ai_plan_context',
                      'purge_pending_minors','claim_pending_minor_reminders','purge_unprofiled_auth_users','run_retention_purge',
                      'set_litigation_hold','set_coach_identity_check','recompute_minor_flags')));
select tests.ok('privileges: no client grants on private tables', not exists (select 1 from information_schema.role_table_grants
  where grantee in ('anon','authenticated') and table_schema = 'private'));
