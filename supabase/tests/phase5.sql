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

insert into public.set_logs (user_id, exercise_id, performed_on, set_index, time_seconds, distance, power, done) values
  (tests.u(120), '53000000-0000-0000-0000-000000000002', '2026-11-01', 0, 120, 1000, 180, true);

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
  $q$select public.set_progress_photo_opt_in(true)$q$, 'photo_upload_not_allowed');
select tests.ok('photos: minor still has no opt-in', not app.has_progress_photo_opt_in(tests.u(122)));
select tests.login(tests.u(124));
-- parent link + health so the age block is not confused with missing consent
-- (minor already signed up; parent link via existing helpers if present, otherwise skip health and rely on age)
select tests.logout();

select tests.login(tests.u(120));
select tests.raises('photos: health on, opt-in off, upload refused',
  format($q$insert into public.progress_photos (user_id, storage_path) values (%L, %L)$q$, tests.u(120), tests.u(120)::text || '/p5.jpg'),
  'photo_upload_not_allowed');
select public.set_progress_photo_opt_in(true);
select tests.ok('photos: explicit opt-in is recorded', app.has_progress_photo_opt_in(tests.u(120)));
select tests.affected('photos: adult with health + opt-in can add a row',
  format($q$insert into public.progress_photos (user_id, storage_path, captured_on) values (%L, %L, '2026-11-16')$q$, tests.u(120), tests.u(120)::text || '/p5.jpg'), 1);
select tests.affected('photos: adult storage upload into own folder',
  format($q$insert into storage.objects (bucket_id, name) values ('progress-photos', %L)$q$, tests.u(120)::text || '/p5.jpg'), 1);

select tests.raises('photos: share requires coach_sharing consent',
  format($q$select public.share_progress_photo((select id from public.progress_photos where storage_path = %L), %L)$q$,
         tests.u(120)::text || '/p5.jpg', tests.u(121)),
  'consent_required');
select public.record_consent('coach_sharing', 'v1');
select tests.raises('photos: cannot share with a coach who is not in an active 1:1',
  format($q$select public.share_progress_photo((select id from public.progress_photos where storage_path = %L), %L)$q$,
         tests.u(120)::text || '/p5.jpg', tests.u(125)),
  'one_to_one_required');
select public.share_progress_photo(
  (select id from public.progress_photos where storage_path = tests.u(120)::text || '/p5.jpg'),
  tests.u(121));
select tests.login(tests.u(121));
select tests.rows('photos: 1:1 coach sees the shared photo row',
  format('select * from public.progress_photos where user_id = %L', tests.u(120)), 1);
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
