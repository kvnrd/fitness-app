-- RLS / function tests. Runs after auth_stub.sql + migrations, as a superuser that switches roles
-- with tests.login(). Results land in tests.results; the runner prints them and exits 1 on any FAIL.
-- Each assertion records pass/fail; an unexpected SQL error aborts the whole run (also a failure).

create table tests.results (n bigserial primary key, name text not null, passed boolean not null, detail text);
grant insert on tests.results to public;
grant usage on sequence tests.results_n_seq to public;

create function tests.record(p_name text, p_ok boolean, p_detail text default '') returns void
language sql as $$ insert into tests.results (name, passed, detail) values (p_name, p_ok, p_detail || ' [as ' || current_user || ']') $$;

create function tests.u(n integer) returns uuid language sql immutable as
$$ select ('00000000-0000-0000-0000-' || lpad(to_hex(n), 12, '0'))::uuid $$;

create function tests.dob(years integer) returns date language sql stable as   -- age = years (birthday was yesterday)
$$ select (current_date - make_interval(years => years))::date - 1 $$;

create function tests.ok(p_name text, p_cond boolean) returns void language sql as
$$ select tests.record(p_name, coalesce(p_cond, false), 'condition not true') $$;

-- Passes when the query returns no rows OR is refused outright (permission denied).
create function tests.no_rows(p_name text, p_sql text) returns void language plpgsql as $$
declare n integer;
begin
  begin execute 'select count(*) from (' || p_sql || ') q' into n;
  exception when insufficient_privilege then n := 0; end;
  perform tests.record(p_name, n = 0, 'LEAK: ' || n || ' rows visible');
end $$;

create function tests.rows(p_name text, p_sql text, p_expected integer) returns void language plpgsql as $$
declare n integer;
begin
  execute 'select count(*) from (' || p_sql || ') q' into n;
  perform tests.record(p_name, n = p_expected, 'expected ' || p_expected || ' rows, got ' || n);
end $$;

-- Passes when a write is refused (privilege / RLS / constraint) or touches 0 rows.
create function tests.blocked(p_name text, p_sql text) returns void language plpgsql as $$
declare n integer := -1;
begin
  begin execute p_sql; get diagnostics n = row_count;
  exception when others then n := 0; end;
  perform tests.record(p_name, n = 0, 'LEAK: write affected ' || n || ' rows');
end $$;

-- Passes when a write succeeds and touches exactly p_expected rows.
create function tests.affected(p_name text, p_sql text, p_expected integer) returns void language plpgsql as $$
declare n integer;
begin
  execute p_sql; get diagnostics n = row_count;
  perform tests.record(p_name, n = p_expected, 'expected ' || p_expected || ' rows affected, got ' || n);
end $$;

-- Passes only when the statement raises and (optionally) the message matches.
create function tests.raises(p_name text, p_sql text, p_like text default null) returns void language plpgsql as $$
declare v_msg text; v_raised boolean := false;
begin
  begin execute p_sql;
  exception when others then v_raised := true; v_msg := sqlerrm; end;
  perform tests.record(p_name, v_raised and (p_like is null or v_msg like p_like),
    case when v_raised then 'wrong error: ' || v_msg else 'LEAK: statement succeeded' end);
end $$;

create function tests.eq(p_name text, p_sql text, p_expected text) returns void language plpgsql as $$
declare v text;
begin
  execute p_sql into v;
  perform tests.record(p_name, v is not distinct from p_expected, 'expected ' || coalesce(p_expected, 'NULL') || ', got ' || coalesce(v, 'NULL'));
end $$;

-- =============================================================== fixtures (superuser)
select tests.logout();
insert into auth.users (id, email) select tests.u(i), 'user' || i || '@example.invalid' from generate_series(1, 10) i;
-- Test-only constants (NOT secrets). Real keys are inserted by the operator.
insert into private.encryption_keys (name, key) values
  ('health_v1', 'test-only-health-key-not-a-secret-0001'),
  ('trainer_code_pepper', 'test-only-pepper-not-a-secret-00000001');

-- ---- 6. signup / age gate
select tests.login(tests.u(9));
select tests.raises('signup: under-13 rejected (COPPA)', format('select public.complete_signup(%L, %L)', tests.dob(12), 'x'), 'under_13%');
select tests.raises('signup: age 13 rejected', format('select public.complete_signup(%L, %L)', tests.dob(13), 'x'), 'under_minimum_age');
select tests.raises('signup: age 15 rejected', format('select public.complete_signup(%L, %L)', tests.dob(15), 'x'), 'under_minimum_age');
select tests.raises('signup: future birth date rejected', format('select public.complete_signup(%L, %L)', current_date + 1, 'x'), 'invalid_birth_date');
select tests.logout();
select tests.eq('signup: rejected user keeps no profile', 'select count(*)::text from public.profiles where id = tests.u(9)', '0');

