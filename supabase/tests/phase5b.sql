
-- Invoker helper: health_read requires service_role, and may raise forbidden when
-- the coach has no coach_sharing view of the teen. Either way the coach sees no row.
create or replace function tests.health_records_hidden(p_target uuid)
returns boolean language plpgsql security invoker as $$
begin
  begin
    return not exists (select 1 from public.health_records where user_id = p_target);
  exception when insufficient_privilege then
    return true;
  when others then
    if sqlerrm like 'permission denied%' or sqlerrm like 'forbidden%' then return true; end if;
    raise;
  end;
end $$;

create or replace function tests.health_read_empty(p_actor uuid, p_target uuid)
returns boolean language plpgsql security invoker as $$
begin
  begin
    return not exists (select 1 from public.health_read(p_actor, p_target));
  exception when others then
    if sqlerrm like 'forbidden%' then return true; end if;
    raise;
  end;
end $$;

-- Phase 5b Option 3: a coach never sees a minor's weight, even if a share row is forced.
-- Users 120–125 and teen 122's dual health opt-ins / weigh-in were set up in phase5.sql.

select tests.ok('phase5b: both health opt-ins stay on for teen 122', app.has_consent(tests.u(122), 'health_data'));
select tests.ok('phase5b: the teen may be served their own trend', app.can_serve_weight_trend(tests.u(122)));

select tests.login(tests.u(122));
select tests.raises('phase5b: a teen cannot turn on coach weight sharing',
  $q$select public.set_share_body_weight(true)$q$,
  'teen_weight_history_not_allowed');
select tests.logout();

-- Give 121 an active 1:1 with the teen and force a share row; the coach still sees nothing.
-- The relationship trigger requires full minor clearance (attestation + NSOPW + training).
select tests.logout();
select private.upsert_minors_attestation(tests.u(121), null, 'coach-attest-minors-v1', tests.h('8'));
select tests.login(null, 'service_role');
select public.set_coach_nsopw(tests.u(121), 'passed', 'nsopw-test-121');
select public.set_coach_minor_training(tests.u(121), 'training-test-121');
insert into public.coach_relationships (coach_id, client_id, status, started_at)
select tests.u(121), tests.u(122), 'active', now()
 where not exists (select 1 from public.coach_relationships
                    where coach_id = tests.u(121) and client_id = tests.u(122) and status = 'active');
insert into public.body_weight_share (user_id, coach_id, sharing, updated_at)
select tests.u(122), tests.u(121), true, now()
 where not exists (select 1 from public.body_weight_share s
                    where s.user_id = tests.u(122) and s.coach_id = tests.u(121));
update public.body_weight_share set sharing = true
 where user_id = tests.u(122) and coach_id = tests.u(121);
select tests.logout();

select tests.ok('phase5b: shares_body_weight_with is false for a minor even with a share row',
  not app.shares_body_weight_with(tests.u(122), tests.u(121)));
select tests.ok('phase5b: coach_may_see_body_weight is false for a minor',
  not app.coach_may_see_body_weight(tests.u(122), tests.u(121)));

select tests.login(tests.u(121));
select tests.eq('phase5b: coach sees no teen weigh-in rows even if a share row exists',
  format($q$select count(*)::text from public.weigh_ins where user_id = %L$q$, tests.u(122)), '0');
select tests.eq('phase5b: owner-only series does not expose the teen weigh-in to the coach',
  $q$select count(*)::text from public.progress_weight_series('progress')$q$, '0');
select tests.logout();

-- Coach Terms acceptance (kind coach_terms, same version/hash rules as Terms).
select tests.login(tests.u(121));
select tests.raises('coach-terms: invalid hash is refused',
  $q$select public.accept_coach_terms('coach-terms-v0.1-draft', 'not-a-hash')$q$,
  'invalid_text_hash');
select tests.raises('coach-terms: an empty version is refused',
  $q$select public.accept_coach_terms('', repeat('a', 64))$q$,
  'invalid_policy_version');
