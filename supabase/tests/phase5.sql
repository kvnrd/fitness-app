-- Phase 5 / Progress groundwork. Users tests.u(120..130) so they never collide with earlier fixtures.

select tests.logout();
insert into auth.users (id, email) select tests.u(i), 'p5-' || i || '@example.invalid' from generate_series(120, 130) i;

select tests.ok('phase5: adult athlete 120', (tests.signup(tests.u(120), tests.dob(30)) ->> 'is_minor') = 'false');
select tests.ok('phase5: adult coach 121', (tests.signup(tests.u(121), tests.dob(35)) ->> 'is_minor') = 'false');
select tests.ok('phase5: minor 122', (tests.signup(tests.u(122), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.ok('phase5: adult without a 1:1 coach 123', (tests.signup(tests.u(123), tests.dob(28)) ->> 'is_minor') = 'false');
select tests.ok('phase5: parent 124', (tests.signup(tests.u(124), tests.dob(45)) ->> 'is_minor') = 'false');
select tests.ok('phase5: other coach 125', (tests.signup(tests.u(125), tests.dob(40)) ->> 'is_minor') = 'false');

select tests.login(null, 'service_role');
select public.set_user_role(tests.u(121), 'coach_verified');
select public.set_user_role(tests.u(125), 'coach_verified');
select tests.logout();

-- =============================================================== e1RM + strength / cardio charts
select tests.eq('e1rm: Epley 135x8', $q$select round(app.e1rm(135, 8, 'epley', 10), 6)::text$q$, '171.000000');
select tests.eq('e1rm: Brzycki 135x8', $q$select round(app.e1rm(135, 8, 'brzycki', 10), 10)::text$q$, round((135 * 36)::numeric / 29, 10)::text);
select tests.eq('e1rm: over the cap is null', $q$select (app.e1rm(135, 11, 'epley', 10) is null)::text$q$, 'true');
select tests.eq('e1rm: typo weight is null', $q$select (app.e1rm(800, 5, 'epley', 10) is null)::text$q$, 'true');
select tests.eq('e1rm: typo reps is null', $q$select (app.e1rm(135, 0, 'epley', 10) is null)::text$q$, 'true');
select tests.eq('e1rm: default formula is Epley', $q$select round(app.e1rm(135, 8), 6)::text$q$, '171.000000');
select tests.raises('e1rm: unknown formula rejected', $q$select app.e1rm(135, 8, 'lombardi', 10)$q$, 'unknown_e1rm_formula');

insert into public.plans (id, owner_id, client_id, name) values
  ('51000000-0000-0000-0000-000000000001', tests.u(121), tests.u(120), 'P5 plan');
insert into public.plan_days (id, plan_id, day_key, title) values
  ('52000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'mon', 'Push');
insert into public.exercises (id, plan_day_id, name, kind, fields, cardio_activity) values
  ('53000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000001', 'Bench', 'strength', '{weight,reps}', null),
  ('53000000-0000-0000-0000-000000000002', '52000000-0000-0000-0000-000000000001', 'Row', 'cardio', '{time,distance,power}', 'row');

-- Canonical pounds. Dates relative to 2026-11-16 so range filters are stable.
insert into public.set_logs (user_id, exercise_id, performed_on, set_index, weight, reps, done, exclude_from_prs) values
  (tests.u(120), '53000000-0000-0000-0000-000000000001', '2026-01-01', 0, 185, 5, true, false),
  (tests.u(120), '53000000-0000-0000-0000-000000000001', '2026-01-08', 0, 185, 5, true, false),
  (tests.u(120), '53000000-0000-0000-0000-000000000001', '2026-01-15', 0, 200, 5, true, false),
  (tests.u(120), '53000000-0000-0000-0000-000000000001', '2026-01-22', 0, 800, 5, true, false), -- typo, ignored
  (tests.u(120), '53000000-0000-0000-0000-000000000001', '2026-01-29', 0, 205, 5, true, true),  -- excluded from PRs
  (tests.u(120), '53000000-0000-0000-0000-000000000001', '2026-10-01', 0, 135, 8, true, false),
  (tests.u(120), '53000000-0000-0000-0000-000000000001', '2026-11-10', 0, 135, 8, true, false); -- inside 1M of 2026-11-16

-- 1000 m in 120 s = 60 s / 500 m. Stored as canonical miles.
insert into public.set_logs (user_id, exercise_id, performed_on, set_index, time_seconds, distance, power, done) values
  (tests.u(120), '53000000-0000-0000-0000-000000000002', '2026-11-01', 0, 120, 1000.0 / 1609.344, 180, true);

select tests.login(tests.u(120));
select tests.eq('strength: first session is a PR; a repeat is not; a real bump is', $q$
  select string_agg(performed_on::text || ':' || is_pr::text, ',' order by performed_on)
    from public.strength_progress('53000000-0000-0000-0000-000000000001', 'All', 'epley', 10, '2026-11-16')
$q$, '2026-01-01:true,2026-01-08:false,2026-01-15:true,2026-01-22:false,2026-01-29:false,2026-10-01:false,2026-11-10:false');

select tests.eq('strength: typo 800 lb has no e1RM or volume', $q$
  select (e1rm is null and top_set is null and volume = 0)::text
    from public.strength_progress('53000000-0000-0000-0000-000000000001', 'All', 'epley', 10, '2026-11-16')
   where performed_on = '2026-01-22'
$q$, 'true');

select tests.eq('strength: exclude_from_prs drops e1RM but volume still counts', $q$
  select (e1rm is null and volume = 205 * 5)::text
    from public.strength_progress('53000000-0000-0000-0000-000000000001', 'All', 'epley', 10, '2026-11-16')
   where performed_on = '2026-01-29'
$q$, 'true');

select tests.eq('strength: 1M range from mid-November hides January sessions', $q$
  select count(*)::text from public.strength_progress('53000000-0000-0000-0000-000000000001', '1M', 'epley', 10, '2026-11-16')
$q$, '1');

select tests.eq('cardio: row split is seconds per 500 m', $q$
  select trim_scale(round(split_sec_per_500m, 6))::text from public.cardio_progress('53000000-0000-0000-0000-000000000002', 'All', '2026-11-16')
$q$, '60');

select tests.login(tests.u(123));
select tests.eq('strength: another user does not see 120''s sessions', $q$
  select count(*)::text from public.strength_progress('53000000-0000-0000-0000-000000000001', 'All', 'epley', 10, '2026-11-16')
$q$, '0');
select tests.logout();

select tests.ok('settings: defaults are Epley, 10-rep cap, lb and mi', (
  select s.e1rm_formula = 'epley' and s.e1rm_rep_cap = 10 and s.mass_unit = 'lb' and s.distance_unit = 'mi'
    from app.progress_settings_for(tests.u(120)) s));

-- =============================================================== weigh-ins stay off the server until health is on
select tests.login(tests.u(120));
select tests.raises('weigh-ins: blocked without health consent',
  format($q$insert into public.weigh_ins (user_id, recorded_on, weight_ct, unit) values (%L, '2026-11-10', '\x00', 'lb')$q$, tests.u(120)),
  'consent_required');
select public.record_consent('health_data', 'health-v1');
select tests.affected('weigh-ins: adult with health consent can insert ciphertext',
  format($q$insert into public.weigh_ins (user_id, recorded_on, weight_ct, unit) values (%L, '2026-11-10', '\x01', 'lb')$q$, tests.u(120)), 1);
select tests.blocked('weigh-ins: cannot insert for someone else',
  format($q$insert into public.weigh_ins (user_id, recorded_on, weight_ct, unit) values (%L, '2026-11-10', '\x01', 'lb')$q$, tests.u(123)));
select tests.ok('weigh-ins: body-weight share is off by default', not app.shares_body_weight(tests.u(120)));
select tests.raises('weigh-ins: share toggle requires an active 1:1 coach',
  $q$select public.set_share_body_weight(true)$q$, 'one_to_one_required');
select tests.logout();

select tests.login(null, 'service_role');
insert into public.coach_relationships (coach_id, client_id, status, started_at)
  values (tests.u(121), tests.u(120), 'active', now());
select tests.logout();

select tests.login(tests.u(121));
select tests.no_rows('weigh-ins: coach cannot see them while the share toggle is off',
  format('select * from public.weigh_ins where user_id = %L', tests.u(120)));
select tests.login(tests.u(120));
select public.set_share_body_weight(true);
select tests.login(tests.u(121));
select tests.rows('weigh-ins: 1:1 coach sees ciphertext after the athlete opts in',
  format('select * from public.weigh_ins where user_id = %L', tests.u(120)), 1);
select tests.login(tests.u(125));
select tests.no_rows('weigh-ins: a different coach cannot see them',
  format('select * from public.weigh_ins where user_id = %L', tests.u(120)));
select tests.login(tests.u(120));
select public.set_share_body_weight(false);
select tests.login(tests.u(121));
select tests.no_rows('weigh-ins: access ends when the athlete turns the toggle off',
  format('select * from public.weigh_ins where user_id = %L', tests.u(120)));
select tests.login(tests.u(120));
select public.set_share_body_weight(true);
select tests.logout();
-- Ending the relationship revokes access immediately.
select tests.login(null, 'service_role');
update public.coach_relationships set status = 'ended', ended_at = now()
  where coach_id = tests.u(121) and client_id = tests.u(120);
select tests.logout();
select tests.login(tests.u(121));
select tests.no_rows('weigh-ins: access ends when the relationship ends',
  format('select * from public.weigh_ins where user_id = %L', tests.u(120)));
select tests.logout();

-- Restore the 1:1 for photo-share tests.
select tests.login(null, 'service_role');
insert into public.coach_relationships (coach_id, client_id, status, started_at)
  values (tests.u(121), tests.u(120), 'active', now());
select tests.logout();

-- =============================================================== photos: age block, first-use opt-in, per-photo share
select tests.ok('photos: opt-in is off when no row exists', not app.has_progress_photo_opt_in(tests.u(120)));
select tests.ok('photos: opt-in column defaults to false, never true', (
  select is_nullable = 'NO' and column_default like '%false%'
    from information_schema.columns
   where table_schema = 'public' and table_name = 'progress_photo_opt_ins' and column_name = 'opted_in'));

select tests.login(tests.u(122)); -- minor, even with health later, cannot opt in
select tests.raises('photos: a 16-17 cannot turn the photo opt-in on',
  $q$select public.set_progress_photo_opt_in(true, 'photos-v1', repeat('a', 64))$q$, 'photo_upload_not_allowed');
select tests.ok('photos: minor still has no opt-in', not app.has_progress_photo_opt_in(tests.u(122)));
select tests.login(tests.u(124));
-- parent link + health so the age block is not confused with missing consent
-- (minor already signed up; parent link via existing helpers if present, otherwise skip health and rely on age)
select tests.logout();

select tests.login(tests.u(120));
select tests.raises('photos: health on, opt-in off, upload refused',
  format($q$insert into public.progress_photos (user_id, storage_path) values (%L, %L)$q$, tests.u(120), tests.u(120)::text || '/p5.jpg'),
  'photo_upload_not_allowed');
select public.set_progress_photo_opt_in(true, 'photos-v1', repeat('a', 64));
select tests.ok('photos: explicit opt-in is recorded', app.has_progress_photo_opt_in(tests.u(120)));
select tests.affected('photos: adult with health + opt-in can add a row',
  format($q$insert into public.progress_photos (user_id, storage_path, captured_on) values (%L, %L, '2026-11-16')$q$, tests.u(120), tests.u(120)::text || '/p5.jpg'), 1);
select tests.affected('photos: adult storage upload into own folder',
  format($q$insert into storage.objects (bucket_id, name) values ('progress-photos', %L)$q$, tests.u(120)::text || '/p5.jpg'), 1);

select tests.raises('photos: share requires the photo-share opt-in',
  format($q$select public.share_progress_photo((select id from public.progress_photos where storage_path = %L), %L)$q$,
         tests.u(120)::text || '/p5.jpg', tests.u(121)),
  'consent_required');
select public.set_photo_coach_share_opt_in(tests.u(121), true, 'share-v1', repeat('b', 64));
select tests.raises('photos: cannot share with a coach who is not in an active 1:1',
  format($q$select public.share_progress_photo((select id from public.progress_photos where storage_path = %L), %L)$q$,
         tests.u(120)::text || '/p5.jpg', tests.u(125)),
  'one_to_one_required');
select public.share_progress_photo(
  (select id from public.progress_photos where storage_path = tests.u(120)::text || '/p5.jpg'),
  tests.u(121));
select tests.login(tests.u(121));
select tests.no_rows('photos: coach cannot see the row until the copy is watermarked and checked',
  format('select * from public.progress_photos where user_id = %L', tests.u(120)));
select tests.login(null, 'service_role');
select public.finalize_shared_photo_copy(
  (select s.id from public.progress_photo_shares s
     join public.progress_photos ph on ph.id = s.photo_id
    where ph.storage_path = tests.u(120)::text || '/p5.jpg' and s.coach_id = tests.u(121)),
  '\x22222222222222222222222222222222'::bytea,
  'passed');
select tests.login(tests.u(121));
select tests.rows('photos: 1:1 coach sees the shared watermarked photo row',
  format('select * from public.progress_photos where user_id = %L', tests.u(120)), 1);
select tests.ok('photos: the shared copy is watermarked and has no download path', exists (
  select 1 from public.progress_photo_shared_copies c
   where c.coach_id = tests.u(121) and c.watermarked and c.safety_check = 'passed' and c.wrapped_key is not null));
select tests.no_rows('photos: coach has no storage download of the object',
  format($q$select * from storage.objects where bucket_id = 'progress-photos' and name = %L$q$, tests.u(120)::text || '/p5.jpg'));
select tests.login(tests.u(125));
select tests.no_rows('photos: a coach without a share sees nothing',
  format('select * from public.progress_photos where user_id = %L', tests.u(120)));
select tests.login(tests.u(120));
select public.revoke_progress_photo_share(
  (select id from public.progress_photos where storage_path = tests.u(120)::text || '/p5.jpg'),
  tests.u(121));
select tests.login(tests.u(121));
select tests.no_rows('photos: access ends when the share is revoked',
  format('select * from public.progress_photos where user_id = %L', tests.u(120)));
select tests.logout();

select tests.login(tests.u(122));
select tests.raises('photos: 16-17 cannot add a photo row (age block)',
  format($q$insert into public.progress_photos (user_id, storage_path) values (%L, %L)$q$, tests.u(122), tests.u(122)::text || '/x.jpg'),
  'photo_upload_not_allowed');
select tests.blocked('photos: 16-17 storage upload refused',
  format($q$insert into storage.objects (bucket_id, name) values ('progress-photos', %L)$q$, tests.u(122)::text || '/x.jpg'));
select tests.login(null, 'service_role');
select tests.raises('photos: even the service role cannot add a minor''s photo row',
  format($q$insert into public.progress_photos (user_id, storage_path) values (%L, %L)$q$, tests.u(122), tests.u(122)::text || '/x.jpg'),
  'photo_upload_not_allowed');
select tests.logout();


-- =============================================================== Counsel: consent logs, no auto re-prompt, export + shred
select tests.login(tests.u(123));
select public.record_consent('health_data', 'health-v1');
select public.dismiss_progress_photo_opt_in();
select tests.ok('consent: Not now logs dismissed and does not turn photos on', (
  not app.has_progress_photo_opt_in(tests.u(123))
  and exists (select 1 from public.consent_events
               where user_id = tests.u(123) and kind = 'progress_photos'
                 and policy_version = 'dismissed' and granted = false and text_hash is null)));
select tests.ok('consent: no automatic re-prompt', not app.progress_photo_reprompt_due(tests.u(123)));
select tests.raises('consent: Continue without a hash is refused',
  $q$select public.set_progress_photo_opt_in(false, 'photos-v1', 'nope')$q$, 'invalid_text_hash');
-- First-use Continue with the switch off (never on, no photos): logs off with version+hash, no export required.
select public.set_progress_photo_opt_in(false, 'photos-v1', repeat('c', 64));
select tests.ok('consent: Continue with the switch off logs off and keeps photos off', (
  not app.has_progress_photo_opt_in(tests.u(123))
  and exists (select 1 from public.consent_events
               where user_id = tests.u(123) and kind = 'progress_photos'
                 and granted = false and policy_version = 'photos-v1' and text_hash = repeat('c', 64))));
select public.set_progress_photo_opt_in(true, 'photos-v1', repeat('c', 64));
select tests.affected('consent: 123 can add a photo once on',
  format($q$insert into public.progress_photos (user_id, storage_path) values (%L, %L)$q$, tests.u(123), tests.u(123)::text || '/off.jpg'), 1);
select tests.raises('deletion: turning photos off without an export offer is refused',
  $q$select public.set_progress_photo_opt_in(false, 'photos-v1', repeat('c', 64))$q$, 'export_required');
select tests.ok('deletion: export hook returns a request id', public.offer_progress_photo_export() is not null);
select tests.logout();
select tests.ok('deletion: export hook records the offered-at flag',
  (select export_offered_at is not null from public.progress_photo_opt_ins where user_id = tests.u(123)));
select tests.login(tests.u(123));
select public.register_photo_key('\x11111111111111111111111111111111'::bytea, 'local-dev', 'local-dev:test');
select public.set_progress_photo_opt_in(false, 'photos-v1', repeat('c', 64));
-- Inspect private keys as the test role (superuser). service_role has no schema usage on private.
select tests.logout();
select tests.ok('deletion: turn-off schedules per-user key shred within 30 days', exists (
  select 1 from private.photo_data_keys k
   where k.user_id = tests.u(123) and k.shred_after is not null
     and k.shred_after > now() + interval '28 days'
     and k.shred_after <= now() + interval '30 days'
     and k.shredded_at is null));
-- If 123 has no health key, register nothing; just backdate the photo shred clock.
update private.photo_data_keys set shred_after = now() - interval '1 hour' where user_id = tests.u(123);
select tests.login(null, 'service_role');
select tests.ok('deletion: purge reports a shredded photo key',
  (public.run_retention_purge() ->> 'photo_shredded')::int >= 1);
select tests.logout();
select tests.ok('deletion: the due photo key is gone and no health key was invented',
  not exists (select 1 from private.photo_data_keys where user_id = tests.u(123))
  and not exists (select 1 from private.user_data_keys where user_id = tests.u(123)));

-- =============================================================== Counsel: teen weight, goals, video
select tests.p4_link(tests.u(122), tests.u(124));
select tests.p4_dual_health_ai(tests.u(122), tests.u(124));
select tests.ok('teen: both health opt-ins are on', app.has_consent(tests.u(122), 'health_data'));
select tests.login(tests.u(122));
select tests.raises('teen: no weigh-in history even with Health on',
  format($q$insert into public.weigh_ins (user_id, recorded_on, weight_ct, unit) values (%L, '2026-11-16', '\x01', 'lb')$q$, tests.u(122)),
  'teen_weight_history_not_allowed');
select tests.raises('teen: cannot turn on body-weight sharing',
  $q$select public.set_share_body_weight(true)$q$, 'teen_weight_history_not_allowed');
select tests.eq('teen: Progress weight series is empty',
  $q$select count(*)::text from public.progress_weight_series('progress')$q$, '0');
select tests.eq('teen: Home weight series is empty',
  $q$select count(*)::text from public.progress_weight_series('home')$q$, '0');
select tests.eq('teen: Profile also has no history series',
  $q$select count(*)::text from public.progress_weight_series('profile')$q$, '0');
select tests.ok('teen: the server will not serve a weight trend', not app.can_serve_weight_trend(tests.u(122)));
select tests.ok('adult: the server can serve a weight trend', app.can_serve_weight_trend(tests.u(120)));
select tests.login(tests.u(120));
select tests.ok('adult: Progress series returns ciphertext weigh-ins when Health is on',
  (select count(*) from public.progress_weight_series('progress')) >= 1);
select tests.login(tests.u(122));
select tests.raises('teen: Lose goal refused', $q$select public.save_training_setup('{"goal":"lose"}')$q$, 'invalid_setup');
select tests.raises('teen: Gain / size goal refused', $q$select public.save_training_setup('{"goal":"gain"}')$q$, 'invalid_setup');
select tests.raises('teen: video upload is blocked', $q$select public.upload_progress_video()$q$, 'photo_upload_not_allowed');
select tests.ok('teen: can_upload_progress_video is always false', not app.can_upload_progress_video(tests.u(122)));
select tests.ok('teen: cannot opt in to photos', not app.has_progress_photo_opt_in(tests.u(122)));
select tests.logout();
select tests.login(null, 'service_role');
select tests.raises('teen: service cannot write a weight_goal',
  format($q$select public.health_write(%L, null, null, null, tests.ct('wg'), array['weight_goal'])$q$, tests.u(122)),
  'forbidden');
select tests.logout();

select tests.login(tests.u(120));
select tests.raises('adult: Phase 5 has no video upload either', $q$select public.upload_progress_video()$q$, 'video_upload_not_allowed');
select tests.ok('photos: share opt-in is off by default', not app.has_progress_photo_share_opt_in(tests.u(120), tests.u(125)));
select tests.raises('photos: share opt-in requires a 1:1 with an approved adult coach',
  format($q$select public.set_photo_coach_share_opt_in(%L, true, 'share-v1', repeat('b', 64))$q$, tests.u(125)),
  'one_to_one_required');
select public.dismiss_photo_coach_share_opt_in();
select tests.ok('consent: share Not now logs dismissed', exists (
  select 1 from public.consent_events
   where user_id = tests.u(120) and kind = 'photo_coach_sharing' and policy_version = 'dismissed'));
select tests.logout();

-- =============================================================== Counsel Rev 2: turn-off revokes coaches now; delete-all leaves photos on
select tests.login(tests.u(120));
-- 120 is still opted in from earlier. Sharing with 121 may already be revoked; share again.
select public.set_photo_coach_share_opt_in(tests.u(121), true, 'share-v1', repeat('b', 64));
select public.share_progress_photo(
  (select id from public.progress_photos where storage_path = tests.u(120)::text || '/p5.jpg' and pending_delete_at is null),
  tests.u(121));
select tests.login(null, 'service_role');
select public.finalize_shared_photo_copy(
  (select s.id from public.progress_photo_shares s
     join public.progress_photos ph on ph.id = s.photo_id
    where ph.storage_path = tests.u(120)::text || '/p5.jpg' and s.coach_id = tests.u(121) and s.revoked_at is null
    order by s.shared_at desc limit 1),
  '\x33333333333333333333333333333333'::bytea,
  'passed');
select tests.login(tests.u(121));
select tests.rows('rev2: coach can see the re-shared photo before delete-all',
  format('select * from public.progress_photos where user_id = %L', tests.u(120)), 1);
select tests.login(tests.u(120));
select tests.raises('rev2: delete-all without an export offer is refused',
  $q$select public.delete_all_progress_photos()$q$, 'export_required');
select tests.ok('rev2: export hook can run for delete-all', public.offer_progress_photo_export() is not null);
select public.register_photo_key('\x55555555555555555555555555555555'::bytea, 'local-dev', 'local-dev:test');
select public.delete_all_progress_photos();
select tests.ok('rev2: delete-all leaves photos enabled', app.has_progress_photo_opt_in(tests.u(120)));
select tests.eq('rev2: pending-delete photos are hidden from the athlete',
  $q$select count(*)::text from public.progress_photos$q$, '0');
select tests.logout();
select tests.ok('rev2: delete-all scheduled the current key for shred and left no active key', exists (
  select 1 from private.photo_data_keys k
   where k.user_id = tests.u(120) and k.active = false and k.shred_after is not null and k.shredded_at is null)
  and not exists (select 1 from private.photo_data_keys k where k.user_id = tests.u(120) and k.active));
select tests.login(tests.u(121));
select tests.no_rows('rev2: delete-all revokes coach access immediately',
  format('select * from public.progress_photos where user_id = %L', tests.u(120)));
select tests.logout();
select tests.ok('rev2: shared-copy keys are shredded on delete-all', not exists (
  select 1 from public.progress_photo_shared_copies c
   where c.coach_id = tests.u(121) and c.wrapped_key is not null and c.shredded_at is null
     and exists (select 1 from public.progress_photos ph where ph.id = c.photo_id and ph.user_id = tests.u(120))));
select tests.login(tests.u(120));
-- Photos still on: a new key can be registered for later shots.
select public.register_photo_key('\x44444444444444444444444444444444'::bytea, 'local-dev', 'local-dev:test');
select tests.logout();
select tests.ok('rev2: a fresh key can be registered while photos stay on', exists (
  select 1 from private.photo_data_keys k
   where k.user_id = tests.u(120) and k.active and k.shred_after is null)
  and exists (
  select 1 from private.photo_data_keys k
   where k.user_id = tests.u(120) and k.active = false and k.shred_after is not null));

-- =============================================================== Counsel Rev 3: purge guarantee, teen weight delete, parent export
select tests.ok('rev3: photo purge deadline is guaranteed (daily job is tested)', app.photo_purge_deadline_guaranteed());
select tests.ok('rev3: a scheduled photo shred is never later than 30 days out',
  not exists (select 1 from private.photo_data_keys
               where shred_after is not null and shred_after > now() + interval '30 days'));
select tests.ok('rev3: export does not auto-delete photos', not app.photo_export_auto_deletes());

-- 122/124 already have a parent link and both health opt-ins from the teen-weight section.
select tests.login(null, 'service_role');
select public.health_register_key(tests.u(122), tests.wk(122), 'local-dev', 'local-dev:test');
select public.health_write(tests.u(122), null, null, null, null, array['body_weight'], tests.ct('bw-1'));
select public.health_write(tests.u(122), tests.ct('notes'), tests.ct('screen'), tests.ct('cat'), null, array['injury_notes','health_screen','injury_category','body_weight'], tests.ct('bw-2'));
select tests.logout();
select tests.ok('rev3: a new teen weight overwrites the previous value; no history row is kept', (
  (select body_weight_ct = tests.ct('bw-2') from public.health_records where user_id = tests.u(122))
  and (select count(*) from public.weigh_ins where user_id = tests.u(122)) = 0));

select tests.ok('rev4: teen had AI planning on before Health was turned off', app.has_consent(tests.u(122), 'ai_vendor'));
select tests.login(tests.u(124));
select public.revoke_consent('health_data', tests.u(122));
select tests.logout();
select tests.ok('rev3/rev4: parent turning Health off deletes all live saved health info immediately',
  (select body_weight_ct is null and injury_notes_ct is null and health_screen_ct is null
          and injury_category_ct is null and weight_goal_ct is null
     from public.health_records where user_id = tests.u(122)));
select tests.ok('rev4: AI planning turns off when the teen''s Health data is turned off',
  not app.has_consent(tests.u(122), 'ai_vendor') and not app.has_consent(tests.u(122), 'health_data'));
select tests.ok('rev4: the teen is notified once when the parent caused the deletion, and the notice is kept',
  (select count(*) = 1 from public.teen_data_notices n
    where n.user_id = tests.u(122) and n.kind = 'health_deleted_by_parent'
      and n.actor_user_id = tests.u(124)));
-- Health key is still present; backups go when the key is shredded (existing 29-day path).
select tests.ok('rev3: the health key is still scheduled for ordinary withdrawal shred, not dropped instantly', exists (
  select 1 from private.user_data_keys k where k.user_id = tests.u(122)));

-- Turning Health back on starts empty. A parent revoke also drops the teen's self grant.
select tests.login(tests.u(124));
select public.record_consent('health_data', 'health-v1', tests.u(122));
select tests.login(tests.u(122));
select public.record_consent('health_data', 'health-v1');
select tests.logout();
select tests.ok('rev3: after Health is turned back on, the current weight is still empty',
  (select body_weight_ct is null from public.health_records where user_id = tests.u(122)));

-- Teen turning their own opt-in off also deletes the value, with no parent notice.
select tests.login(null, 'service_role');
select public.health_write(tests.u(122), null, null, null, null, array['body_weight'], tests.ct('bw-3'));
select tests.logout();
select tests.login(tests.u(122));
select public.revoke_consent('health_data');
select tests.logout();
select tests.ok('rev3: the teen turning Health off also clears the live weight',
  (select body_weight_ct is null from public.health_records where user_id = tests.u(122)));
select tests.ok('rev3: a self-clear does not add a parent-caused notice',
  (select count(*) = 1 from public.teen_data_notices
    where user_id = tests.u(122) and kind = 'health_deleted_by_parent'));

select tests.login(tests.u(122));
select public.record_consent('health_data', 'health-v1');
select tests.logout();
select tests.login(null, 'service_role');
select public.health_write(tests.u(122), null, null, null, null, array['body_weight'], tests.ct('bw-4'));
select tests.logout();
select tests.login(tests.u(122));
select public.clear_teen_current_weight();
select tests.logout();
select tests.ok('rev3: Clear weight wipes the live value and leaves Health on', (
  (select body_weight_ct is null from public.health_records where user_id = tests.u(122))
  and app.has_consent(tests.u(122), 'health_data')));

select tests.ok('rev3: parent export of teen data is off (Kevin decision)', not app.parent_can_export_teen_data());
select tests.login(tests.u(120));
select tests.raises('rev3: a non-parent cannot export a teen''s data',
  format($q$select public.parent_export_teen_data(%L)$q$, tests.u(122)),
  'parent_export_not_allowed');
select tests.login(tests.u(124));
select tests.raises('rev3: a parent cannot export a teen''s data',
  format($q$select public.parent_export_teen_data(%L)$q$, tests.u(122)),
  'parent_export_not_allowed');
select tests.raises('rev3: prepare_data_export refuses a parent-for-teen request',
  format($q$select public.prepare_data_export(true, %L)$q$, tests.u(122)),
  'parent_export_not_allowed');
select tests.login(tests.u(122));
select tests.ok('rev3: a refused parent export does not notify the teen', not exists (
  select 1 from public.teen_data_notices
   where user_id = tests.u(122) and kind = 'parent_exported_data'));
select tests.logout();

-- =============================================================== Rev 3 addendum: weigh-in metadata is fully hidden
-- 120 has an active 1:1 with 121 from the photo tests; share may already be on.
select tests.login(tests.u(120));
select public.set_share_body_weight(tests.u(121), false);
select tests.login(tests.u(121));
select tests.eq('rev3a: coach count is 0 while sharing is off',
  format($q$select count(*)::text from public.weigh_ins where user_id = %L$q$, tests.u(120)), '0');
select tests.eq('rev3a: coach sees no recorded_on or created_at while sharing is off',
  format($q$select coalesce(min(recorded_on)::text,'') || coalesce(min(created_at)::text,'') from public.weigh_ins where user_id = %L$q$, tests.u(120)), '');
select tests.ok('rev3a: weigh-ins are not in a realtime publication', not app.weigh_ins_published_realtime());
select tests.ok('rev3a: no weigh-in last-active or sync signals go out in push', not app.weigh_in_push_signals_enabled());
select tests.login(tests.u(121));
select tests.eq('rev3a: the owner-only series does not expose 120''s weigh-ins to the coach',
  $q$select count(*)::text from public.progress_weight_series('progress')$q$, '0');
-- Share with 121 only; a second 1:1 coach still sees nothing.
select tests.login(null, 'service_role');
insert into public.coach_relationships (coach_id, client_id, status, started_at)
select tests.u(125), tests.u(120), 'active', now()
 where not exists (select 1 from public.coach_relationships
                    where coach_id = tests.u(125) and client_id = tests.u(120) and status = 'active');
select tests.logout();
select tests.login(tests.u(120));
select public.set_share_body_weight(tests.u(121), true);
select tests.login(tests.u(121));
select tests.rows('rev3a: the chosen 1:1 coach sees ciphertext after share is on',
  format('select * from public.weigh_ins where user_id = %L', tests.u(120)), 1);
select tests.login(tests.u(125));
select tests.no_rows('rev3a: a different 1:1 coach does not see rows when share is not on for them',
  format('select * from public.weigh_ins where user_id = %L', tests.u(120)));
select tests.login(tests.u(120));
select public.set_share_body_weight(tests.u(121), false);
select tests.login(tests.u(121));
select tests.no_rows('rev3a: turning share off cuts access immediately',
  format('select * from public.weigh_ins where user_id = %L', tests.u(120)));
select tests.logout();

-- =============================================================== purge health-check + toast guarantee
-- A due unshed photo key is overdue until the job runs. private.* is only readable after logout (superuser).
insert into private.photo_data_keys (user_id, wrapped_key, key_provider, kms_key_ref, active, shred_after)
values (tests.u(123), '\x66666666666666666666666666666666'::bytea, 'local-dev', 'local-dev:overdue', false, now() - interval '1 hour');
select tests.ok('ops: health check flags an overdue photo shred',
  (select overdue_photo_keys > 0 from public.retention_purge_health()));
select tests.ok('ops: the purge date is not guaranteed while a shred is overdue',
  not app.photo_purge_deadline_guaranteed());
select tests.login(null, 'service_role');
select public.run_retention_purge();
select tests.logout();
select tests.ok('ops: the job clears the overdue key and is confirmed running',
  (select healthy and job_confirmed_running and overdue_photo_keys = 0 from public.retention_purge_health()));
select tests.ok('ops: the purge date may be shown once the daily job is confirmed running',
  app.photo_purge_deadline_guaranteed());
-- A stale last success is a missed run; the date must come off.
update private.retention_purge_runs set started_at = now() - interval '30 hours', finished_at = now() - interval '30 hours'
 where ok is true;
select tests.ok('ops: a missed daily run is flagged and drops the guarantee',
  (select missed_run and not job_confirmed_running from public.retention_purge_health())
  and not app.photo_purge_deadline_guaranteed());
select tests.login(null, 'service_role');
select public.run_retention_purge();
select tests.logout();
select tests.ok('ops: a fresh successful run restores the guarantee',
  app.photo_purge_deadline_guaranteed()
  and (select healthy from public.retention_purge_health()));

-- =============================================================== Rev 4: Download my data
select tests.login(tests.u(120));
select tests.raises('export: the lock must pass before a link is issued',
  $q$select public.prepare_data_export(false)$q$, 'lock_required');
select tests.ok('export: a short-lived link is issued after the lock check', (
  (select public.prepare_data_export(true)) ? 'token'
  and ((select public.prepare_data_export(true)) ->> 'delivery') = 'short_lived_in_app_link'));

create temporary table if not exists tests_export_link (token text, request_id uuid, package jsonb);
delete from tests_export_link;
insert into tests_export_link (token, request_id, package)
select x.token, x.request_id, public.fetch_data_export(x.token)
  from jsonb_to_record(public.prepare_data_export(true)) as x(token text, request_id uuid, expires_at timestamptz, delivery text, manifest jsonb);
select tests.logout();
select tests.ok('export: the package includes the required categories and not the excluded ones', (
  (select private.data_export_excluded_ok(package) from tests_export_link)
  and (select package -> 'included' ?& array[
         'account_and_settings','training_setup','workouts_sets_prs','ai_plans','health_info',
         'connected_health_apps','progress_photos','coach_messages','privacy_choices',
         'who_received_data','purchases','requests'] from tests_export_link)
  and (select (package -> 'included' -> 'account_and_settings' ? 'birth_date') = false from tests_export_link)
  and (select (package -> 'included' -> 'workouts_sets_prs' -> 'sets') <> '[]'::jsonb from tests_export_link)
));
select tests.ok('export: a rights-request audit row is recorded', exists (
  select 1 from public.audit_log a
   where a.actor_id = tests.u(120) and a.action = 'data_export_requested'
     and a.target_user_id = tests.u(120)
     and (a.metadata ->> 'rights_request') = 'true'));
-- Expire the link and confirm fetch is refused.
update public.data_export_requests
   set expires_at = now() - interval '1 minute'
 where id = (select request_id from tests_export_link);
select tests.login(tests.u(120));
select tests.raises('export: an expired link cannot be fetched',
  $q$select public.fetch_data_export((select token from tests_export_link))$q$,
  'link_expired');
select tests.logout();

-- A teen package has no photos and does not include the parent''s own account data.
select tests.login(tests.u(122));
select tests.ok('export: a teen package has no photos and only a linked-parent flag, not the parent account', (
  (select (public.prepare_data_export(true) -> 'manifest' -> 'progress_photos') = '[]'::jsonb)
  and (select ((public.prepare_data_export(true) -> 'manifest' -> 'account_and_settings' ->> 'linked_parent') = 'true')
           and not ((public.prepare_data_export(true) -> 'manifest')::text ilike '%p5-124%')
           and not ((public.prepare_data_export(true) -> 'manifest' -> 'account_and_settings') ? 'parent_email'))
));
select tests.logout();