select tests.login(tests.u(1)); select public.complete_signup(tests.dob(18), 'Alice');
select tests.login(tests.u(2)); select public.complete_signup(tests.dob(25), 'Bob');
select tests.login(tests.u(3)); select public.complete_signup(tests.dob(30), 'Coach');
select tests.login(tests.u(4)); select public.complete_signup(tests.dob(30), 'Coach Two');
select tests.login(tests.u(6)); select public.complete_signup(tests.dob(40), 'Parent');
select tests.login(tests.u(7)); select public.complete_signup(tests.dob(35), 'Admin');
select tests.login(tests.u(8)); select public.complete_signup(tests.dob(28), 'Dana');
select tests.login(tests.u(10)); select public.complete_signup(tests.dob(33), 'Zed');
select tests.login(tests.u(5));
select tests.eq('signup: 16 is minor', format('select (public.complete_signup(%L, %L) ->> %L)', tests.dob(16), 'Kid', 'is_minor'), 'true');
select tests.raises('signup: second call rejected', format('select public.complete_signup(%L, %L)', tests.dob(30), 'Kid'), 'already_signed_up');
select tests.eq('signup: minor not onboarded without parent', 'select app.is_minor_onboarded(tests.u(5))::text', 'false');
select tests.login(tests.u(1));
select tests.eq('signup: 18 is not minor', 'select is_minor::text from public.profiles where id = tests.u(1)', 'false');
select tests.eq('signup: new user is athlete', 'select role from public.user_roles where user_id = tests.u(1)', 'athlete');
select tests.login(null, 'anon');
select tests.raises('signup: anon cannot call complete_signup', format('select public.complete_signup(%L, %L)', tests.dob(30), 'x'), 'permission denied%');
select tests.logout();
-- is_minor is derived: a superuser attempt to flip it is recomputed by the trigger
update public.profiles set is_minor = false where id = tests.u(5);
select tests.eq('profiles: is_minor recomputed from birth_date', 'select is_minor::text from public.profiles where id = tests.u(5)', 'true');

-- ---- fixtures: plans, logs, relationships (inserted as superuser, bypassing RLS)
insert into public.plans (id, owner_id, client_id, name) values
  ('10000000-0000-0000-0000-000000000001', tests.u(3), tests.u(1), 'Alice plan'),
  ('10000000-0000-0000-0000-000000000002', tests.u(4), tests.u(2), 'Bob plan');
insert into public.plan_days (id, plan_id, day_key, title) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'mon', 'Push'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'mon', 'Pull');
insert into public.exercises (id, plan_day_id, name, kind, fields) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Bench', 'strength', '{weight,reps}'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Row', 'strength', '{weight,reps}');
insert into public.set_logs (user_id, exercise_id, set_index, weight, reps, done) values
  (tests.u(1), '30000000-0000-0000-0000-000000000001', 0, 135, 8, true),
  (tests.u(2), '30000000-0000-0000-0000-000000000002', 0, 95, 10, true);

