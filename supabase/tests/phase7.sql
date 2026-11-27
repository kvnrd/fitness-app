-- Phase 7 Form check: saved numbers and skeletons, coach sharing, and the 16–17 rules.
-- Users: 180 adult client, 181 coach (cleared for minors), 182 teen, 183 teen's parent,
--        184 another verified coach, 185 outsider adult, 186 adult with no health opt-in.

select tests.logout();
insert into auth.users (id, email)
  select tests.u(i), 'p7-' || i || '@example.invalid' from generate_series(180, 186) i;

select tests.ok('phase7 signup: adults',
  (select bool_and((tests.signup(tests.u(i), tests.dob(30)) ->> 'is_minor') = 'false')
     from unnest(array[180,181,183,184,185,186]) i));
select tests.ok('phase7 signup: teen is a minor',
  (tests.signup(tests.u(182), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.p4_link(tests.u(182), tests.u(183));
select tests.p4_dual_health_ai(tests.u(182), tests.u(183));

select tests.login(tests.u(183)); select public.record_consent('coach_sharing', 'coach-v1', tests.u(182));
select tests.login(tests.u(182)); select public.record_consent('coach_sharing', 'coach-v1');
select tests.login(tests.u(180));
select public.record_consent('health_data', 'health-v1');
select public.record_consent('coach_sharing', 'coach-v1');
select tests.logout();

select private.upsert_minors_attestation(tests.u(181), null, 'coach-attest-minors-v1', tests.h('8'));
select tests.login(null, 'service_role');
select public.set_user_role(tests.u(181), 'coach_verified');
select public.set_user_role(tests.u(184), 'coach_verified');
select public.set_coach_nsopw(tests.u(181), 'passed', 'nsopw-test-181');
select public.set_coach_minor_training(tests.u(181), 'training-test-181');
insert into public.coach_relationships (coach_id, client_id, status, started_at)
values (tests.u(181), tests.u(180), 'active', now()), (tests.u(181), tests.u(182), 'active', now());
select tests.logout();

create function tests.p7_metrics(p_movement text default 'squat') returns jsonb language sql immutable as $$
  select jsonb_build_object('movement', p_movement, 'repCount', 1, 'barDrift', 0.1,
    'reps', jsonb_build_array(jsonb_build_object('index', 1, 'bottomAngle', 80, 'topAngle', 172,
      'durationMs', 2000, 'flags', jsonb_build_array('depth_short'))))
$$;
create function tests.p7_skeleton(p_points integer default 66) returns jsonb language sql immutable as $$
  select jsonb_build_array(jsonb_build_object('t', 0,
    'p', (select jsonb_agg(0.5) from generate_series(1, p_points))))
$$;
create table tests.p7 (k text primary key, id uuid);
grant all on tests.p7 to public;

-- ------------------------------------------------------------------ saving
select tests.login(tests.u(186));
select tests.raises('phase7: saving needs the health opt-in',
  $q$select public.save_form_check('squat', now(), tests.p7_metrics(), tests.p7_skeleton())$q$, 'consent_required');

select tests.login(tests.u(180));
select tests.raises('phase7: a skeleton with the wrong point count is refused (no extra face slots)',
  $q$select public.save_form_check('squat', now(), tests.p7_metrics(), tests.p7_skeleton(99))$q$, 'invalid_skeleton');
select tests.raises('phase7: a skeleton frame with an extra key is refused',
  $q$select public.save_form_check('squat', now(), tests.p7_metrics(),
      jsonb_build_array(jsonb_build_object('t', 0, 'p', (select jsonb_agg(0.5) from generate_series(1, 66)), 'face', '[]'::jsonb)))$q$,
  'invalid_skeleton');
select tests.raises('phase7: metrics with extra fields (a name, a note) are refused',
  $q$select public.save_form_check('squat', now(), tests.p7_metrics() || '{"name":"Alex"}'::jsonb)$q$, 'invalid_metrics');
select tests.raises('phase7: metrics must match the movement',
  $q$select public.save_form_check('deadlift', now(), tests.p7_metrics('squat'))$q$, 'invalid_metrics');
select tests.blocked('phase7: no direct insert into form_checks',
  format($q$insert into public.form_checks (user_id, movement, recorded_at, rep_count, metrics) values (%L, 'squat', now(), 1, tests.p7_metrics())$q$, tests.u(180)));

insert into tests.p7 values ('adult_fc', public.save_form_check('squat', now(), tests.p7_metrics(), tests.p7_skeleton()));
select tests.eq('phase7: rep_count comes from the reps',
  $q$select rep_count::text from public.form_checks where id = (select id from tests.p7 where k = 'adult_fc')$q$, '1');
select tests.raises('phase7: sharing with a coach who is not yours is refused',
  format($q$select public.share_form_check((select id from tests.p7 where k = 'adult_fc'), %L, true)$q$, tests.u(184)),
  'not_your_coach');
insert into tests.p7 values ('adult_share',
  public.share_form_check((select id from tests.p7 where k = 'adult_fc'), tests.u(181), true));
select tests.logout();

-- ------------------------------------------------------------------ adult: own coach sees it, nobody else
select tests.login(tests.u(181));
select tests.rows('phase7: own coach sees the adult form check',
  $q$select 1 from public.form_checks where id = (select id from tests.p7 where k = 'adult_fc')$q$, 1);
select tests.eq('phase7: adult share may include video',
  $q$select include_video::text from public.form_check_shares where id = (select id from tests.p7 where k = 'adult_share')$q$, 'true');
select public.coach_review_form_check((select id from tests.p7 where k = 'adult_share'), 'Sit back a little more.');
select tests.ok('phase7: own coach can leave a review note on an adult form check',
  (select coach_reviewed_at is not null from public.form_check_shares where id = (select id from tests.p7 where k = 'adult_share')));
select tests.blocked('phase7: a coach cannot write share rows directly',
  $q$update public.form_check_shares set include_video = false$q$);

select tests.login(tests.u(184));
select tests.no_rows('phase7: another coach sees no form checks', $q$select 1 from public.form_checks$q$);
select tests.no_rows('phase7: another coach sees no shares', $q$select 1 from public.form_check_shares$q$);
select tests.login(tests.u(185));
select tests.no_rows('phase7: an outsider sees no form checks', $q$select 1 from public.form_checks$q$);
select tests.login(null, 'anon');
select tests.no_rows('phase7: anon sees no form checks', $q$select 1 from public.form_checks$q$);

select tests.login(tests.u(180));
select public.revoke_form_check_share((select id from tests.p7 where k = 'adult_share'));
select tests.login(tests.u(181));
select tests.no_rows('phase7: a revoked share disappears from the coach at once',
  $q$select 1 from public.form_checks where id = (select id from tests.p7 where k = 'adult_fc')$q$);

select tests.login(tests.u(180));
insert into tests.p7 values ('adult_share2',
  public.share_form_check((select id from tests.p7 where k = 'adult_fc'), tests.u(181), false));
select tests.login(tests.u(181));
select tests.rows('phase7: a new share shows again', $q$select 1 from public.form_check_shares where revoked_at is null$q$, 1);
select tests.login(tests.u(180));
select public.end_coach_relationship((select id from public.coach_relationships
  where coach_id = tests.u(181) and client_id = tests.u(180) and status = 'active'));
select tests.login(tests.u(181));
select tests.no_rows('phase7: ending coaching hides every shared form check',
  format($q$select 1 from public.form_checks where user_id = %L$q$, tests.u(180)));
select tests.logout();

-- ------------------------------------------------------------------ 16–17: never video, parent must approve
select tests.login(tests.u(182));
insert into tests.p7 values ('teen_fc', public.save_form_check('squat', now(), tests.p7_metrics(), tests.p7_skeleton()));
select tests.raises('phase7: a teen cannot share video with a coach',
  format($q$select public.share_form_check((select id from tests.p7 where k = 'teen_fc'), %L, true)$q$, tests.u(181)),
  'minor_video_never_shared');
insert into tests.p7 values ('teen_share',
  public.share_form_check((select id from tests.p7 where k = 'teen_fc'), tests.u(181), false));

select tests.login(tests.u(181));
select tests.no_rows('phase7 minor negative: coach sees no teen form check before the parent approves',
  format($q$select 1 from public.form_checks where user_id = %L$q$, tests.u(182)));
select tests.no_rows('phase7 minor negative: coach sees no teen share before the parent approves',
  format($q$select 1 from public.form_check_shares where owner_id = %L$q$, tests.u(182)));
select tests.raises('phase7 minor negative: coach cannot review before the parent approves',
  $q$select public.coach_review_form_check((select id from tests.p7 where k = 'teen_share'), 'Nice.')$q$, 'not_found');

select tests.login(tests.u(185));
select tests.raises('phase7: someone who is not the parent cannot approve',
  $q$select public.parent_approve_form_check_share((select id from tests.p7 where k = 'teen_share'))$q$, 'not_parent');
select tests.login(tests.u(181));
select tests.raises('phase7: the coach cannot approve for the parent',
  $q$select public.parent_approve_form_check_share((select id from tests.p7 where k = 'teen_share'))$q$, 'not_parent');

select tests.login(tests.u(183));
select tests.rows('phase7: the parent sees the pending share', $q$select 1 from public.form_check_shares where parent_opt_in_at is null$q$, 1);
select public.parent_approve_form_check_share((select id from tests.p7 where k = 'teen_share'));

select tests.login(tests.u(181));
select tests.rows('phase7: after both opt in, the coach sees the teen skeleton and numbers',
  format($q$select 1 from public.form_checks where user_id = %L and skeleton is not null and metrics is not null$q$, tests.u(182)), 1);
select tests.eq('phase7 minor negative: the teen share carries no video',
  $q$select (include_video or video_path is not null)::text from public.form_check_shares where id = (select id from tests.p7 where k = 'teen_share')$q$, 'false');
select tests.raises('phase7 minor negative: coach review notes to a teen wait for the Phase 8 safeguards',
  $q$select public.coach_review_form_check((select id from tests.p7 where k = 'teen_share'), 'Nice.')$q$, 'minor_review_note_not_allowed');
select tests.no_rows('phase7 minor negative: the coach still sees no teen weight',
  format($q$select 1 from public.weigh_ins where user_id = %L$q$, tests.u(182)));
select tests.login(tests.u(184));
select tests.no_rows('phase7 minor negative: another coach sees no teen form check',
  format($q$select 1 from public.form_checks where user_id = %L$q$, tests.u(182)));
select tests.logout();

select tests.login(null, 'service_role');
select tests.raises('phase7 minor negative: even the service role cannot attach video to a teen share',
  $q$update public.form_check_shares set include_video = true where id = (select id from tests.p7 where k = 'teen_share')$q$,
  'minor_video_never_shared');
select tests.logout();

select tests.login(tests.u(183));
select public.revoke_form_check_share((select id from tests.p7 where k = 'teen_share'));
select tests.login(tests.u(181));
select tests.no_rows('phase7 minor negative: the parent can stop sharing and the coach loses it',
  format($q$select 1 from public.form_checks where user_id = %L$q$, tests.u(182)));
select tests.logout();

-- ------------------------------------------------------------------ owner delete
select tests.login(tests.u(182));
select tests.affected('phase7: the owner can delete their form check',
  $q$delete from public.form_checks where id = (select id from tests.p7 where k = 'teen_fc')$q$, 1);
select tests.logout();
select tests.ok('phase7: deleting a form check removes its shares',
  not exists (select 1 from public.form_check_shares where id = (select id from tests.p7 where k = 'teen_share')));