select public.accept_coach_terms('coach-terms-v0.1-draft', repeat('c', 64));
select tests.ok('coach-terms: a coach acceptance is recorded on consents and consent_events',
  exists (select 1 from public.consents c
           where c.user_id = tests.u(121) and c.kind = 'coach_terms' and c.granted
             and c.policy_version = 'coach-terms-v0.1-draft' and c.text_hash = repeat('c', 64))
  and exists (select 1 from public.consent_events e
               where e.user_id = tests.u(121) and e.kind = 'coach_terms' and e.granted
                 and e.policy_version = 'coach-terms-v0.1-draft' and e.text_hash = repeat('c', 64)));
select tests.logout();

select tests.login(tests.u(122));
select tests.raises('coach-terms: a 16-17 cannot accept Coach Terms',
  $q$select public.accept_coach_terms('coach-terms-v0.1-draft', repeat('c', 64))$q$,
  'forbidden');
select tests.logout();

-- Coaches never see a minor's health fields, even with an active 1:1.
select tests.login(null, 'service_role');
select tests.ok('phase5b: health_read for the coach of a minor returns no row',
  tests.health_read_empty(tests.u(121), tests.u(122)));
select tests.logout();

-- Lose fat stays adults only (still refused for the teen after Option 3).
select tests.login(tests.u(122));
select tests.raises('phase5b: lose-fat training goal stays adults only',
  $q$select public.save_training_setup('{"goal":"lose"}')$q$,
  'invalid_setup');
select tests.logout();