-- ---- 1. cross-user isolation (alice vs bob)
select tests.login(tests.u(1));
select tests.rows('A reads own profile', 'select id from public.profiles where id = tests.u(1)', 1);
select tests.no_rows('A cannot read B profile', 'select id from public.profiles where id = tests.u(2)');
select tests.blocked('A cannot update B profile', $q$update public.profiles set display_name = 'pwn' where id = tests.u(2)$q$);
select tests.blocked('A cannot clear own is_minor', $q$update public.profiles set is_minor = false where id = tests.u(1)$q$);
select tests.blocked('A cannot change own birth_date', $q$update public.profiles set birth_date = '1990-01-01' where id = tests.u(1)$q$);
select tests.blocked('A cannot insert a profile for B', format($q$insert into public.profiles (id, birth_date, is_minor) values (%L, '1990-01-01', false)$q$, tests.u(2)));
select tests.affected('A can update own display_name', $q$update public.profiles set display_name = 'Alice A' where id = tests.u(1)$q$, 1);
select tests.no_rows('A cannot read B set_logs', 'select * from public.set_logs where user_id = tests.u(2)');
select tests.rows('A reads own set_logs', 'select * from public.set_logs where user_id = tests.u(1)', 1);
select tests.blocked('A cannot update B set_logs', $q$update public.set_logs set weight = 1 where user_id = tests.u(2)$q$);
select tests.blocked('A cannot delete B set_logs', $q$delete from public.set_logs where user_id = tests.u(2)$q$);
select tests.blocked('A cannot insert set_log as B', format($q$insert into public.set_logs (user_id, exercise_id, set_index) values (%L, '30000000-0000-0000-0000-000000000002', 5)$q$, tests.u(2)));
select tests.blocked('A cannot log against an exercise not visible to A', format($q$insert into public.set_logs (user_id, exercise_id, set_index) values (%L, '30000000-0000-0000-0000-000000000002', 5)$q$, tests.u(1)));
select tests.affected('A can log own set on assigned plan', format($q$insert into public.set_logs (user_id, exercise_id, set_index, weight, reps) values (%L, '30000000-0000-0000-0000-000000000001', 1, 140, 6)$q$, tests.u(1)), 1);
select tests.no_rows('A cannot read B plan', $q$select * from public.plans where id = '10000000-0000-0000-0000-000000000002'$q$);
select tests.no_rows('A cannot read B exercises', $q$select * from public.exercises where id = '30000000-0000-0000-0000-000000000002'$q$);
select tests.rows('A reads own assigned plan chain', $q$select 1 from public.exercises where id = '30000000-0000-0000-0000-000000000001'$q$, 1);
select tests.blocked('A (athlete) cannot edit plan', $q$update public.plans set name = 'x' where id = '10000000-0000-0000-0000-000000000001'$q$);
select tests.blocked('A (athlete) cannot create plan', format($q$insert into public.plans (owner_id, name) values (%L, 'mine')$q$, tests.u(1)));

-- consents: ungranted by default, B cannot touch A's
select tests.rows('consents: none by default', 'select * from public.consents where user_id = tests.u(1)', 0);
select tests.eq('consents: has_consent false by default', $q$select app.has_consent(tests.u(1), 'health_data')::text$q$, 'false');
select tests.blocked('consents: direct insert denied', format($q$insert into public.consents (user_id, kind, granted, policy_version) values (%L, 'health_data', true, 'v1')$q$, tests.u(1)));
select public.record_consent('health_data', 'v1');
select tests.eq('consents: grant is explicit + timestamped', $q$select (granted and granted_at is not null and revoked_at is null)::text from public.consents where user_id = tests.u(1) and kind = 'health_data'$q$, 'true');
select tests.blocked('consents: direct update (spoof) denied', $q$update public.consents set granted = true where user_id = tests.u(1)$q$);
select tests.raises('consents: unknown kind rejected', $q$select public.record_consent('everything', 'v1')$q$, 'invalid_consent_kind');
select tests.raises('consents: self cannot grant parental', $q$select public.record_consent('parental', 'v1')$q$, 'forbidden');
select tests.raises('consents: cannot act for another adult', format($q$select public.record_consent('health_data', 'v1', %L)$q$, tests.u(2)), 'forbidden');
select tests.login(tests.u(2));
select tests.no_rows('B cannot read A consents', 'select * from public.consents where user_id = tests.u(1)');
select tests.no_rows('B cannot read A consent_events', 'select * from public.consent_events where user_id = tests.u(1)');
select tests.blocked('B cannot update A consents', $q$update public.consents set granted = false where user_id = tests.u(1)$q$);
select tests.raises('B cannot revoke A consent via function', format($q$select public.revoke_consent('health_data', %L)$q$, tests.u(1)), 'forbidden');

-- ---- 8. encryption (alice has health_data consent)
select tests.login(tests.u(1));
select public.write_health_record('knee pain left, avoid deep squats', 'PAR-Q: none');
select tests.eq('health: owner decrypts own record', 'select injury_notes from public.read_health_record()', 'knee pain left, avoid deep squats');
select tests.eq('health: owner decrypts screen', 'select health_screen from public.read_health_record(tests.u(1))', 'PAR-Q: none');
select tests.no_rows('health: table not readable by owner (ciphertext only via functions)', 'select * from public.health_records');
select tests.login(tests.u(2));
select tests.raises('health: B cannot read A via function', format('select * from public.read_health_record(%L)', tests.u(1)), 'forbidden');
select tests.no_rows('health: B cannot read A ciphertext', 'select * from public.health_records');
select tests.raises('health: B cannot write without consent', $q$select public.write_health_record('x', 'y')$q$, 'consent_required');
select tests.no_rows('health: B own read without record returns nothing', 'select * from public.read_health_record()');
select tests.logout();
select tests.ok('health: ciphertext stored (non-empty bytea)', (select octet_length(injury_notes_cipher) > 0 and octet_length(health_screen_cipher) > 0 from public.health_records where user_id = tests.u(1)));
select tests.ok('health: plaintext bytes absent from ciphertext', (select position(convert_to('knee', 'UTF8') in injury_notes_cipher) = 0 from public.health_records where user_id = tests.u(1)));
select tests.ok('health: no plaintext columns exist', not exists (select 1 from information_schema.columns where table_name = 'health_records' and column_name in ('injury_notes','health_screen')));
select tests.ok('audit: no health plaintext in audit_log', not exists (select 1 from public.audit_log where metadata::text ilike '%knee%'));

-- ---- 3. coach with no relationship
select tests.login(tests.u(3), 'authenticated', 'coach_verified');  -- JWT claim must not matter
select tests.no_rows('no relationship: coach cannot read A set_logs', 'select * from public.set_logs where user_id = tests.u(1)');
select tests.no_rows('no relationship: coach cannot read A profile', 'select * from public.profiles where id = tests.u(1)');
select tests.raises('no relationship: coach cannot read A health', format('select * from public.read_health_record(%L)', tests.u(1)), 'forbidden');
select tests.logout();
-- Roles are server-granted: set coach roles through the service path (also tests set_user_role).
select tests.login(null, 'service_role');
select public.set_user_role(tests.u(3), 'coach_verified');
select public.set_user_role(tests.u(4), 'coach_verified');
select public.set_user_role(tests.u(7), 'platform_admin');
select tests.eq('roles: service can set role', 'select role from public.user_roles where user_id = tests.u(3)', 'coach_verified');
select tests.raises('roles: invalid role rejected', format('select public.set_user_role(%L, %L)', tests.u(3), 'superuser'), 'invalid_role');
select tests.logout();
select tests.login(tests.u(3));
select tests.no_rows('no relationship: verified coach still cannot read A set_logs', 'select * from public.set_logs where user_id = tests.u(1)');

-- ---- 2. role escalation
select tests.login(tests.u(2));
select tests.blocked('roles: client cannot UPDATE own role', $q$update public.user_roles set role = 'platform_admin' where user_id = tests.u(2)$q$);
select tests.blocked('roles: client cannot INSERT role', format($q$insert into public.user_roles (user_id, role) values (%L, 'platform_admin')$q$, tests.u(2)));
select tests.blocked('roles: client cannot DELETE role', $q$delete from public.user_roles where user_id = tests.u(2)$q$);
select tests.raises('roles: client cannot call set_user_role on self', format('select public.set_user_role(%L, %L)', tests.u(2), 'platform_admin'), 'forbidden');
select tests.no_rows('roles: client cannot read others roles', 'select * from public.user_roles where user_id = tests.u(3)');
select tests.login(tests.u(2), 'authenticated', 'platform_admin');
select tests.raises('roles: forged app_role JWT claim does not grant admin', format('select public.set_user_role(%L, %L)', tests.u(2), 'platform_admin'), 'forbidden');
select tests.login(tests.u(2), 'service_role');
select tests.logout();
select tests.eq('roles: B is still athlete', 'select role from public.user_roles where user_id = tests.u(2)', 'athlete');
select tests.login(tests.u(2));
select tests.raises('roles: client cannot recompute flags', 'select public.recompute_minor_flags()', 'permission denied%');
select tests.raises('roles: client cannot close accounts', format('select public.close_under_13_account(%L)', tests.u(1)), 'permission denied%');
select tests.raises('roles: client cannot create trainer codes', format($q$select public.create_trainer_code(%L, 'ABCDEFGH1234')$q$, tests.u(2)), 'forbidden');