-- Counsel: if either teen health opt-in is off, store no weight (manual or wearable).
-- Coaches never read a teen's weight, goal weight, or health info.
-- 130 already has an auth.users row from phase5.sql (120–130). 131 and 132 do not.
-- 130 already has an auth.users row from phase5.sql (120–130). 131 and 132 do not.
insert into auth.users (id, email)
select tests.u(i), 'p5b-' || i || '@example.invalid' from generate_series(131, 132) i;
select tests.ok('phase5b: teen 130', (tests.signup(tests.u(130), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.ok('phase5b: parent 131', (tests.signup(tests.u(131), tests.dob(44)) ->> 'is_minor') = 'false');
select tests.ok('phase5b: coach 132', (tests.signup(tests.u(132), tests.dob(36)) ->> 'is_minor') = 'false');
select tests.login(null, 'service_role');
select public.set_user_role(tests.u(132), 'coach_verified');
select tests.logout();
select tests.p4_link(tests.u(130), tests.u(131));
select tests.p4_dual_health_ai(tests.u(130), tests.u(131));
select tests.ok('phase5b: 130 has both health opt-ins', app.has_consent(tests.u(130), 'health_data'));

select tests.login(tests.u(130));
select tests.affected('phase5b: with both opt-ins on, a manual weigh-in is stored',
  format($q$insert into public.weigh_ins (user_id, recorded_on, weight_ct, unit) values (%L, '2026-11-10', '\x11', 'lb')$q$, tests.u(130)), 1);
select public.ingest_synced_weight('garmin', '2026-11-11', '\x12', 'lb');
select tests.ok('phase5b: a Garmin weigh-in is stored when both opt-ins are on',
  exists (select 1 from public.weigh_ins where user_id = tests.u(130) and recorded_on = '2026-11-11' and source = 'garmin'));
select public.ingest_synced_weight('apple_health', '2026-11-12', '\x13', 'lb');
select tests.ok('phase5b: an Apple Health weigh-in is stored when both opt-ins are on',
  exists (select 1 from public.weigh_ins where user_id = tests.u(130) and recorded_on = '2026-11-12' and source = 'apple_health'));
select tests.logout();

-- Teen's own Health opt-in off.
select tests.login(tests.u(130));
select public.revoke_consent('health_data');
select tests.logout();
select tests.ok('phase5b: effective health consent is off when the teen revokes', not app.has_consent(tests.u(130), 'health_data'));
select tests.login(tests.u(130));
select tests.raises('phase5b: manual weigh-in is refused when the teen opt-in is off',
  format($q$insert into public.weigh_ins (user_id, recorded_on, weight_ct, unit) values (%L, '2026-11-13', '\x14', 'lb')$q$, tests.u(130)),
  'consent_required');
select tests.raises('phase5b: Garmin weight is refused when the teen opt-in is off',
  $q$select public.ingest_synced_weight('garmin', '2026-11-13', '\x14', 'lb')$q$,
  'consent_required');
select tests.raises('phase5b: Apple Health weight is refused when the teen opt-in is off',
  $q$select public.ingest_synced_weight('apple_health', '2026-11-13', '\x15', 'lb')$q$,
  'consent_required');
select tests.logout();
select tests.login(null, 'service_role');
select tests.raises('phase5b: health_write body_weight is refused when the teen opt-in is off',
  format($q$select public.health_write(%L, null, null, null, null, array['body_weight'], '\x16')$q$, tests.u(130)),
  'consent_required');
select tests.raises('phase5b: health_write weight_goal is refused when the teen opt-in is off',
  format($q$select public.health_write(%L, null, null, null, '\x17', array['weight_goal'])$q$, tests.u(130)),
  'consent_required');
select tests.logout();
select tests.ok('phase5b: no weigh-in was stored while the teen opt-in was off',
  not exists (select 1 from public.weigh_ins where user_id = tests.u(130) and recorded_on >= '2026-11-13'));

-- Restore teen, revoke parent.
select tests.login(tests.u(130));
select public.record_consent('health_data', 'health-v1');
select tests.logout();
select tests.login(tests.u(131));
select public.revoke_consent('health_data', tests.u(130));
select tests.logout();
select tests.ok('phase5b: effective health consent is off when the parent revokes', not app.has_consent(tests.u(130), 'health_data'));
select tests.login(tests.u(130));
select tests.raises('phase5b: manual weigh-in is refused when the parent opt-in is off',
  format($q$insert into public.weigh_ins (user_id, recorded_on, weight_ct, unit) values (%L, '2026-11-14', '\x18', 'lb')$q$, tests.u(130)),
  'consent_required');
select tests.raises('phase5b: Garmin weight is refused when the parent opt-in is off',
  $q$select public.ingest_synced_weight('garmin', '2026-11-14', '\x18', 'lb')$q$,
  'consent_required');
select tests.logout();

-- Restore both, give 132 a cleared 1:1 and coach_sharing, then assert the coach sees nothing.
select tests.login(tests.u(131));
select public.record_consent('health_data', 'health-v1', tests.u(130));
select tests.login(tests.u(130));
select public.record_consent('health_data', 'health-v1');
select tests.logout();
select tests.ok('phase5b: both opt-ins are on again', app.has_consent(tests.u(130), 'health_data'));
select tests.svc_write(tests.u(130), 'notes-130', 'screen-130');
select tests.login(null, 'service_role');
select public.health_write(tests.u(130), null, null, null, tests.ct('goal-130'), array['weight_goal']);
select tests.logout();
select tests.ok('phase5b: a teen may store a weight goal when both opt-ins are on',
  exists (select 1 from public.health_records where user_id = tests.u(130) and weight_goal_ct = tests.ct('goal-130')));
select private.upsert_minors_attestation(tests.u(132), null, 'coach-attest-minors-v1', tests.h('8'));
select tests.login(null, 'service_role');
select public.set_coach_nsopw(tests.u(132), 'passed', 'nsopw-test-132');
select public.set_coach_minor_training(tests.u(132), 'training-test-132');
insert into public.coach_relationships (coach_id, client_id, status, started_at)
values (tests.u(132), tests.u(130), 'active', now());
select tests.logout();
select tests.login(tests.u(131));
select public.record_consent('coach_sharing', 'coach-v1', tests.u(130));
select tests.logout();
select tests.login(tests.u(130));
select public.record_consent('coach_sharing', 'coach-v1');
select tests.logout();

select tests.login(tests.u(132));
select tests.eq('phase5b: coach 132 sees no teen weigh-ins',
  format($q$select count(*)::text from public.weigh_ins where user_id = %L$q$, tests.u(130)), '0');
select tests.eq('phase5b: coach 132 cannot read the teen weight series',
  $q$select count(*)::text from public.progress_weight_series('progress')$q$, '0');
select tests.logout();
select tests.login(null, 'service_role');
select tests.ok('phase5b: health_read for coach 132 of teen 130 returns no health or weight fields',
  tests.health_read_empty(tests.u(132), tests.u(130)));
select tests.logout();
select tests.ok('phase5b: shares_body_weight_with is false for teen 130',
  not app.shares_body_weight_with(tests.u(130), tests.u(132)));

select tests.login(tests.u(132));
select tests.ok('phase5b: coach 132 cannot read the teen health_records row',
  tests.health_records_hidden(tests.u(130)));
select tests.logout();