-- apply_for_coach + admin review
select tests.login(tests.u(8));
select public.apply_for_coach('NSCA-CPT', 'NSCA', current_date + 365);
select tests.eq('coach apply: role becomes coach_pending (definer only)', 'select role from public.user_roles where user_id = tests.u(8)', 'coach_pending');
select tests.rows('coach apply: applicant reads own application', 'select * from public.coach_applications', 1);
select tests.raises('coach apply: pending cannot re-apply', 'select public.apply_for_coach()', 'forbidden');
select tests.no_rows('coach apply: studio gate unmet while pending', 'select 1 where app.is_verified_coach()');
select tests.login(tests.u(2));
select tests.no_rows('coach apply: B cannot read D application', 'select * from public.coach_applications');
select tests.login(tests.u(5));
select tests.raises('coach apply: minors cannot apply', 'select public.apply_for_coach()', 'forbidden');
select tests.login(tests.u(8));
select tests.raises('coach apply: applicant cannot self-approve', format($q$select public.review_coach_application((select id from public.coach_applications where applicant_id = %L), true)$q$, tests.u(8)), 'forbidden');
select tests.logout();
create table tests.ids as select id from public.coach_applications where applicant_id = tests.u(8);
grant select on tests.ids to public;
select tests.login(tests.u(7));
select public.review_coach_application((select id from tests.ids), true);
select tests.logout();
select tests.eq('coach apply: admin approval grants coach_verified', 'select role from public.user_roles where user_id = tests.u(8)', 'coach_verified');

-- ---- 4. active relationship but NO coach_sharing consent
insert into public.coach_relationships (id, coach_id, client_id, status, started_at)
values ('40000000-0000-0000-0000-000000000001', tests.u(3), tests.u(1), 'active', now());
select tests.login(tests.u(3));
select tests.no_rows('active, no coach_sharing: coach cannot read A set_logs', 'select * from public.set_logs where user_id = tests.u(1)');
select tests.no_rows('active, no coach_sharing: coach cannot read A profile', 'select * from public.profiles where id = tests.u(1)');
select tests.raises('active, no coach_sharing: coach cannot read A health', format('select * from public.read_health_record(%L)', tests.u(1)), 'forbidden');
select tests.rows('coach reads own relationship rows', 'select * from public.coach_relationships', 1);
select tests.login(tests.u(4));
select tests.no_rows('other coach cannot see relationship', 'select * from public.coach_relationships');

-- ---- 5. relationship + consent, then ended
select tests.login(tests.u(1));
select public.record_consent('coach_sharing', 'v1');
select tests.login(tests.u(3));
select tests.rows('consented: coach reads A set_logs', 'select * from public.set_logs where user_id = tests.u(1)', 2);
select tests.rows('consented: coach reads A profile', 'select id from public.profiles where id = tests.u(1)', 1);
select tests.eq('consented: coach reads A health', 'select injury_notes from public.read_health_record(tests.u(1))', 'knee pain left, avoid deep squats');
select tests.no_rows('consented: coach still cannot read B logs', 'select * from public.set_logs where user_id = tests.u(2)');
select tests.no_rows('consented: coach cannot read A birth_date', 'select birth_date from public.profiles where id = tests.u(1)');
select tests.blocked('consented: coach cannot modify A logs', $q$update public.set_logs set weight = 999 where user_id = tests.u(1)$q$);
select tests.blocked('consented: coach cannot delete A logs', $q$delete from public.set_logs where user_id = tests.u(1)$q$);
select tests.no_rows('consented: coach cannot read A consents', 'select * from public.consents where user_id = tests.u(1)');
select tests.affected('consented: coach edits assigned plan', $q$update public.plans set name = 'Alice plan v2' where id = '10000000-0000-0000-0000-000000000001'$q$, 1);
-- revoking consent cuts access immediately
select tests.login(tests.u(1));
select public.revoke_consent('coach_sharing');
select tests.eq('consent: revoke is timestamped', $q$select (not granted and revoked_at is not null)::text from public.consents where user_id = tests.u(1) and kind = 'coach_sharing'$q$, 'true');
select tests.login(tests.u(3));
select tests.no_rows('revoked consent: coach loses set_logs at once', 'select * from public.set_logs where user_id = tests.u(1)');
select tests.raises('revoked consent: coach loses health at once', format('select * from public.read_health_record(%L)', tests.u(1)), 'forbidden');
select tests.login(tests.u(1));
select public.record_consent('coach_sharing', 'v2');
select tests.login(tests.u(3));
select tests.rows('re-consent restores access', 'select * from public.set_logs where user_id = tests.u(1)', 2);
-- ending the relationship
select tests.login(tests.u(4));
select tests.raises('ending: unrelated coach cannot end it', $q$select public.end_coach_relationship('40000000-0000-0000-0000-000000000001')$q$, 'forbidden');
select tests.login(tests.u(1));
select public.end_coach_relationship('40000000-0000-0000-0000-000000000001');
select tests.login(tests.u(3));
select tests.no_rows('ended: coach cannot read A set_logs', 'select * from public.set_logs where user_id = tests.u(1)');
select tests.no_rows('ended: coach cannot read A profile', 'select * from public.profiles where id = tests.u(1)');
select tests.raises('ended: coach cannot read A health', format('select * from public.read_health_record(%L)', tests.u(1)), 'forbidden');
select tests.blocked('ended: coach cannot edit assigned plan', $q$update public.plans set name = 'still mine?' where id = '10000000-0000-0000-0000-000000000001'$q$);
select tests.blocked('ended: coach cannot add day to assigned plan', $q$insert into public.plan_days (plan_id, day_key, title) values ('10000000-0000-0000-0000-000000000001', 'tue', 'x')$q$);
select tests.login(tests.u(1));
select tests.rows('ended: client keeps own copy of plan', $q$select * from public.plans where id = '10000000-0000-0000-0000-000000000001'$q$, 1);
-- consent revoke of health_data blocks the owner too
select public.revoke_consent('health_data');
select tests.raises('health: owner blocked after health_data revoked', 'select * from public.read_health_record()', 'consent_required');
select tests.raises('health: write blocked after health_data revoked', $q$select public.write_health_record('a', 'b')$q$, 'consent_required');

-- ---- 7. consent timestamps/history
select tests.login(tests.u(8));
select tests.rows('consent: fresh user has none', 'select * from public.consents', 0);
select public.record_consent('ai_vendor', 'v1');
select public.revoke_consent('ai_vendor');
select tests.logout();
select tests.ok('consent: events recorded (grant+revoke)', (select count(*) = 2 from public.consent_events where user_id = tests.u(8) and kind = 'ai_vendor'));
select tests.ok('consent: granted_at and revoked_at set', (select granted_at is not null and revoked_at is not null and not granted from public.consents where user_id = tests.u(8) and kind = 'ai_vendor'));
select tests.login(tests.u(8));
select tests.blocked('consent_events: user cannot rewrite history', $q$update public.consent_events set granted = true$q$);
select tests.blocked('consent_events: user cannot delete history', $q$delete from public.consent_events$q$);

-- ---- 9. parent link / minors
select tests.login(tests.u(5));
select public.record_consent('health_data', 'v1');
select tests.raises('minor: health write blocked until parent linked', $q$select public.write_health_record('shoulder', 'none')$q$, 'consent_required');
select tests.raises('minor: cannot link a minor as parent', format('select public.link_parent(%L, %L)', tests.u(5), tests.u(5)), 'invalid_parent');
select tests.raises('minor: cannot request link as someone else', format('select public.link_parent(%L, %L)', tests.u(1), tests.u(6)), 'forbidden');
select public.link_parent(tests.u(5), tests.u(6));
select tests.raises('minor: duplicate pending link rejected', format('select public.link_parent(%L, %L)', tests.u(5), tests.u(6)), 'invalid_parent');
select tests.eq('parent link: created pending + contracting party', 'select (status = $$pending$$ and is_contracting_party)::text from public.parent_links', 'true');
select tests.raises('minor: pending link does not onboard', $q$select public.write_health_record('shoulder', 'none')$q$, 'consent_required');
select tests.logout();
create table tests.link_ids as select id from public.parent_links;
grant select on tests.link_ids to public;
select tests.login(tests.u(1));
select tests.no_rows('parent link: unrelated user cannot read link', 'select * from public.parent_links');
select tests.raises('parent link: unrelated user cannot accept', $q$select public.accept_parent_link((select id from tests.link_ids))$q$, 'forbidden');
select tests.logout();
select tests.ok('parent link: unrelated accept did not change status', (select status = 'pending' from public.parent_links));
select tests.login(tests.u(6));
select tests.rows('parent link: parent sees invite', 'select * from public.parent_links', 1);
select tests.no_rows('parent link: parent cannot read minor profile', 'select id from public.profiles where id = tests.u(5)');
select tests.no_rows('parent link: parent cannot read minor set_logs', 'select * from public.set_logs where user_id = tests.u(5)');
select public.accept_parent_link((select id from public.parent_links limit 1));
select tests.logout();
select tests.ok('parent link: active + contracting party', (select status = 'active' and is_contracting_party and accepted_at is not null from public.parent_links));
select tests.ok('parent link: minor is now onboarded', app.is_minor_onboarded(tests.u(5)));
select tests.login(tests.u(6));
select public.record_consent('parental', 'v1', tests.u(5));
select tests.rows('parental consent: parent can read minor consents', 'select * from public.consents where user_id = tests.u(5)', 2);
select tests.login(tests.u(5));
select tests.raises('parental consent: minor cannot self-grant', $q$select public.record_consent('parental', 'v1')$q$, 'forbidden');
select tests.raises('parent link: minor cannot revoke own guardian', $q$select public.revoke_parent_link((select id from public.parent_links))$q$, 'forbidden');
select public.write_health_record('shoulder impingement', 'none');
select tests.eq('minor: owner reads own health once onboarded', 'select injury_notes from public.read_health_record()', 'shoulder impingement');
-- coach hidden from minors' health by default, even with relationship + consent
select tests.logout();
insert into public.coach_relationships (coach_id, client_id, status, started_at) values (tests.u(3), tests.u(5), 'active', now());
select tests.login(tests.u(5));
select public.record_consent('coach_sharing', 'v1');
select tests.login(tests.u(3));
select tests.rows('minor: coach can see minor profile when consented + parent linked', 'select id from public.profiles where id = tests.u(5)', 1);
select tests.no_rows('minor: coach gets NO health data for minor client', 'select * from public.read_health_record(tests.u(5))');
select tests.no_rows('minor: coach cannot read minor birth_date', 'select birth_date from public.profiles where id = tests.u(5)');
-- parent removes link -> minor not onboarded -> coach access stops
select tests.login(tests.u(6));
select public.revoke_parent_link((select id from public.parent_links limit 1));
select tests.login(tests.u(3));
select tests.no_rows('minor: unlinking parent cuts coach access', 'select id from public.profiles where id = tests.u(5)');

-- ---- anon
select tests.login(null, 'anon');
select tests.no_rows('anon: profiles', 'select * from public.profiles');
select tests.no_rows('anon: user_roles', 'select * from public.user_roles');
select tests.no_rows('anon: consents', 'select * from public.consents');
select tests.no_rows('anon: set_logs', 'select * from public.set_logs');
select tests.no_rows('anon: plans', 'select * from public.plans');
select tests.no_rows('anon: health_records', 'select * from public.health_records');
select tests.no_rows('anon: audit_log', 'select * from public.audit_log');
select tests.no_rows('anon: parent_links', 'select * from public.parent_links');
select tests.raises('anon: cannot record consent', $q$select public.record_consent('health_data', 'v1')$q$, 'permission denied%');
select tests.raises('anon: cannot redeem codes', $q$select public.redeem_trainer_code('ABCDEFGH')$q$, 'permission denied%');
select tests.raises('anon: cannot read health', 'select * from public.read_health_record()', 'permission denied%');

-- ---- private schema / default privileges
select tests.login(tests.u(1));
select tests.no_rows('private: authenticated cannot read encryption_keys', 'select * from private.encryption_keys');
select tests.raises('private: authenticated cannot call private functions', 'select private.is_service_or_admin()', 'permission denied%');
select tests.login(tests.u(3));
select tests.no_rows('private: verified coach cannot read encryption_keys', 'select * from private.encryption_keys');
select tests.login(null, 'anon');
select tests.no_rows('private: anon cannot read encryption_keys', 'select * from private.encryption_keys');
select tests.logout();
select tests.ok('privileges: authenticated has no USAGE on private', not has_schema_privilege('authenticated', 'private', 'USAGE'));
select tests.ok('privileges: anon has no USAGE on private', not has_schema_privilege('anon', 'private', 'USAGE'));
select tests.ok('privileges: anon has no USAGE on app', not has_schema_privilege('anon', 'app', 'USAGE'));
select tests.ok('privileges: anon holds no table grants in public/private', not exists (select 1 from information_schema.role_table_grants where grantee = 'anon' and table_schema in ('public','private')));
select tests.ok('privileges: authenticated holds no table grants in private', not exists (select 1 from information_schema.role_table_grants where grantee = 'authenticated' and table_schema = 'private'));
select tests.ok('privileges: authenticated has no write grant on user_roles/consents/health_records', not exists (
  select 1 from information_schema.role_table_grants where grantee = 'authenticated'
    and table_name in ('user_roles','consents','consent_events','health_records','audit_log','parent_links','coach_relationships')
    and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')));
select tests.ok('privileges: authenticated cannot execute service-only functions',
  not has_function_privilege('authenticated', 'public.close_under_13_account(uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.recompute_minor_flags()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.custom_access_token_hook(jsonb)', 'EXECUTE')
  and not has_function_privilege('anon', 'public.set_user_role(uuid, text)', 'EXECUTE'));
select tests.ok('rls: every table in public/private has RLS enabled AND forced', not exists (
  select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public','private') and c.relkind = 'r' and not (c.relrowsecurity and c.relforcerowsecurity)));

-- ---- audit log
select tests.login(tests.u(1));
select tests.ok('audit: user reads own rows', (select count(*) > 0 from public.audit_log));
select tests.no_rows('audit: user cannot see other actors', $q$select * from public.audit_log where actor_id <> tests.u(1)$q$);
select tests.blocked('audit: user cannot insert', format($q$insert into public.audit_log (actor_id, action) values (%L, 'forged')$q$, tests.u(1)));
select tests.blocked('audit: user cannot update', $q$update public.audit_log set action = 'x'$q$);
select tests.blocked('audit: user cannot delete', $q$delete from public.audit_log$q$);
select tests.login(tests.u(7));
select tests.ok('audit: platform admin reads all', (select count(distinct actor_id) > 3 from public.audit_log));
select tests.blocked('audit: admin cannot rewrite either', $q$update public.audit_log set action = 'x'$q$);

-- ---- trainer codes (hash only), rate limit
select tests.login(null, 'service_role');
select public.create_trainer_code(tests.u(4), 'TEST-CODE-1234', 2);
select tests.logout();
select tests.ok('trainer code: raw code never stored', not exists (select 1 from public.trainer_codes where code_hash ilike '%TEST-CODE%' or code_hash = 'TEST-CODE-1234'));
select tests.login(tests.u(4));
select tests.no_rows('trainer code: coach cannot read hashes', 'select code_hash from public.trainer_codes');
select tests.rows('trainer code: coach lists own code metadata', 'select id, redemptions from public.trainer_codes', 1);
select tests.login(tests.u(2));
select tests.eq('trainer code: wrong code returns false', $q$select public.redeem_trainer_code('NOT-THE-CODE')::text$q$, 'false');
select tests.eq('trainer code: valid code (case/space-insensitive) redeems', $q$select public.redeem_trainer_code(' test-code-1234 ')::text$q$, 'true');
select tests.eq('trainer code: repeat redeem does not double count', $q$select public.redeem_trainer_code('TEST-CODE-1234')::text$q$, 'true');
select tests.logout();
select tests.ok('trainer code: relationship active + one redemption', (select count(*) = 1 from public.coach_relationships where coach_id = tests.u(4) and client_id = tests.u(2) and status = 'active')
  and (select redemptions = 1 from public.trainer_codes));
select tests.login(tests.u(10));
do $$ begin for i in 1..10 loop perform public.redeem_trainer_code('WRONG-' || i); end loop; end $$;
select tests.raises('trainer code: rate limited after 10 failures', $q$select public.redeem_trainer_code('TEST-CODE-1234')$q$, 'rate_limited');

-- ---- requests, hook, admin functions
select tests.login(tests.u(1));
select public.request_data_export();
select public.request_account_deletion();
select tests.rows('requests: user reads own export request', 'select * from public.data_export_requests', 1);
select tests.eq('requests: duplicate pending is idempotent', 'select (public.request_data_export() = (select id from public.data_export_requests))::text', 'true');
select tests.blocked('requests: cannot insert for another user', format($q$insert into public.data_export_requests (user_id) values (%L)$q$, tests.u(2)));
select tests.blocked('requests: cannot self-complete', $q$update public.account_deletion_requests set status = 'completed'$q$);
select tests.login(tests.u(2));
select tests.no_rows('requests: B cannot read A deletion request', 'select * from public.account_deletion_requests where user_id = tests.u(1)');
select tests.logout();
select tests.eq('jwt hook: adds app_role from user_roles', format($q$select public.custom_access_token_hook(jsonb_build_object('user_id', %L, 'claims', jsonb_build_object('role', 'authenticated'))) -> 'claims' ->> 'app_role'$q$, tests.u(3)), 'coach_verified');
select tests.login(tests.u(1));
select tests.raises('jwt hook: not callable by clients', format($q$select public.custom_access_token_hook(jsonb_build_object('user_id', %L))$q$, tests.u(3)), 'permission denied%');
select tests.login(null, 'service_role');
select tests.ok('recompute_minor_flags: service can run', public.recompute_minor_flags() >= 0);
select public.close_under_13_account(tests.u(10));
select tests.logout();
select tests.ok('close_under_13_account: profile + auth user removed', not exists (select 1 from public.profiles where id = tests.u(10)) and not exists (select 1 from auth.users where id = tests.u(10)));
select tests.ok('close_under_13_account: only the fact is audited', exists (select 1 from public.audit_log where action = 'closed_under_13' and target_user_id = tests.u(10) and metadata = '{}'::jsonb));
