-- Phase 3 tests (onboarding server side). Runs after rls.sql + phase2b.sql in the same database and reuses
-- their helpers (tests.ok/eq/raises/blocked/rows/no_rows/affected, tests.u, tests.dob, tests.accept_link).
-- Users here are tests.u(50..90); the pepper key was inserted by rls.sql.
--   50 adult athlete (setup, privacy, can_train)      51 adult (signup without terms first)
--   52 PENDING minor (never linked; invites, holds)   53 adult (neutral-invite target, outsider)
--   54 minor linked by invite token                   55 adult parent of 54
--   56 verified coach                                 57 adult client
--   58 minor linked by accept_parent_link             59 adult parent of 58
--   60 minor (cancelled invite)                       61 adult (accept rate limit)
--   62 minor (expiry + day-14 purge)                  63 adult WITHOUT a risk acknowledgement
--   64..68 adults (trainer-code limits)               69 auth user without a profile
--   70 second coach                                   71 adult spare
--   76 general-only coach applicant                    77 coach applicant with minors box
--   78 pending minor (resend does not extend day-14)
-- Test-only constants are NOT secrets.

select tests.logout();
insert into auth.users (id, email) select tests.u(i), 'p3-' || i || '@example.invalid' from generate_series(50, 90) i;

create function tests.h(c text) returns text language sql immutable as $$ select repeat(c, 64) $$;
create function tests.signup3(p_user uuid, p_dob date) returns jsonb language plpgsql as $$
declare r jsonb;
begin
  perform tests.login(p_user);
  r := public.complete_signup(p_dob, null, null, null, null, 'terms-v1', null, 'privacy-v1', tests.h('d'));
  perform tests.logout();
  return r;
end $$;
create function tests.accept_inv(p_token text) returns boolean language sql as $$
  select public.accept_parent_invite(p_token, 'attest-v1', tests.h('a'), 'terms-v1', tests.h('e'), 'risk-v1', tests.h('c'), 'privacy-v1', tests.h('d')) $$;
create function tests.privacy(p_health boolean, p_ai boolean) returns jsonb language sql as $$
  select public.submit_privacy_safety(p_health, 'health-v2', tests.h('1'), p_ai, 'ai-B-v2', tests.h('2'), 'risk-v2', tests.h('3'), tests.h('4')) $$;
create function tests.setup_json(p_extra jsonb default '{}') returns jsonb language sql stable as $$
  select jsonb_build_object('styles', jsonb_build_array('hybrid','hyrox'), 'main_style', 'hybrid', 'days_per_week', 4,
    'followups', jsonb_build_object('hybrid', jsonb_build_object('run_lift_pct', 50),
                                    'hyrox', jsonb_build_object('division', 'open', 'race_date', '2027-06-12')),
    'gym', jsonb_build_object('name', 'Main gym', 'preset', 'full',
                              'items', jsonb_build_array('barbell','dumbbells','kettlebells','treadmill'),
                              'maxes', jsonb_build_object('barbell', 405, 'dumbbells', 100)),
    'units', 'lb', 'distance', 'mi', 'accent', 'champagne') || p_extra $$;
create function tests.bad_setup(p_name text, p_extra text) returns void language sql as $$
  select tests.raises(p_name, format('select public.save_training_setup(%L)', tests.setup_json(p_extra::jsonb)), 'invalid_setup') $$;
create table tests.tokens (inv uuid, email text, token text, minor uuid);
create table tests.codes3 (label text, code text, id uuid);
create table tests.bulk (code text);
grant all on tests.tokens, tests.codes3, tests.bulk to public;
create function tests.tok(p_minor uuid) returns text language sql stable as $$ select token from tests.tokens where minor = p_minor $$;
create function tests.code(p_label text) returns text language sql stable as $$ select code from tests.codes3 where label = p_label $$;
create function tests.mkcode(p_label text, p_max integer default 25, p_days integer default 30) returns void language plpgsql as $$
declare r jsonb;
begin
  r := public.create_trainer_code(p_max, p_days);
  insert into tests.codes3 values (p_label, r ->> 'code', (r ->> 'id')::uuid);
end $$;

create function tests.mkcode_as(p_coach uuid, p_label text) returns void language plpgsql as $$
declare r jsonb;
begin
  perform tests.login(p_coach);
  r := public.create_trainer_code(25, 30);
  insert into tests.codes3 values (p_label, r ->> 'code', (r ->> 'id')::uuid);
  perform tests.logout();
end $$;

-- =============================================================== 1. age screen band + signup terms
select tests.login(null, 'anon');
select tests.eq('screen: eligible adult gets band 18_plus', format('select public.screen_age(%L) ->> %L', tests.dob(30), 'band'), '18_plus');
select tests.eq('screen: eligible 16-year-old gets band 16_17', format('select public.screen_age(%L) ->> %L', tests.dob(16), 'band'), '16_17');
select tests.eq('screen: store lower age is reflected in the band', format('select public.screen_age(%L, 16, 17, %L) ->> %L', tests.dob(30), 'apple_declared_age_range', 'band'), '16_17');
select tests.eq('screen: ineligible still answers only {eligible:false} (no band, no threshold)', format('select public.screen_age(%L)::text', tests.dob(15)), '{"eligible": false}');
select tests.eq('screen: ineligible via store signal has no band either', format('select (public.screen_age(%L, null, 12, %L) ? %L)::text', tests.dob(30), 'google_play_age_signals', 'band'), 'false');
select tests.logout();
select tests.ok('screen: still stores nothing personal (no new profile / auth rows)', (select count(*) from public.profiles where id >= tests.u(50)) = 0);

select tests.login(tests.u(51));
select tests.raises('signup: terms version is required', format('select public.complete_signup(%L, null, null, null, null)', tests.dob(30)), 'terms_required');
select tests.raises('signup: blank terms version rejected', format('select public.complete_signup(%L, null, null, null, null, %L)', tests.dob(30), '   '), 'terms_required');
select tests.raises('signup: 65-char terms version rejected', format('select public.complete_signup(%L, null, null, null, null, %L)', tests.dob(30), repeat('t', 65)), 'terms_required');
select tests.logout();
select tests.ok('signup: refused terms leaves no profile (auth user untouched for an eligible DOB)',
  not exists (select 1 from public.profiles where id = tests.u(51)) and exists (select 1 from auth.users where id = tests.u(51)));

select tests.ok('signup: u50 adult', (tests.signup3(tests.u(50), tests.dob(30)) ->> 'is_minor') = 'false');
select tests.ok('signup: u51 adult (terms given)', (tests.signup3(tests.u(51), tests.dob(31)) ->> 'is_minor') = 'false');
select tests.ok('signup: u52 pending minor', (tests.signup3(tests.u(52), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.ok('signup: u53 adult', (tests.signup3(tests.u(53), tests.dob(40)) ->> 'is_minor') = 'false');
select tests.ok('signup: u54 minor', (tests.signup3(tests.u(54), tests.dob(17)) ->> 'is_minor') = 'true');
select tests.ok('signup: u55 parent', (tests.signup3(tests.u(55), tests.dob(45)) ->> 'is_minor') = 'false');
select tests.ok('signup: u56 coach', (tests.signup3(tests.u(56), tests.dob(33)) ->> 'is_minor') = 'false');
select tests.ok('signup: u57 client', (tests.signup3(tests.u(57), tests.dob(27)) ->> 'is_minor') = 'false');
select tests.ok('signup: u58 minor', (tests.signup3(tests.u(58), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.ok('signup: u59 parent', (tests.signup3(tests.u(59), tests.dob(44)) ->> 'is_minor') = 'false');
select tests.ok('signup: u60 minor', (tests.signup3(tests.u(60), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.ok('signup: u61 adult', (tests.signup3(tests.u(61), tests.dob(29)) ->> 'is_minor') = 'false');
select tests.ok('signup: u62 minor', (tests.signup3(tests.u(62), tests.dob(17)) ->> 'is_minor') = 'true');
select tests.ok('signup: u63 adult', (tests.signup3(tests.u(63), tests.dob(26)) ->> 'is_minor') = 'false');
select tests.ok('signup: u64-68 adults', (select bool_and((tests.signup3(tests.u(i), tests.dob(30)) ->> 'is_minor') = 'false') from generate_series(64, 68) i));
select tests.ok('signup: u70 coach2', (tests.signup3(tests.u(70), tests.dob(35)) ->> 'is_minor') = 'false');
select tests.ok('signup: u71 adult', (tests.signup3(tests.u(71), tests.dob(36)) ->> 'is_minor') = 'false');
select tests.ok('signup: terms acceptance recorded as an event (kind terms, grantor self, version, time)',
  exists (select 1 from public.consent_events where user_id = tests.u(50) and kind = 'terms' and grantor = 'self' and granted
            and policy_version = 'terms-v1' and actor_user_id = tests.u(50) and at is not null));
select tests.ok('signup: terms is an acceptance event, not a consents row', not exists (select 1 from public.consents where kind = 'terms'));
select tests.ok('signup: minors stay athlete', not exists (select 1 from public.user_roles where user_id in (tests.u(52), tests.u(54), tests.u(58), tests.u(60), tests.u(62)) and role <> 'athlete'));
select tests.ok('signup: minor has no consents row at all after signup', not exists (select 1 from public.consents where user_id = tests.u(52)));
select tests.login(tests.u(50));
select tests.raises('consent kinds: terms cannot be recorded through record_consent', $q$select public.record_consent('terms', 'v1')$q$, 'invalid_consent_kind');
select tests.raises('consent kinds: risk_notice cannot be recorded through record_consent', $q$select public.record_consent('risk_notice', 'v1')$q$, 'invalid_consent_kind');
select tests.raises('consent kinds: risk_notice cannot be revoked through revoke_consent', $q$select public.revoke_consent('risk_notice')$q$, 'invalid_consent_kind');
select tests.raises('consent kinds: terms cannot be revoked through revoke_consent', $q$select public.revoke_consent('terms')$q$, 'invalid_consent_kind');
select tests.blocked('consent kinds: no direct insert of a risk_notice row', format($q$insert into public.consents (user_id, kind, granted, policy_version, grantor) values (%L, 'risk_notice', true, 'v1', 'self')$q$, tests.u(50)));
select tests.logout();

-- coaches (roles are server-granted)
select tests.login(null, 'service_role');
select public.set_user_role(tests.u(56), 'coach_verified');
select public.set_user_role(tests.u(70), 'coach_verified');
select tests.logout();

-- plan fixtures so set_logs inserts are visible to the logging user (assigned plans owned by the coach)
insert into public.plans (id, owner_id, client_id, name) values
  ('11000000-0000-0000-0000-000000000050', tests.u(56), tests.u(50), 'p50'),
  ('11000000-0000-0000-0000-000000000063', tests.u(56), tests.u(63), 'p63'),
  ('11000000-0000-0000-0000-000000000054', tests.u(56), tests.u(54), 'p54'),
  ('11000000-0000-0000-0000-000000000058', tests.u(56), tests.u(58), 'p58');
insert into public.plan_days (id, plan_id, day_key, title)
  select ('21' || substr(id::text, 3))::uuid, id, 'mon', 'Day' from public.plans where id::text like '11000000-0000-0000-0000-0000000000%';
insert into public.exercises (id, plan_day_id, name, kind, fields)
  select ('31' || substr(id::text, 3))::uuid, id, 'Squat', 'strength', '{weight,reps}' from public.plan_days where id::text like '21000000-0000-0000-0000-0000000000%';

-- =============================================================== 2. training setup
select tests.login(tests.u(52));
select tests.raises('setup: a pending minor cannot save (generic not_allowed)', format('select public.save_training_setup(%L)', tests.setup_json()), 'not_allowed');
select tests.raises('setup: even a goal-only save is refused for a pending minor', $q$select public.save_training_setup('{"goal":"build_strength"}')$q$, 'not_allowed');
select tests.no_rows('setup: a pending minor has no row', 'select * from public.training_setups');
select tests.login(null, 'anon');
select tests.raises('setup: anon cannot save', format('select public.save_training_setup(%L)', tests.setup_json()), 'permission denied%');
select tests.no_rows('setup: anon reads nothing', 'select * from public.training_setups');
select tests.login(tests.u(50));
select tests.blocked('setup: direct client insert denied', format($q$insert into public.training_setups (user_id, goal) values (%L, 'lose')$q$, tests.u(50)));
select tests.eq('setup: adult saves a complete setup', format('select public.save_training_setup(%L) ->> %L', tests.setup_json(), 'completed'), 'true');
select tests.blocked('setup: direct client update denied', $q$update public.training_setups set days_per_week = 7$q$);
select tests.blocked('setup: direct client delete denied', $q$delete from public.training_setups$q$);
select tests.rows('setup: owner reads own row', 'select * from public.training_setups', 1);
select tests.ok('setup: completed_at set, nothing else surprising',
  (select completed_at is not null and styles = '{hybrid,hyrox}' and main_style = 'hybrid' and days_per_week = 4 and units = 'lb'
          and accent = 'champagne' and gym ->> 'name' = 'Main gym' from public.training_setups));
select tests.login(tests.u(53));
select tests.no_rows('setup: an unrelated adult cannot read it', format('select * from public.training_setups where user_id = %L', tests.u(50)));
select tests.login(tests.u(56));
select tests.no_rows('setup: a coach cannot read it', format('select * from public.training_setups where user_id = %L', tests.u(50)));
select tests.login(tests.u(50));
-- payload rules (all one generic invalid_setup)
select tests.raises('setup: unknown top-level key rejected', $q$select public.save_training_setup('{"role":"platform_admin"}')$q$, 'invalid_setup');
select tests.raises('setup: body weight is never accepted (current_weight)', $q$select public.save_training_setup('{"current_weight":180}')$q$, 'invalid_setup');
select tests.raises('setup: body weight is never accepted (target_weight)', $q$select public.save_training_setup('{"target_weight":170,"goal":"lose"}')$q$, 'invalid_setup');
select tests.raises('setup: payload must be an object', $q$select public.save_training_setup('[1,2]')$q$, 'invalid_setup');
select tests.raises('setup: null payload rejected', $q$select public.save_training_setup(null)$q$, 'invalid_setup');
select tests.bad_setup('setup: weight key hidden inside gym rejected', '{"gym":{"name":"G","preset":"full","items":[],"body_weight":180}}');
select tests.bad_setup('setup: weight key hidden inside followups rejected', '{"followups":{"hybrid":{"run_lift_pct":50,"weight":180}}}');
select tests.bad_setup('setup: weight inside powerlifting maxes rejected', '{"styles":["powerlifting"],"main_style":"powerlifting","followups":{"powerlifting":{"maxes":{"squat":300,"bodyweight":190}}}}');
select tests.bad_setup('setup: unknown style rejected', '{"styles":["yoga"],"main_style":"yoga","followups":null}');
select tests.bad_setup('setup: duplicate style rejected', '{"styles":["hybrid","hybrid"],"followups":null}');
select tests.bad_setup('setup: empty styles rejected', '{"styles":[],"main_style":null,"followups":null}');
select tests.bad_setup('setup: main style must be among the picked styles', '{"main_style":"powerlifting"}');
select tests.bad_setup('setup: days_per_week 1 rejected', '{"days_per_week":1}');
select tests.bad_setup('setup: days_per_week 8 rejected', '{"days_per_week":8}');
select tests.bad_setup('setup: days_per_week must be a whole number', '{"days_per_week":4.5}');
select tests.bad_setup('setup: days_per_week must be a number', '{"days_per_week":"4"}');
select tests.bad_setup('setup: unknown units rejected', '{"units":"stone"}');
select tests.bad_setup('setup: unknown distance unit rejected', '{"distance":"furlong"}');
select tests.bad_setup('setup: malformed hex accent rejected', '{"accent":"#12345"}');
select tests.bad_setup('setup: accent cannot carry markup', '{"accent":"red;drop table"}');
select tests.bad_setup('setup: gym name over 40 chars rejected', format('{"gym":{"name":"%s","preset":"full","items":[]}}', repeat('g', 41)));
select tests.bad_setup('setup: empty gym name rejected', '{"gym":{"name":"  ","preset":"full","items":[]}}');
select tests.bad_setup('setup: unknown preset rejected', '{"gym":{"name":"G","preset":"mansion","items":[]}}');
select tests.bad_setup('setup: unknown equipment item rejected', '{"gym":{"name":"G","preset":"custom","items":["laser_cannon"]}}');
select tests.bad_setup('setup: duplicate equipment item rejected', '{"gym":{"name":"G","preset":"custom","items":["bike","bike"]}}');
select tests.bad_setup('setup: gym without items rejected', '{"gym":{"name":"G","preset":"full"}}');
select tests.bad_setup('setup: max for an item that is not selected rejected', '{"gym":{"name":"G","preset":"custom","items":["bike"],"maxes":{"barbell":300}}}');
select tests.bad_setup('setup: max of 0 rejected', '{"gym":{"name":"G","preset":"custom","items":["barbell"],"maxes":{"barbell":0}}}');
select tests.bad_setup('setup: max above range rejected', '{"gym":{"name":"G","preset":"custom","items":["barbell"],"maxes":{"barbell":1501}}}');
select tests.bad_setup('setup: max on a non-weight item rejected', '{"gym":{"name":"G","preset":"custom","items":["treadmill"],"maxes":{"treadmill":10}}}');
select tests.bad_setup('setup: follow-up for a style that was not picked rejected', '{"followups":{"crossfit":{"experience":"beginner"}}}');
select tests.bad_setup('setup: unknown hyrox division rejected', '{"followups":{"hyrox":{"division":"elite"}}}');
select tests.bad_setup('setup: impossible race date rejected', '{"followups":{"hyrox":{"race_date":"2027-13-45"}}}');
select tests.bad_setup('setup: run/lift split above 100 rejected', '{"followups":{"hybrid":{"run_lift_pct":101}}}');
select tests.bad_setup('setup: followups must be an object', '{"followups":"lots"}');
select tests.bad_setup('setup: unknown followup section rejected', '{"followups":{"yoga":{}}}');
select tests.bad_setup('setup: gym must be an object', '{"gym":"main"}');
select tests.bad_setup('setup: a pace without a goal rejected', '{"goal":null,"goal_pace":"steady"}');
select tests.bad_setup('setup: minor-safe goal id refused for an adult', '{"goal":"build_strength"}');
select tests.bad_setup('setup: unknown pace rejected', '{"goal":"lose","goal_pace":"insane"}');
select tests.bad_setup('setup: unknown goal rejected', '{"goal":"shred"}');
select tests.eq('setup: adult weight-loss goal with pace accepted (direction + pace only)',
  format('select public.save_training_setup(%L) ->> %L', tests.setup_json('{"goal":"lose","goal_pace":"moderate"}'), 'completed'), 'true');
select tests.eq('setup: goal and pace stored as plain enums', $q$select goal || '/' || goal_pace from public.training_setups$q$, 'lose/moderate');
select tests.eq('setup: custom hex accent and valid powerlifting follow-up accepted',
  format('select public.save_training_setup(%L) ->> %L', tests.setup_json($q${"accent":"#D9C08A","styles":["powerlifting","bodybuilding"],"main_style":"bodybuilding",
    "followups":{"powerlifting":{"compete":false,"maxes":{"squat":315,"bench":225,"deadlift":405}},"bodybuilding":{"focus":["chest","arms"]}}}$q$), 'completed'), 'true');
select tests.ok('setup: ... and the stored row has no weight-like column', not exists (select 1 from information_schema.columns
  where table_name = 'training_setups' and (column_name ilike '%weight%' or column_name ilike '%bmi%' or column_name ilike '%birth%')));
select tests.login(tests.u(63));
select tests.rows('setup: another user still sees no rows', 'select * from public.training_setups', 0);
select tests.logout();
select tests.ok('setup: audit records the save without content', exists (select 1 from public.audit_log where action = 'training_setup_saved' and actor_id = tests.u(50) and metadata = '{}'::jsonb));
select tests.ok('setup: authenticated has no write grants on training_setups', not exists (
  select 1 from information_schema.role_table_grants where grantee in ('authenticated','anon') and table_name = 'training_setups'
    and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')));

-- =============================================================== 3. parent invites
select tests.login(tests.u(50));
select tests.raises('invite: an adult cannot create a parent invite', $q$select public.create_parent_invite('mum@example.invalid')$q$, 'not_allowed');
select tests.login(null, 'anon');
select tests.raises('invite: anon cannot create', $q$select public.create_parent_invite('mum@example.invalid')$q$, 'permission denied%');
select tests.raises('invite: anon cannot accept', format($q$select tests.accept_inv(%L)$q$, repeat('a', 64)), 'permission denied%');
select tests.login(tests.u(52));
select tests.raises('invite: malformed email rejected', $q$select public.create_parent_invite('not-an-email')$q$, 'invalid_email');
select tests.raises('invite: empty email rejected', $q$select public.create_parent_invite('')$q$, 'invalid_email');
select tests.raises('invite: email over 254 chars rejected', format('select public.create_parent_invite(%L)', repeat('a', 250) || '@example.invalid'), 'invalid_email');
select tests.eq('invite: queued with a neutral answer', $q$select public.create_parent_invite('Parent52@Example.Invalid')::text$q$, '{"status": "queued"}');
select tests.eq('invite: an address that belongs to an existing account gets the identical answer', format('select public.create_parent_invite(%L)::text', 'p3-53@example.invalid'), '{"status": "queued"}');
select tests.eq('invite: the caller''s own address gets the identical answer', format('select public.create_parent_invite(%L)::text', 'P3-52@example.invalid'), '{"status": "queued"}');
select tests.logout();
select tests.eq('invite: own address queued nothing', $q$select count(*)::text from public.parent_invites where minor_user_id = tests.u(52) and parent_email = 'p3-52@example.invalid'$q$, '0');
select tests.eq('invite: the earlier invite was cancelled and its address erased (fix-the-email path)',
  $q$select count(*)::text from public.parent_invites where minor_user_id = tests.u(52) and status = 'cancelled' and parent_email is null and token_hash is null$q$, '1');
select tests.eq('invite: exactly one open invite', $q$select count(*)::text from public.parent_invites where minor_user_id = tests.u(52) and status in ('queued','sent')$q$, '1');
select tests.ok('invite: email stored lower-cased; expiry = profile created_at + 14 days',
  exists (select 1 from public.parent_invites i join public.profiles p on p.id = i.minor_user_id
           where i.minor_user_id = tests.u(52) and i.status = 'queued' and i.parent_email = 'p3-53@example.invalid'
             and i.expires_at = p.created_at + interval '14 days'));
select tests.login(tests.u(52));
select tests.rows('invite: the minor reads own invite status', 'select id, status from public.parent_invites', 2);
select tests.no_rows('invite: the minor cannot read the parent email', 'select parent_email from public.parent_invites');
select tests.no_rows('invite: the minor cannot read token hashes', 'select token_hash from public.parent_invites');
select tests.blocked('invite: direct insert denied', format($q$insert into public.parent_invites (minor_user_id, parent_email, expires_at) values (%L, 'x@example.invalid', now() + interval '1 day')$q$, tests.u(52)));
select tests.blocked('invite: direct update denied', $q$update public.parent_invites set status = 'accepted'$q$);
select tests.blocked('invite: direct delete denied', $q$delete from public.parent_invites$q$);
select tests.blocked('invite: the minor cannot forge a parent link', format($q$insert into public.parent_links (minor_user_id, parent_user_id, status) values (%L, %L, 'active')$q$, tests.u(52), tests.u(53)));
select tests.login(tests.u(53));
select tests.no_rows('invite: other users see no invites', 'select * from public.parent_invites');
select tests.login(tests.u(52));
select public.create_parent_invite('three@example.invalid');
select public.create_parent_invite('four@example.invalid');
select public.create_parent_invite('five@example.invalid');
select tests.raises('invite: at most 5 per day', $q$select public.create_parent_invite('six@example.invalid')$q$, 'rate_limited');
select tests.logout();
select tests.eq('invite: the rate-limited attempt created nothing', $q$select count(*)::text from public.parent_invites where minor_user_id = tests.u(52)$q$, '5');
select tests.ok('invite: only the newest invite keeps an address', (select count(*) = 1 from public.parent_invites where minor_user_id = tests.u(52) and parent_email is not null));

-- real invites for the accept scenarios
select tests.login(tests.u(54)); select public.create_parent_invite('parent54@example.invalid');
select tests.login(tests.u(60)); select public.create_parent_invite('a60@example.invalid');
select tests.login(tests.u(62)); select public.create_parent_invite('p62@example.invalid');
select tests.login(tests.u(54));
select tests.raises('invite: a minor cannot claim invites', 'select * from public.claim_parent_invites_to_send()', 'permission denied%');
select tests.login(tests.u(50));
select tests.raises('invite: an adult cannot claim invites', 'select * from public.claim_parent_invites_to_send()', 'permission denied%');
select tests.login(tests.u(50), 'authenticated', 'service_role');
select tests.raises('invite: a forged service_role claim cannot claim invites', 'select * from public.claim_parent_invites_to_send()', 'permission denied%');
select tests.login(null, 'service_role');
insert into tests.tokens select c.invite_id, c.parent_email, c.token, i.minor_user_id
  from public.claim_parent_invites_to_send() c join public.parent_invites i on i.id = c.invite_id;
select tests.eq('invite: the sender gets one token per queued invite', 'select count(*)::text from tests.tokens', '4');
select tests.eq('invite: a second claim returns nothing (already handed over)', 'select count(*)::text from public.claim_parent_invites_to_send()', '0');
select tests.logout();
select tests.ok('invite: tokens are 256-bit hex', (select bool_and(token ~ '^[0-9a-f]{64}$') from tests.tokens));
select tests.ok('invite: only the SHA-256 of the token is stored, status sent',
  (select bool_and(i.token_hash = encode(extensions.digest(convert_to(t.token, 'UTF8'), 'sha256'), 'hex') and i.token_hash <> t.token and i.status = 'sent' and i.sent_at is not null and i.attempts = 1)
     from tests.tokens t join public.parent_invites i on i.id = t.inv));
select tests.ok('invite: no raw token appears anywhere in the table', not exists (select 1 from public.parent_invites i, tests.tokens t where i.token_hash = t.token or i::text like '%' || t.token || '%'));
select tests.ok('invite: tokens are distinct', (select count(distinct token) = count(*) from tests.tokens));

-- accept: failures (all the same generic false), arguments, rate limit
select tests.login(tests.u(71));
select tests.raises('accept: missing attestation refused', format($q$select public.accept_parent_invite(%L, null, %L, 'terms-v1', %L, 'risk-v1', %L, 'privacy-v1', %L)$q$, tests.tok(tests.u(54)), tests.h('a'), tests.h('e'), tests.h('c'), tests.h('d')), 'attestation_required');
select tests.raises('accept: missing parent risk acknowledgement refused', format($q$select public.accept_parent_invite(%L, 'attest-v1', %L, 'terms-v1', %L, null, null, 'privacy-v1', %L)$q$, tests.tok(tests.u(54)), tests.h('a'), tests.h('e'), tests.h('d')), 'attestation_required');
select tests.raises('accept: malformed risk hash refused', format($q$select public.accept_parent_invite(%L, 'attest-v1', %L, 'terms-v1', %L, 'risk-v1', 'zz', 'privacy-v1', %L)$q$, tests.tok(tests.u(54)), tests.h('a'), tests.h('e'), tests.h('d')), 'attestation_required');
select tests.raises('accept: missing terms version refused', format($q$select public.accept_parent_invite(%L, 'attest-v1', %L, '', %L, 'risk-v1', %L, 'privacy-v1', %L)$q$, tests.tok(tests.u(54)), tests.h('a'), tests.h('e'), tests.h('c'), tests.h('d')), 'attestation_required');
select tests.raises('accept: missing terms hash refused', format($q$select public.accept_parent_invite(%L, 'attest-v1', %L, 'terms-v1', null, 'risk-v1', %L, 'privacy-v1', %L)$q$, tests.tok(tests.u(54)), tests.h('a'), tests.h('c'), tests.h('d')), 'attestation_required');
select tests.raises('accept: malformed terms hash refused', format($q$select public.accept_parent_invite(%L, 'attest-v1', %L, 'terms-v1', 'zz', 'risk-v1', %L, 'privacy-v1', %L)$q$, tests.tok(tests.u(54)), tests.h('a'), tests.h('c'), tests.h('d')), 'attestation_required');
select tests.eq('accept: unknown token -> generic false', format('select tests.accept_inv(%L)::text', repeat('0', 64)), 'false');
select tests.eq('accept: malformed token -> the same generic false', $q$select tests.accept_inv('not-a-token')::text$q$, 'false');
select tests.eq('accept: null token -> the same generic false', 'select tests.accept_inv(null)::text', 'false');
select tests.login(tests.u(60));
select tests.eq('accept: a minor cannot accept an invite (even another minor''s valid token) -> generic false', format('select tests.accept_inv(%L)::text', tests.tok(tests.u(62))), 'false');
select tests.login(tests.u(54));
select tests.eq('accept: a minor cannot accept their own invite -> generic false', format('select tests.accept_inv(%L)::text', tests.tok(tests.u(54))), 'false');
select tests.logout();
select tests.ok('accept: those failures linked nobody', not exists (select 1 from public.parent_links where minor_user_id in (tests.u(54), tests.u(60), tests.u(62))));
select tests.ok('accept: failed attempts are recorded (survive because the function returns)', (select count(*) >= 3 from private.parent_invite_attempts where user_id = tests.u(71)));

-- rate limit: 10 failures / hour / user, then even a valid token is refused (and stays valid)
select tests.login(tests.u(61));
do $$ begin for i in 1..10 loop perform tests.accept_inv(repeat(to_hex(i), 64)); end loop; end $$;
select tests.raises('accept: rate limited after 10 failed attempts an hour', format('select tests.accept_inv(%L)', tests.tok(tests.u(54))), 'rate_limited');
select tests.logout();
select tests.ok('accept: the rate-limited call did not consume the invite', exists (select 1 from public.parent_invites where minor_user_id = tests.u(54) and status = 'sent'));
select tests.ok('accept: the other users'' budgets are separate', (select count(*) from private.parent_invite_attempts where user_id = tests.u(71)) < 10);

-- accept: success (u55 for u54)
select tests.login(tests.u(55));
select tests.eq('accept: a valid token + attestation links the parent', format('select tests.accept_inv(%L)::text', tests.tok(tests.u(54))), 'true');
select tests.eq('accept: the token is single use (replay -> generic false)', format('select tests.accept_inv(%L)::text', tests.tok(tests.u(54))), 'false');
select tests.login(tests.u(71));
select tests.eq('accept: another adult cannot reuse the consumed token', format('select tests.accept_inv(%L)::text', tests.tok(tests.u(54))), 'false');
select tests.logout();
select tests.ok('accept: active contracting-party link for that parent',
  exists (select 1 from public.parent_links where minor_user_id = tests.u(54) and parent_user_id = tests.u(55) and status = 'active' and is_contracting_party and accepted_at is not null));
select tests.ok('accept: the minor is onboarded', app.is_minor_onboarded(tests.u(54)));
select tests.ok('accept: invite accepted, parent email and token hash erased, accepted_by set',
  exists (select 1 from public.parent_invites where minor_user_id = tests.u(54) and status = 'accepted' and parent_email is null and token_hash is null and accepted_by = tests.u(55)));
select tests.ok('accept: parental consent recorded for the minor by the parent with the attestation hash',
  exists (select 1 from public.consents where user_id = tests.u(54) and kind = 'parental' and grantor = 'parent' and actor_user_id = tests.u(55)
            and granted and policy_version = 'attest-v1' and text_hash = tests.h('a')));
select tests.ok('accept: parent risk acknowledgement recorded (grantor parent, version + hash)',
  exists (select 1 from public.consents where user_id = tests.u(54) and kind = 'risk_notice' and grantor = 'parent' and actor_user_id = tests.u(55)
            and granted and policy_version = 'risk-v1' and text_hash = tests.h('c')));
select tests.ok('accept: parental + risk events logged with grantor parent',
  (select count(*) = 2 from public.consent_events where user_id = tests.u(54) and grantor = 'parent' and granted and kind in ('parental','risk_notice')));
select tests.ok('accept: the parent''s Terms acceptance is recorded for the parent',
  exists (select 1 from public.consent_events where user_id = tests.u(55) and kind = 'terms' and policy_version = 'terms-v1' and actor_user_id = tests.u(55)));
select tests.ok('accept: audit has no email or token', not exists (select 1 from public.audit_log where metadata::text like '%@%' or metadata::text ~ '[0-9a-f]{64}'));
select tests.login(tests.u(55));
select tests.rows('accept: the parent sees their link', format('select * from public.parent_links where minor_user_id = %L', tests.u(54)), 1);
select tests.no_rows('accept: the parent still cannot read the minor profile', format('select id from public.profiles where id = %L', tests.u(54)));
select tests.no_rows('accept: the parent cannot read invites', 'select * from public.parent_invites');

-- cancelled invite (u60: A was claimed, then the minor fixes the email -> A is dead)
select tests.login(tests.u(60));
select public.create_parent_invite('b60@example.invalid');
select tests.login(tests.u(71));
select tests.eq('accept: a cancelled invite''s token no longer works', format('select tests.accept_inv(%L)::text', tests.tok(tests.u(60))), 'false');
select tests.logout();
select tests.ok('invite: the cancelled invite lost its email and token', exists (select 1 from public.parent_invites where minor_user_id = tests.u(60) and status = 'cancelled' and parent_email is null and token_hash is null));
select tests.ok('invite: the corrected invite is queued', exists (select 1 from public.parent_invites where minor_user_id = tests.u(60) and status = 'queued' and parent_email = 'b60@example.invalid'));

-- expiry (queued and sent)
update public.parent_invites set expires_at = now() - interval '1 hour' where minor_user_id in (tests.u(60), tests.u(62));
select tests.login(tests.u(71));
select tests.eq('accept: an expired (sent) invite -> generic false', format('select tests.accept_inv(%L)::text', tests.tok(tests.u(62))), 'false');
select tests.login(null, 'service_role');
select tests.eq('invite: expired invites are not handed to the sender', 'select count(*)::text from public.claim_parent_invites_to_send()', '0');
select tests.logout();
select tests.ok('invite: expiry (run by the sender''s claim, and again here) is idempotent', private.expire_parent_invites() = 0);
select tests.ok('invite: expired invites lost their email and token hash',
  (select count(*) = 2 and bool_and(status = 'expired' and parent_email is null and token_hash is null) from public.parent_invites where minor_user_id in (tests.u(60), tests.u(62)) and status <> 'cancelled'));
-- day-14 purge cascades invites with the pending minor
update public.profiles set created_at = now() - interval '15 days' where id = tests.u(62);
select tests.login(null, 'service_role');
select tests.ok('invite: day-14 purge removes the pending minor', public.purge_pending_minors() >= 1);
select tests.logout();
select tests.ok('invite: ...and its invites (and any email) cascade away', not exists (select 1 from public.parent_invites where minor_user_id = tests.u(62))
  and not exists (select 1 from public.profiles where id = tests.u(62)));

-- accept_parent_link: attested replacement of the 1-arg function
select tests.ok('link: the 1-argument accept_parent_link is gone', not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'accept_parent_link' and p.pronargs = 1));
select tests.login(tests.u(58)); select public.link_parent(tests.u(58), tests.u(59));
select tests.login(tests.u(59));
select tests.raises('link: accept without attestation refused', $q$select public.accept_parent_link((select id from public.parent_links where minor_user_id = tests.u(58)), null, null, 'terms-v1', null, 'risk-v1', null, 'privacy-v1', null)$q$, 'attestation_required');
select tests.raises('link: accept without the parent risk acknowledgement refused', format($q$select public.accept_parent_link((select id from public.parent_links where minor_user_id = %L), 'attest-v1', %L, 'terms-v1', %L, null, null, 'privacy-v1', %L)$q$, tests.u(58), tests.h('a'), tests.h('e'), tests.h('d')), 'attestation_required');
select tests.logout();
select tests.ok('link: refused accepts leave the link pending', (select status = 'pending' from public.parent_links where minor_user_id = tests.u(58)));
select tests.login(tests.u(71));
select tests.raises('link: an outsider with full arguments is still forbidden', $q$select tests.accept_link((select id from public.parent_links where minor_user_id = tests.u(58)))$q$, 'forbidden');
select tests.login(tests.u(59));
select tests.accept_link((select id from public.parent_links where minor_user_id = tests.u(58)));
select tests.logout();
select tests.ok('link: attested accept activates the link and records parental + parent risk',
  app.is_minor_onboarded(tests.u(58))
  and exists (select 1 from public.consents where user_id = tests.u(58) and kind = 'parental' and grantor = 'parent' and text_hash = tests.h('a'))
  and exists (select 1 from public.consents where user_id = tests.u(58) and kind = 'risk_notice' and grantor = 'parent' and actor_user_id = tests.u(59)));
select tests.login(tests.u(54));
select tests.raises('link: a minor still cannot revoke their guardian', $q$select public.revoke_parent_link((select id from public.parent_links where minor_user_id = tests.u(54)))$q$, 'forbidden');
select tests.logout();

-- =============================================================== 4. trainer codes
select tests.login(tests.u(57));
select tests.raises('codes: an athlete cannot create a code', 'select public.create_trainer_code()', 'forbidden');
select tests.raises('codes: an athlete cannot pick a coach', format('select public.create_trainer_code(25, 30, %L)', tests.u(56)), 'forbidden');
select tests.login(tests.u(52));
select tests.raises('codes: a minor cannot create a code', 'select public.create_trainer_code()', 'forbidden');
select tests.login(null, 'anon');
select tests.raises('codes: anon cannot create', 'select public.create_trainer_code()', 'permission denied%');
select tests.raises('codes: anon cannot revoke', format('select public.revoke_trainer_code(%L)', tests.u(1)), 'permission denied%');
select tests.logout();
select tests.ok('codes: the old client-chosen create_trainer_code signature is gone', not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'create_trainer_code' and p.pronargs = 4));
select tests.ok('codes: the old 1-argument redeem signature is gone', not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'redeem_trainer_code' and p.pronargs = 1));

select tests.login(tests.u(56));
select tests.mkcode('main');
select tests.mkcode('one', 1, 5);
select tests.mkcode('rev');
select tests.mkcode('exp');
select tests.raises('codes: a coach cannot create for another coach', format('select public.create_trainer_code(25, 30, %L)', tests.u(70)), 'forbidden');
select tests.ok('codes: a coach can name themselves', (public.create_trainer_code(5, 7, tests.u(56)) ->> 'id') is not null);
select tests.raises('codes: max redemptions 0 rejected', 'select public.create_trainer_code(0, 30)', 'invalid_argument');
select tests.raises('codes: max redemptions 501 rejected', 'select public.create_trainer_code(501, 30)', 'invalid_argument');
select tests.raises('codes: expiry 0 days rejected (expiry is required)', 'select public.create_trainer_code(25, 0)', 'invalid_argument');
select tests.raises('codes: expiry 91 days rejected', 'select public.create_trainer_code(25, 91)', 'invalid_argument');
select tests.raises('codes: null expiry rejected', 'select public.create_trainer_code(25, null)', 'invalid_argument');
select tests.ok('codes: boundaries 1/1 and 500/90 accepted', (public.create_trainer_code(1, 1) ->> 'id') is not null and (public.create_trainer_code(500, 90) ->> 'id') is not null);
select tests.logout();
select tests.ok('codes: format is XXXX-XXXX-XXXX-XXXX in Crockford base32 (no I L O U)',
  (select bool_and(code ~ '^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$') from tests.codes3));
select tests.ok('codes: only the peppered hash is stored (no column holds the code)', not exists (
  select 1 from public.trainer_codes t, tests.codes3 c where t::text ilike '%' || c.code || '%' or t::text ilike '%' || replace(c.code, '-', '') || '%'));
select tests.ok('codes: hash is hex sha256 and not the code', (select bool_and(code_hash ~ '^[0-9a-f]{64}$') from public.trainer_codes));
select tests.ok('codes: expiry and limits stored', exists (select 1 from public.trainer_codes t join tests.codes3 c on c.id = t.id
  where c.label = 'main' and t.max_redemptions = 25 and t.expires_at between now() + interval '29 days 23 hours' and now() + interval '30 days 1 hour' and not t.revoked and t.redemptions = 0));
select tests.ok('codes: audit never contains a code', not exists (select 1 from public.audit_log a, tests.codes3 c where a.metadata::text ilike '%' || c.code || '%'));
select tests.blocked('codes: a code without an expiry cannot be inserted', format($q$insert into public.trainer_codes (code_hash, coach_id, expires_at) values (%L, %L, null)$q$, repeat('e', 64), tests.u(56)));
select tests.blocked('codes: max_redemptions above 500 cannot be inserted', format($q$insert into public.trainer_codes (code_hash, coach_id, expires_at, max_redemptions) values (%L, %L, now() + interval '1 day', 501)$q$, repeat('f', 64), tests.u(56)));

-- service / admin path
select tests.login(null, 'service_role');
select tests.ok('codes: service can create for a verified coach', (public.create_trainer_code(3, 3, tests.u(70)) ->> 'code') ~ '^[0-9A-Z]{4}-');
select tests.raises('codes: service cannot create for a non-coach', format('select public.create_trainer_code(3, 3, %L)', tests.u(57)), 'invalid_coach');
select tests.raises('codes: service must name a coach', 'select public.create_trainer_code(3, 3)', 'invalid_coach');
select tests.logout();

-- entropy: 150 codes, all distinct, all 32 symbols used, 80 bits long
select tests.login(null, 'service_role');
insert into tests.bulk select public.create_trainer_code(1, 1, tests.u(56)) ->> 'code' from generate_series(1, 150);
select tests.logout();
select tests.ok('entropy: 150 generated codes are all distinct', (select count(distinct code) = 150 from tests.bulk));
select tests.ok('entropy: every code is 16 symbols (80 bits at 5 bits each)', (select bool_and(length(replace(code, '-', '')) = 16) from tests.bulk));
select tests.ok('entropy: all 32 Crockford symbols occur and none of I L O U',
  (select count(distinct ch) = 32 from tests.bulk, regexp_split_to_table(replace(code, '-', ''), '') ch)
  and not exists (select 1 from tests.bulk where code ~ '[ILOU]'));
select tests.ok('entropy: generator output is unpredictable across calls', private.generate_trainer_code() <> private.generate_trainer_code());

-- redemption
select tests.login(tests.u(57));
select tests.eq('redeem: unknown code -> false', $q$select public.redeem_trainer_code('0000-0000-0000-0000')::text$q$, 'false');
select tests.eq('redeem: empty code -> false', $q$select public.redeem_trainer_code('')::text$q$, 'false');
select tests.eq('redeem: null code -> false', 'select public.redeem_trainer_code(null)::text', 'false');
select tests.eq('redeem: lower case, spaces, no dashes and confusable letters normalise',
  format('select public.redeem_trainer_code(%L)::text', ' ' || lower(translate(replace(tests.code('main'), '-', ' '), '01', 'OL')) || ' '), 'true');
select tests.eq('redeem: repeat redeem is idempotent', format('select public.redeem_trainer_code(%L)::text', tests.code('main')), 'true');
select tests.logout();
select tests.ok('redeem: one relationship, one redemption counted', (select count(*) = 1 from public.coach_relationships where coach_id = tests.u(56) and client_id = tests.u(57) and status = 'active')
  and (select redemptions = 1 from public.trainer_codes where id = (select id from tests.codes3 where label = 'main')));
-- every other failure is the same single outcome
select tests.login(tests.u(56));
select tests.eq('redeem: own code -> false', format('select public.redeem_trainer_code(%L)::text', tests.code('main')), 'false');
select tests.login(tests.u(52));
select tests.eq('redeem: a pending minor -> the same false', format('select public.redeem_trainer_code(%L)::text', tests.code('main')), 'false');
select tests.login(tests.u(71));
select tests.login(tests.u(57));
select tests.raises('revoke: a client cannot revoke a code', format('select public.revoke_trainer_code(%L)', (select id from tests.codes3 where label = 'rev')), 'forbidden');
select tests.login(tests.u(70));
select tests.raises('revoke: another coach cannot revoke it', format('select public.revoke_trainer_code(%L)', (select id from tests.codes3 where label = 'rev')), 'forbidden');
select tests.login(tests.u(56));
select public.revoke_trainer_code((select id from tests.codes3 where label = 'rev'));
select tests.logout();
select tests.ok('revoke: the owning coach revoked it', (select revoked from public.trainer_codes where id = (select id from tests.codes3 where label = 'rev')));
select tests.ok('revoke: audited without the code', exists (select 1 from public.audit_log where action = 'trainer_code_revoked' and actor_id = tests.u(56)));
update public.trainer_codes set expires_at = now() - interval '1 minute' where id = (select id from tests.codes3 where label = 'exp');
select tests.mkcode_as(tests.u(70), 'c2');
select tests.login(tests.u(63));
select tests.eq('redeem: client of the one-use code succeeds', format('select public.redeem_trainer_code(%L)::text', tests.code('one')), 'true');
select tests.login(tests.u(71));
select tests.eq('redeem: exhausted code -> false', format('select public.redeem_trainer_code(%L)::text', tests.code('one')), 'false');
select tests.eq('redeem: revoked code -> false', format('select public.redeem_trainer_code(%L)::text', tests.code('rev')), 'false');
select tests.eq('redeem: expired code -> false', format('select public.redeem_trainer_code(%L)::text', tests.code('exp')), 'false');
select tests.login(null, 'service_role');
select public.set_user_role(tests.u(70), 'athlete');
select tests.login(tests.u(71));
select tests.eq('redeem: a coach who is no longer verified -> false', format('select public.redeem_trainer_code(%L)::text', tests.code('c2')), 'false');
select tests.login(null, 'service_role');
select public.set_user_role(tests.u(70), 'coach_verified');
select tests.logout();
select tests.ok('redeem: no relationship was created by any failure', not exists (select 1 from public.coach_relationships where client_id in (tests.u(71), tests.u(52))));
select tests.ok('redeem: failures are recorded as hashed attempts only', (select count(*) >= 8 from private.trainer_code_attempts where not success)
  and not exists (select 1 from private.trainer_code_attempts where ip_hash is not null and ip_hash !~ '^[0-9a-f]{64}$'));
select tests.login(tests.u(57));
select tests.no_rows('attempts: clients cannot read the attempts table', 'select * from private.trainer_code_attempts');
select tests.logout();

-- rate limits
select tests.login(tests.u(64));
do $$ begin for i in 1..10 loop perform public.redeem_trainer_code('WRONG-' || i); end loop; end $$;
select tests.raises('limit: 10 failures an hour per user, then rate_limited even for a valid code', format('select public.redeem_trainer_code(%L)', tests.code('main')), 'rate_limited');
select tests.logout();
select tests.ok('limit: a rate-limited call does not redeem', (select redemptions = 1 from public.trainer_codes where id = (select id from tests.codes3 where label = 'main'))
  and not exists (select 1 from public.coach_relationships where client_id = tests.u(64)));
-- 9 recent failures: still allowed
insert into private.trainer_code_attempts (user_id, success, at) select tests.u(66), false, now() - interval '10 minutes' from generate_series(1, 9);
select tests.login(tests.u(66));
select tests.eq('limit: 9 failures in the hour is still under the limit', format('select public.redeem_trainer_code(%L)::text', tests.code('main')), 'true');
-- daily: 29 failures older than an hour, the 30th trips the day limit
select tests.logout();
insert into private.trainer_code_attempts (user_id, success, at) select tests.u(65), false, now() - interval '3 hours' from generate_series(1, 29);
select tests.login(tests.u(65));
select tests.eq('limit: failures older than an hour do not trip the hourly limit', $q$select public.redeem_trainer_code('NOPE-NOPE')::text$q$, 'false');
select tests.raises('limit: 30 failures a day per user -> rate_limited', format('select public.redeem_trainer_code(%L)', tests.code('main')), 'rate_limited');
select tests.logout();
-- per IP (header preference: cf-connecting-ip, x-real-ip, LAST x-forwarded-for hop; stored hashed)
insert into private.trainer_code_attempts (user_id, ip_hash, success, at)
  select tests.u(90), private.pepper_hash('ip', '198.51.100.7'), false, now() - interval '10 minutes' from generate_series(1, 30);
select set_config('request.headers', '{"x-forwarded-for": "203.0.113.99, 198.51.100.7"}', false);
select tests.login(tests.u(67));
select tests.raises('limit: 30 failures an hour per IP -> rate_limited (last x-forwarded-for hop, a spoofed first hop does not evade it)', format('select public.redeem_trainer_code(%L)', tests.code('main')), 'rate_limited');
select tests.logout();
select set_config('request.headers', '{"x-forwarded-for": "198.51.100.7, 203.0.113.99"}', false);
select tests.login(tests.u(67));
select tests.eq('limit: the FIRST x-forwarded-for hop is ignored (client-controlled)', $q$select public.redeem_trainer_code('NOPE-NOPE')::text$q$, 'false');
select tests.logout();
select set_config('request.headers', '{"x-real-ip": "198.51.100.7", "x-forwarded-for": "198.51.100.8"}', false);
select tests.login(tests.u(67));
select tests.raises('limit: x-real-ip is preferred over x-forwarded-for', format('select public.redeem_trainer_code(%L)', tests.code('main')), 'rate_limited');
select tests.logout();
select set_config('request.headers', '{"cf-connecting-ip": "198.51.100.8", "x-real-ip": "198.51.100.7", "x-forwarded-for": "198.51.100.7"}', false);
select tests.login(tests.u(67));
select tests.eq('limit: cf-connecting-ip is preferred over x-real-ip and x-forwarded-for', $q$select public.redeem_trainer_code('NOPE-NOPE')::text$q$, 'false');
select tests.logout();
select set_config('request.headers', '{"cf-connecting-ip": "198.51.100.7"}', false);
select tests.login(tests.u(67));
select tests.raises('limit: cf-connecting-ip alone is enough to trip the IP limit', format('select public.redeem_trainer_code(%L)', tests.code('main')), 'rate_limited');
select tests.logout();
select set_config('request.headers', '{"x-forwarded-for": "198.51.100.8"}', false);
select tests.login(tests.u(67));
select tests.eq('limit: a different IP is unaffected', $q$select public.redeem_trainer_code('NOPE-NOPE')::text$q$, 'false');
select tests.logout();
select set_config('request.headers', '', false);
select tests.login(tests.u(68));
select tests.eq('limit: with no usable header the IP limit is simply skipped', $q$select public.redeem_trainer_code('NOPE-NOPE')::text$q$, 'false');
select tests.logout();
select tests.ok('limit: IP is stored only as a peppered hash', not exists (select 1 from private.trainer_code_attempts where ip_hash like '%198.51.100%')
  and exists (select 1 from private.trainer_code_attempts where ip_hash = private.pepper_hash('ip', '198.51.100.8')));
-- per device
insert into private.trainer_code_attempts (user_id, device_hash, success, at)
  select tests.u(90), private.pepper_hash('device', 'device-abc'), false, now() - interval '5 minutes' from generate_series(1, 10);
select tests.login(tests.u(68));
select tests.raises('limit: 10 failures an hour per device -> rate_limited', format('select public.redeem_trainer_code(%L, %L)', tests.code('main'), 'device-abc'), 'rate_limited');
select tests.eq('limit: another device id is fine', $q$select public.redeem_trainer_code('NOPE-NOPE', 'device-xyz')::text$q$, 'false');
select tests.eq('limit: no device id is fine', $q$select public.redeem_trainer_code('NOPE-NOPE')::text$q$, 'false');
select tests.logout();
select tests.ok('limit: device id stored only hashed', not exists (select 1 from private.trainer_code_attempts where device_hash like '%device-%')
  and exists (select 1 from private.trainer_code_attempts where device_hash = private.pepper_hash('device', 'device-xyz')));
-- attempts purge (30 days)
insert into private.trainer_code_attempts (user_id, success, at) values (tests.u(90), false, now() - interval '31 days'), (tests.u(90), false, now() - interval '29 days');
insert into private.parent_invite_attempts (user_id, at) values (tests.u(90), now() - interval '31 days'), (tests.u(90), now() - interval '2 days');
select tests.login(tests.u(57));
select tests.raises('purge: clients cannot run the purge', 'select public.run_retention_purge()', 'permission denied%');
select tests.login(null, 'service_role');
select tests.ok('purge: runs and reports the new counters', (public.run_retention_purge() ->> 'trainer_code_attempts')::int >= 1);
select tests.logout();
select tests.ok('purge: attempt rows older than 30 days are gone, recent ones stay',
  not exists (select 1 from private.trainer_code_attempts where at < now() - interval '30 days')
  and exists (select 1 from private.trainer_code_attempts where at > now() - interval '30 days' and at < now() - interval '28 days')
  and not exists (select 1 from private.parent_invite_attempts where at < now() - interval '30 days')
  and exists (select 1 from private.parent_invite_attempts where user_id = tests.u(90)));
select tests.ok('purge: retention schedule documents the new records', (select count(*) = 2 from public.retention_policies where record_type in ('parent_invite_email','trainer_code_attempts')));
-- coaches stay 18+ and never see minors' health fields (unchanged rules, re-asserted with new accounts)
select tests.login(null, 'service_role');
select tests.raises('coaches: a minor still cannot become a coach', format('select public.set_user_role(%L, %L)', tests.u(54), 'coach_verified'), 'coach_must_be_adult');
select tests.logout();

-- =============================================================== 5. privacy & safety + can_train
select tests.login(tests.u(52));
select tests.raises('privacy: a pending minor cannot submit (generic not_allowed)', $q$select tests.privacy(false, false)$q$, 'not_allowed');
select tests.login(null, 'anon');
select tests.raises('privacy: anon cannot submit', $q$select tests.privacy(false, false)$q$, 'permission denied%');
select tests.login(tests.u(50));
select tests.raises('privacy: the risk acknowledgement is required (no version)', format($q$select public.submit_privacy_safety(true, 'h', %L, true, 'a', %L, null, %L)$q$, tests.h('1'), tests.h('2'), tests.h('3')), 'risk_acknowledgement_required');
select tests.raises('privacy: the risk acknowledgement is required (no hash)', format($q$select public.submit_privacy_safety(true, 'h', %L, true, 'a', %L, 'r', null)$q$, tests.h('1'), tests.h('2')), 'risk_acknowledgement_required');
select tests.raises('privacy: a malformed risk hash is refused', format($q$select public.submit_privacy_safety(true, 'h', %L, true, 'a', %L, 'r', 'abc')$q$, tests.h('1'), tests.h('2')), 'risk_acknowledgement_required');
select tests.raises('privacy: health and AI choices must be explicit', format($q$select public.submit_privacy_safety(null, 'h', %L, true, 'a', %L, 'r', %L)$q$, tests.h('1'), tests.h('2'), tests.h('3')), 'invalid_choice');
select tests.raises('privacy: a malformed health text hash is refused', format($q$select public.submit_privacy_safety(true, 'h', 'nope', true, 'a', %L, 'r', %L)$q$, tests.h('2'), tests.h('3')), 'invalid_text_hash');
select tests.raises('privacy: a blank AI version is refused', format($q$select public.submit_privacy_safety(true, 'h', %L, true, '', %L, 'r', %L)$q$, tests.h('1'), tests.h('2'), tests.h('3')), 'invalid_policy_version');
select tests.logout();
select tests.ok('privacy: refused submissions wrote nothing', not exists (select 1 from public.consents where user_id = tests.u(50)));
select tests.ok('privacy: u50 cannot train before the risk acknowledgement', not app.can_train(tests.u(50)));
select tests.login(tests.u(50));
select tests.blocked('can_train: no risk acknowledgement -> cannot log a set', format($q$insert into public.set_logs (user_id, exercise_id, set_index, reps) values (%L, '31000000-0000-0000-0000-000000000050', 0, 5)$q$, tests.u(50)));
select tests.eq('privacy: adult turns Health and AI on with the risk acknowledgement', $q$select tests.privacy(true, true) ->> 'can_train'$q$, 'true');
select tests.logout();
select tests.ok('privacy: health, AI and risk are separate granted rows with version + text hash',
  (select count(*) = 3 from public.consents where user_id = tests.u(50) and grantor = 'self' and granted and text_hash is not null
     and ((kind = 'health_data' and policy_version = 'health-v2' and text_hash = tests.h('1'))
       or (kind = 'ai_vendor' and policy_version = 'ai-B-v2' and text_hash = tests.h('2'))
       or (kind = 'risk_notice' and policy_version = 'risk-v2' and text_hash = tests.h('3')))));
select tests.ok('privacy: each item has its own consent_events row (on) with timestamp',
  (select count(*) = 3 from public.consent_events where user_id = tests.u(50) and granted and at is not null and text_hash is not null and kind in ('health_data','ai_vendor','risk_notice')));
select tests.ok('privacy: effective consent follows', app.has_consent(tests.u(50), 'health_data') and app.has_consent(tests.u(50), 'ai_vendor') and app.can_train(tests.u(50)));
select tests.login(tests.u(50));
select tests.affected('can_train: with the acknowledgement the adult logs a set', format($q$insert into public.set_logs (user_id, exercise_id, set_index, reps) values (%L, '31000000-0000-0000-0000-000000000050', 0, 5)$q$, tests.u(50)), 1);
select tests.affected('can_train: ...and can update it', $q$update public.set_logs set reps = 6 where user_id = auth.uid()$q$, 1);
select tests.eq('privacy: switching Health and AI off logs "off" events with the version + hash shown', $q$select tests.privacy(false, false) ->> 'can_train'$q$, 'true');
select tests.logout();
select tests.ok('privacy: off events recorded', (select count(*) = 2 from public.consent_events where user_id = tests.u(50) and not granted and kind in ('health_data','ai_vendor')
  and policy_version in ('health-v2','ai-B-v2') and text_hash in (tests.h('1'), tests.h('2'))));
select tests.ok('privacy: consents rows revoked, effective consent off, risk acknowledgement kept',
  not app.has_consent(tests.u(50), 'health_data') and not app.has_consent(tests.u(50), 'ai_vendor') and app.has_consent(tests.u(50), 'risk_notice')
  and (select count(*) = 2 from public.consents where user_id = tests.u(50) and kind in ('health_data','ai_vendor') and not granted and revoked_at is not null));
select tests.login(tests.u(50));
select tests.raises('risk: cannot be switched off through revoke_consent', $q$select public.revoke_consent('risk_notice')$q$, 'invalid_consent_kind');
select tests.blocked('risk: the row cannot be deleted by the client', $q$delete from public.consents where kind = 'risk_notice'$q$);
select tests.blocked('risk: the row cannot be turned off by the client', $q$update public.consents set granted = false where kind = 'risk_notice'$q$);
select tests.logout();
select tests.ok('risk: still effective after those attempts', app.can_train(tests.u(50)));
-- off from scratch still leaves an event
select tests.login(tests.u(57));
select tests.privacy(false, false);
select tests.logout();
select tests.ok('privacy: first-time "off" choices are logged as events, with no consents row for them',
  (select count(*) = 2 from public.consent_events where user_id = tests.u(57) and not granted and kind in ('health_data','ai_vendor') and text_hash is not null)
  and not exists (select 1 from public.consents where user_id = tests.u(57) and kind in ('health_data','ai_vendor')));
-- an adult without the acknowledgement cannot log, an existing row cannot be updated either
select tests.ok('can_train: u63 has no acknowledgement', not app.can_train(tests.u(63)));
insert into public.set_logs (user_id, exercise_id, set_index, reps) values (tests.u(63), '31000000-0000-0000-0000-000000000063', 0, 3);
select tests.login(tests.u(63));
select tests.blocked('can_train: no acknowledgement -> insert refused', format($q$insert into public.set_logs (user_id, exercise_id, set_index, reps) values (%L, '31000000-0000-0000-0000-000000000063', 1, 3)$q$, tests.u(63)));
select tests.blocked('can_train: no acknowledgement -> update refused', $q$update public.set_logs set reps = 9 where user_id = auth.uid()$q$);
select tests.rows('can_train: the owner can still read own logs', 'select * from public.set_logs', 1);
select tests.affected('can_train: and delete them', $q$delete from public.set_logs where user_id = auth.uid()$q$, 1);
select tests.logout();

-- teen: both acknowledgements, teen's not locked behind the parent's
select tests.ok('teen: linked but no acknowledgement from the teen -> cannot train (parent already acknowledged at accept)', app.is_minor_onboarded(tests.u(54)) and not app.can_train(tests.u(54)));
select tests.login(tests.u(54));
select tests.blocked('teen: cannot log before their own acknowledgement', format($q$insert into public.set_logs (user_id, exercise_id, set_index, reps) values (%L, '31000000-0000-0000-0000-000000000054', 0, 5)$q$, tests.u(54)));
select tests.raises('teen: turning Health on needs the parent''s grant first', $q$select tests.privacy(true, false)$q$, 'parent_consent_required');
select tests.raises('teen: turning Health + AI on needs the parent''s grants first', $q$select tests.privacy(true, true)$q$, 'parent_consent_required');
select tests.raises('teen: AI on with Health off is refused (health_required)', $q$select tests.privacy(false, true)$q$, 'health_required');
select tests.logout();
select tests.ok('teen: refused submissions wrote nothing for the teen', not exists (select 1 from public.consents where user_id = tests.u(54) and grantor = 'self'));
-- remove the parent's risk row to prove the teen alone is not enough, and the teen's row is not locked behind it
delete from public.consents where user_id = tests.u(54) and kind = 'risk_notice' and grantor = 'parent';
select tests.login(tests.u(54));
select tests.eq('teen: can record their own acknowledgement even without the parent''s (not locked behind it)', $q$select tests.privacy(false, false) ->> 'can_train'$q$, 'false');
select tests.blocked('teen: teen acknowledgement alone does not unlock workouts', format($q$insert into public.set_logs (user_id, exercise_id, set_index, reps) values (%L, '31000000-0000-0000-0000-000000000054', 0, 5)$q$, tests.u(54)));
select tests.logout();
select tests.ok('teen: the self risk row exists, the parent row does not -> can_train false', exists (select 1 from public.consents where user_id = tests.u(54) and kind = 'risk_notice' and grantor = 'self') and not app.can_train(tests.u(54)));
-- parent acknowledges again (restore)
insert into public.consents (user_id, kind, grantor, granted, policy_version, text_hash, granted_at, actor_user_id)
  values (tests.u(54), 'risk_notice', 'parent', true, 'risk-v1', tests.h('c'), now(), tests.u(55));
select tests.ok('teen: both acknowledgements -> can_train', app.can_train(tests.u(54)));
select tests.login(tests.u(54));
select tests.affected('teen: both acknowledgements -> logs a set', format($q$insert into public.set_logs (user_id, exercise_id, set_index, reps) values (%L, '31000000-0000-0000-0000-000000000054', 0, 5)$q$, tests.u(54)), 1);
select tests.logout();
-- parent grants health + AI, teen turns them on
select tests.login(tests.u(55));
select public.record_consent('health_data', 'health-v1', tests.u(54));
select public.record_consent('ai_vendor', 'ai-B-v1', tests.u(54));
select tests.login(tests.u(54));
select tests.eq('teen: with the parent''s grants the teen can turn Health + AI on', $q$select tests.privacy(true, true) ->> 'can_train'$q$, 'true');
select tests.logout();
select tests.ok('teen: Health + AI effective only with both rows', app.has_consent(tests.u(54), 'health_data') and app.has_consent(tests.u(54), 'ai_vendor'));
-- parent unlinks -> can_train drops at once; a stale parent row of the former parent does not count
select tests.login(tests.u(55));
select public.revoke_parent_link((select id from public.parent_links where minor_user_id = tests.u(54) and status = 'active'));
select tests.logout();
select tests.ok('teen: unlinking the parent ends can_train', not app.can_train(tests.u(54)) and not app.is_minor_onboarded(tests.u(54)));
select tests.login(tests.u(54));
select tests.blocked('teen: ...and logging stops', format($q$insert into public.set_logs (user_id, exercise_id, set_index, reps) values (%L, '31000000-0000-0000-0000-000000000054', 1, 5)$q$, tests.u(54)));
select tests.raises('teen: ...and privacy submission is refused again (pending-like)', $q$select tests.privacy(false, false)$q$, 'not_allowed');
select tests.logout();

-- teen linked through accept_parent_link: only the parent's acknowledgement so far -> cannot train
select tests.ok('teen2: parent acknowledged at accept, teen has not -> cannot train', app.is_minor_onboarded(tests.u(58)) and not app.can_train(tests.u(58)));
select tests.login(tests.u(58));
select tests.blocked('teen2: only the parent''s acknowledgement is not enough', format($q$insert into public.set_logs (user_id, exercise_id, set_index, reps) values (%L, '31000000-0000-0000-0000-000000000058', 0, 5)$q$, tests.u(58)));
select tests.eq('teen2: the teen acknowledges -> can_train', $q$select tests.privacy(false, false) ->> 'can_train'$q$, 'true');
select tests.affected('teen2: logs a set', format($q$insert into public.set_logs (user_id, exercise_id, set_index, reps) values (%L, '31000000-0000-0000-0000-000000000058', 0, 5)$q$, tests.u(58)), 1);
select tests.logout();
select tests.ok('can_train: anon cannot call the app helper, authenticated can', not has_function_privilege('anon', 'app.can_train(uuid)', 'EXECUTE') and has_function_privilege('authenticated', 'app.can_train(uuid)', 'EXECUTE'));

-- training setup for the linked teen (minor-safe goals, goal held then uploaded)
select tests.login(tests.u(58));
select tests.eq('teen setup: a minor-safe goal alone saves, not complete yet', $q$select public.save_training_setup('{"goal":"general_fitness"}') ->> 'completed'$q$, 'false');
select tests.raises('teen setup: weight-loss goal refused', $q$select public.save_training_setup('{"goal":"lose"}')$q$, 'invalid_setup');
select tests.raises('teen setup: gain goal refused', $q$select public.save_training_setup('{"goal":"gain"}')$q$, 'invalid_setup');
select tests.raises('teen setup: maintain (adult list) refused', $q$select public.save_training_setup('{"goal":"maintain"}')$q$, 'invalid_setup');
select tests.raises('teen setup: a pace is refused', $q$select public.save_training_setup('{"goal":"consistency","goal_pace":"steady"}')$q$, 'invalid_setup');
select tests.raises('teen setup: a pace on its own is refused', $q$select public.save_training_setup('{"goal_pace":"fast"}')$q$, 'invalid_setup');
select tests.raises('teen setup: body weight refused', $q$select public.save_training_setup('{"current_weight":130}')$q$, 'invalid_setup');
select tests.rows('teen setup: the goal-only save did not overwrite anything else', 'select * from public.training_setups where goal = $$general_fitness$$ and styles is null', 1);
select tests.eq('teen setup: the device-only steps 6-8 upload completes it', format('select public.save_training_setup(%L) ->> %L', tests.setup_json(), 'completed'), 'true');
select tests.eq('teen setup: the goal survived the upload', 'select goal from public.training_setups', 'general_fitness');
select tests.eq('teen setup: all six Counsel-approved minor-safe goal ids are accepted', $q$select string_agg(public.save_training_setup(jsonb_build_object('goal', g)) ->> 'completed', ',') from unnest(array['general_fitness','build_strength','learn_lifts','endurance','sport_event','consistency']) g$q$, 'true,true,true,true,true,true');
select tests.logout();
select tests.ok('teen setup: completed_at kept across partial saves', (select completed_at is not null from public.training_setups where user_id = tests.u(58)));
select tests.login(tests.u(59));
select tests.rows('teen setup: the active parent can read the setup (Counsel Q7)', format('select * from public.training_setups where user_id = %L', tests.u(58)), 1);
select tests.login(tests.u(71));
select tests.no_rows('teen setup: an outsider cannot', format('select * from public.training_setups where user_id = %L', tests.u(58)));
select tests.login(tests.u(56));
select tests.no_rows('teen setup: a coach cannot', format('select * from public.training_setups where user_id = %L', tests.u(58)));
select tests.login(tests.u(58));
select tests.eq('teen setup: a partial save keeps completed_at', $q$select public.save_training_setup('{"days_per_week":5}') ->> 'completed'$q$, 'true');
select tests.logout();
select tests.ok('teen setup: ... days updated, rest kept', (select days_per_week = 5 and units = 'lb' and main_style = 'hybrid' from public.training_setups where user_id = tests.u(58)));
-- revoked parent: setup saving stops (pending-like) and the old parent loses read
select tests.login(tests.u(59));
select public.revoke_parent_link((select id from public.parent_links where minor_user_id = tests.u(58) and status = 'active'));
select tests.no_rows('teen setup: a former parent loses read access', format('select * from public.training_setups where user_id = %L', tests.u(58)));
select tests.login(tests.u(58));
select tests.raises('teen setup: saving stops once unlinked', $q$select public.save_training_setup('{"days_per_week":3}')$q$, 'not_allowed');
select tests.logout();

-- =============================================================== 6. onboarding state
select tests.login(null, 'anon');
select tests.raises('state: anon cannot call it', 'select public.my_onboarding_state()', 'permission denied%');
select tests.login(tests.u(69));
select tests.eq('state: a user without a profile gets null', 'select coalesce(public.my_onboarding_state()::text, $$null$$)', 'null');
select tests.login(tests.u(50));
select tests.eq('state: adult shape and values', $q$select concat_ws('|', s ->> 'is_minor', s ->> 'linked', coalesce(s ->> 'invite_status', 'none'), s ->> 'setup_done', s ->> 'privacy_done', s ->> 'can_train', coalesce(s ->> 'parent_risk_done', 'n/a')) from (select public.my_onboarding_state() s) x$q$,
  'false|false|none|true|true|true|n/a');
select tests.eq('state: documented keys (8 original + health_screen_status + can_ai_plan + split re-ask flags)', $q$select count(*)::text from jsonb_object_keys(public.my_onboarding_state())$q$, '12');
select tests.ok('state: Phase 4 keys are present', (select public.my_onboarding_state() ? 'health_screen_status' and public.my_onboarding_state() ? 'can_ai_plan'));
select tests.login(tests.u(52));
select tests.eq('state: pending minor', $q$select concat_ws('|', s ->> 'is_minor', s ->> 'linked', s ->> 'setup_done', s ->> 'privacy_done', s ->> 'can_train', s ->> 'parent_risk_done') from (select public.my_onboarding_state() s) x$q$,
  'true|false|false|false|false|false');
select tests.ok('state: pending minor sees the latest invite status', (select public.my_onboarding_state() ->> 'invite_status') in ('queued','sent'));
select tests.login(tests.u(53));
select tests.eq('state: another adult sees only their own (not u52''s invite)', $q$select coalesce(public.my_onboarding_state() ->> 'invite_status', 'none')$q$, 'none');
select tests.login(tests.u(54));
select tests.eq('state: teen whose parent unlinked', $q$select concat_ws('|', s ->> 'is_minor', s ->> 'linked', s ->> 'invite_status', s ->> 'privacy_done', s ->> 'can_train', s ->> 'parent_risk_done') from (select public.my_onboarding_state() s) x$q$,
  'true|false|accepted|true|false|false');
select tests.logout();
-- relink u54 to see the linked-and-ready state
select tests.login(tests.u(54)); select public.link_parent(tests.u(54), tests.u(55));
select tests.login(tests.u(55)); select tests.accept_link((select id from public.parent_links where minor_user_id = tests.u(54) and status = 'pending'));
select tests.login(tests.u(54));
select tests.eq('state: relinked teen, parent risk done, teen already acknowledged', $q$select concat_ws('|', s ->> 'linked', s ->> 'privacy_done', s ->> 'can_train', s ->> 'parent_risk_done') from (select public.my_onboarding_state() s) x$q$, 'true|true|true|true');
select tests.logout();

-- =============================================================== 7. global invariants after Phase 3
select tests.ok('rls: every table in public/private still has RLS enabled AND forced', not exists (
  select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname in ('public','private') and c.relkind = 'r' and not (c.relrowsecurity and c.relforcerowsecurity)));
select tests.ok('rls: the new tables exist and are forced', (select count(*) = 5 from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relforcerowsecurity and c.relrowsecurity and (n.nspname, c.relname) in
    (('public','training_setups'),('public','parent_invites'),('private','trainer_code_attempts'),('private','parent_invite_attempts'),('public','trainer_codes'))));
select tests.ok('privileges: anon can still execute only screen_age in public', not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE') and p.proname <> 'screen_age'));
select tests.ok('privileges: service-only Phase 3 functions are not executable by clients', not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and (has_function_privilege('authenticated', p.oid, 'EXECUTE') or has_function_privilege('anon', p.oid, 'EXECUTE'))
    and p.proname in ('claim_parent_invites_to_send','run_retention_purge','purge_pending_minors','claim_pending_minor_reminders')));
select tests.ok('privileges: every Phase 3 client function is executable by authenticated but never by anon', (
  select bool_and(has_function_privilege('authenticated', p.oid, 'EXECUTE') and not has_function_privilege('anon', p.oid, 'EXECUTE'))
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('save_training_setup','create_parent_invite','accept_parent_invite','accept_parent_link',
     'create_trainer_code','revoke_trainer_code','redeem_trainer_code','submit_privacy_safety','my_onboarding_state','complete_signup')));
select tests.ok('privileges: no client grants on private tables (including the new attempts tables)', not exists (select 1 from information_schema.role_table_grants
  where grantee in ('anon','authenticated') and table_schema = 'private'));
select tests.ok('privileges: authenticated has no write grants on the new/changed tables', not exists (
  select 1 from information_schema.role_table_grants where grantee in ('anon','authenticated')
    and table_name in ('training_setups','parent_invites','trainer_codes') and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')));
select tests.ok('privileges: parent_invites email and token hash are not granted to clients', not exists (
  select 1 from information_schema.column_privileges where grantee in ('anon','authenticated') and table_name = 'parent_invites'
    and column_name in ('parent_email','token_hash')));
select tests.ok('privileges: trainer_codes hash column is still not granted', not exists (
  select 1 from information_schema.column_privileges where grantee in ('anon','authenticated') and table_name = 'trainer_codes' and column_name = 'code_hash'));
select tests.ok('privileges: no private function is executable by clients', not exists (
  select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and (has_function_privilege('authenticated', p.oid, 'EXECUTE') or has_function_privilege('anon', p.oid, 'EXECUTE'))));
select tests.ok('privileges: authenticated and anon have no USAGE on private', not has_schema_privilege('authenticated', 'private', 'USAGE') and not has_schema_privilege('anon', 'private', 'USAGE'));
select tests.ok('audit: no emails, tokens or trainer codes anywhere in audit_log', not exists (
  select 1 from public.audit_log a where a.metadata::text like '%@%' or a.metadata::text ~ '[0-9a-f]{64}'
    or exists (select 1 from tests.codes3 c where a.metadata::text ilike '%' || c.code || '%') or exists (select 1 from tests.bulk b where a.metadata::text ilike '%' || b.code || '%')));
select tests.ok('set_logs: insert/update policies require can_train', (
  select bool_and(pg_get_expr(coalesce(polwithcheck, polqual), polrelid) like '%can_train%')
    from pg_policy where polrelid = 'public.set_logs'::regclass and polname in ('set_logs_insert_own','set_logs_update_own')));

-- =============================================================== 9. Counsel follow-ups: policy hashes, AI-needs-health, 12-month re-ask, weight_goal
--   72 adult (AI/health rules, weight goal)    73 adult (re-ask)    74 minor (linked to 75)    75 parent of 74
select tests.login(tests.u(72));
select tests.raises('hash: signup without a privacy version/hash is refused', format('select public.complete_signup(%L, p_terms_version => %L)', tests.dob(30), 'terms-v1'), 'terms_required');
select tests.raises('hash: signup with a privacy version but no hash is refused', format('select public.complete_signup(%L, p_terms_version => %L, p_privacy_version => %L)', tests.dob(30), 'terms-v1', 'privacy-v1'), 'terms_required');
select tests.raises('hash: signup with a malformed privacy hash is refused', format('select public.complete_signup(%L, p_terms_version => %L, p_privacy_version => %L, p_privacy_hash => %L)', tests.dob(30), 'terms-v1', 'privacy-v1', 'xyz'), 'terms_required');
select tests.raises('hash: signup with a malformed terms hash is refused', format('select public.complete_signup(%L, p_terms_version => %L, p_terms_hash => %L, p_privacy_version => %L, p_privacy_hash => %L)', tests.dob(30), 'terms-v1', 'nope', 'privacy-v1', tests.h('d')), 'terms_required');
select tests.logout();
select tests.ok('hash: refused signups leave no profile', not exists (select 1 from public.profiles where id = tests.u(72)));
select tests.login(tests.u(72));
select public.complete_signup(tests.dob(30), p_terms_version => 'terms-v9', p_terms_hash => tests.h('e'), p_privacy_version => 'privacy-v9', p_privacy_hash => tests.h('f'));
select tests.logout();
select tests.ok('hash: signup logs a terms event (version + optional hash) and a SEPARATE privacy_policy event (version + hash)',
  exists (select 1 from public.consent_events where user_id = tests.u(72) and kind = 'terms' and policy_version = 'terms-v9' and policy_doc_hash = tests.h('e') and grantor = 'self' and granted)
  and exists (select 1 from public.consent_events where user_id = tests.u(72) and kind = 'privacy_policy' and policy_version = 'privacy-v9' and policy_doc_hash = tests.h('f') and grantor = 'self' and granted)
  and (select count(*) = 2 from public.consent_events where user_id = tests.u(72)));
select tests.ok('hash: the default signup (no terms hash) leaves the terms hash null and the privacy hash set',
  exists (select 1 from public.consent_events where user_id = tests.u(50) and kind = 'terms' and policy_doc_hash is null)
  and exists (select 1 from public.consent_events where user_id = tests.u(50) and kind = 'privacy_policy' and policy_version = 'privacy-v1' and policy_doc_hash = tests.h('d')));
select tests.ok('hash: privacy_policy is an acceptance event, not a consents row', not exists (select 1 from public.consents where kind = 'privacy_policy'));
select tests.ok('hash: the parent''s accept paths logged a privacy_policy event with the hash (invite + link)',
  exists (select 1 from public.consent_events where user_id = tests.u(55) and kind = 'privacy_policy' and policy_version = 'privacy-v1' and policy_doc_hash = tests.h('d') and actor_user_id = tests.u(55))
  and exists (select 1 from public.consent_events where user_id = tests.u(59) and kind = 'privacy_policy' and policy_doc_hash = tests.h('d')));
select tests.login(tests.u(71));
select tests.raises('hash: accept_parent_invite without privacy version/hash refused', format($q$select public.accept_parent_invite(%L, 'attest-v1', %L, 'terms-v1', %L, 'risk-v1', %L, null, null)$q$, repeat('a', 64), tests.h('a'), tests.h('e'), tests.h('c')), 'attestation_required');
select tests.raises('hash: accept_parent_invite with a malformed privacy hash refused', format($q$select public.accept_parent_invite(%L, 'attest-v1', %L, 'terms-v1', %L, 'risk-v1', %L, 'privacy-v1', 'zz')$q$, repeat('a', 64), tests.h('a'), tests.h('e'), tests.h('c')), 'attestation_required');
select tests.raises('hash: accept_parent_link without privacy version/hash refused', format($q$select public.accept_parent_link(gen_random_uuid(), 'attest-v1', %L, 'terms-v1', %L, 'risk-v1', %L, null, null)$q$, tests.h('a'), tests.h('e'), tests.h('c')), 'attestation_required');
select tests.raises('hash: record_consent cannot record privacy_policy', $q$select public.record_consent('privacy_policy', 'v1')$q$, 'invalid_consent_kind');
select tests.raises('hash: revoke_consent cannot revoke privacy_policy', $q$select public.revoke_consent('privacy_policy')$q$, 'invalid_consent_kind');
select tests.logout();

-- submit_privacy_safety: the health policy hash is required and lands on the health AND ai events/rows
select tests.login(tests.u(57));
select tests.raises('hash: submit_privacy_safety without the health policy hash refused', format($q$select public.submit_privacy_safety(true, 'h', %L, false, 'a', %L, 'r', %L)$q$, tests.h('1'), tests.h('2'), tests.h('3')), 'invalid_policy_hash');
select tests.raises('hash: submit_privacy_safety with a malformed health policy hash refused', format($q$select public.submit_privacy_safety(true, 'h', %L, false, 'a', %L, 'r', %L, 'bad')$q$, tests.h('1'), tests.h('2'), tests.h('3')), 'invalid_policy_hash');
select tests.logout();
select tests.ok('hash: health + ai events and rows of u50 carry the health policy hash',
  (select count(*) = 4 from public.consent_events where user_id = tests.u(50) and kind in ('health_data','ai_vendor') and policy_doc_hash = tests.h('4'))
  and (select count(*) = 2 from public.consents where user_id = tests.u(50) and kind in ('health_data','ai_vendor') and policy_doc_hash = tests.h('4')));

-- AI requires health: adult
select tests.login(tests.u(72));
select tests.raises('ai-health: record_consent ai without health -> health_required', $q$select public.record_consent('ai_vendor', 'ai-v1')$q$, 'health_required');
select tests.raises('ai-health: submit_privacy_safety ai on with health off -> health_required', format($q$select public.submit_privacy_safety(false, 'h', %L, true, 'a', %L, 'r', %L, %L)$q$, tests.h('1'), tests.h('2'), tests.h('3'), tests.h('4')), 'health_required');
select tests.logout();
select tests.ok('ai-health: refused attempts wrote no consent row or event for health/ai', not exists (select 1 from public.consents where user_id = tests.u(72))
  and not exists (select 1 from public.consent_events where user_id = tests.u(72) and kind in ('health_data','ai_vendor')));
select tests.login(tests.u(72));
select public.record_consent('health_data', 'health-v1', null, null, tests.h('9'));
select public.record_consent('ai_vendor', 'ai-v1', null, null, tests.h('9'));
select tests.ok('ai-health: with health on, ai can be granted; the document hash is stored on rows and events',
  app.has_consent(tests.u(72), 'ai_vendor') and (select count(*) = 2 from public.consents where user_id = tests.u(72) and policy_doc_hash = tests.h('9'))
  and (select count(*) = 2 from public.consent_events where user_id = tests.u(72) and kind in ('health_data','ai_vendor') and policy_doc_hash = tests.h('9')));
select tests.raises('hash: record_consent rejects a malformed document hash', $q$select public.record_consent('coach_sharing', 'v1', null, null, 'nothex')$q$, 'invalid_text_hash');
select public.revoke_consent('health_data');
select tests.logout();
select tests.ok('ai-health: revoke_consent(health_data) also revokes ai_vendor (rows, events, effective)',
  not app.has_consent(tests.u(72), 'ai_vendor') and not app.has_consent(tests.u(72), 'health_data')
  and (select count(*) = 2 from public.consents where user_id = tests.u(72) and kind in ('health_data','ai_vendor') and not granted and revoked_at is not null)
  and exists (select 1 from public.consent_events where user_id = tests.u(72) and kind = 'ai_vendor' and not granted and policy_doc_hash = tests.h('9')));
select tests.login(tests.u(72));
select tests.raises('ai-health: after the cascade ai cannot come back without health', $q$select public.record_consent('ai_vendor', 'ai-v1')$q$, 'health_required');
select public.record_consent('health_data', 'health-v1');
select tests.logout();
select tests.ok('ai-health: re-granting health does NOT silently restore ai', not app.has_consent(tests.u(72), 'ai_vendor'));
-- submit_privacy_safety paths
select tests.login(tests.u(72));
select tests.privacy(true, true);
select tests.logout();
select tests.ok('ai-health: submit health+ai on', app.has_consent(tests.u(72), 'ai_vendor'));
select tests.login(tests.u(72));
select tests.privacy(false, false);
select tests.logout();
select tests.ok('ai-health: submit health off + ai off -> both off', not app.has_consent(tests.u(72), 'ai_vendor') and not app.has_consent(tests.u(72), 'health_data')
  and not exists (select 1 from public.consents where user_id = tests.u(72) and kind in ('health_data','ai_vendor') and granted));
-- effective AI is false whenever effective health is false, whatever rows exist
update public.consents set granted = true, revoked_at = null where user_id = tests.u(72) and kind = 'ai_vendor';
select tests.ok('ai-health: a stray ai row without health is NOT effective', not app.has_consent(tests.u(72), 'ai_vendor'));
select tests.login(null, 'service_role');
select tests.raises('ai-health: ai_plan_context refuses ai without health (SQL path)', format('select * from public.ai_plan_context(%L)', tests.u(72)), 'consent_required');
select tests.logout();
update public.consents set granted = false, revoked_at = now() where user_id = tests.u(72) and kind = 'ai_vendor';

-- AI requires health: teen + parent (same grantor), and the parent -> teen cascade covers ai
select tests.ok('teen9: u74 minor', (tests.signup3(tests.u(74), tests.dob(16)) ->> 'is_minor') = 'true');
select tests.ok('teen9: u75 parent', (tests.signup3(tests.u(75), tests.dob(45)) ->> 'is_minor') = 'false');
select tests.login(tests.u(74)); select public.link_parent(tests.u(74), tests.u(75));
select tests.login(tests.u(75)); select tests.accept_link((select id from public.parent_links where minor_user_id = tests.u(74)));
select tests.raises('ai-health teen: parent cannot grant ai for the teen without the PARENT health grant', format($q$select public.record_consent('ai_vendor', 'ai-v1', %L)$q$, tests.u(74)), 'health_required');
select public.record_consent('health_data', 'health-v1', tests.u(74));
select public.record_consent('ai_vendor', 'ai-v1', tests.u(74));
select tests.login(tests.u(74));
select tests.raises('ai-health teen: teen cannot turn ai on without the TEEN health grant (parent health does not count)', $q$select public.record_consent('ai_vendor', 'ai-v1')$q$, 'health_required');
select tests.raises('ai-health teen: submit ai on, health off -> health_required', format($q$select public.submit_privacy_safety(false, 'h', %L, true, 'a', %L, 'r', %L, %L)$q$, tests.h('1'), tests.h('2'), tests.h('3'), tests.h('4')), 'health_required');
select public.record_consent('health_data', 'health-v1');
select public.record_consent('ai_vendor', 'ai-v1');
select tests.logout();
select tests.ok('ai-health teen: both grants on for both grantors', app.has_consent(tests.u(74), 'health_data') and app.has_consent(tests.u(74), 'ai_vendor'));
-- teen turns health off: teen ai goes off; the parent's ai grant stays but is not effective
select tests.login(tests.u(74)); select public.revoke_consent('health_data'); select tests.logout();
select tests.ok('ai-health teen: teen revoking health revokes the teen ai row, effective ai off, parent ai row untouched',
  not app.has_consent(tests.u(74), 'ai_vendor')
  and (select not granted from public.consents where user_id = tests.u(74) and kind = 'ai_vendor' and grantor = 'self')
  and (select granted from public.consents where user_id = tests.u(74) and kind = 'ai_vendor' and grantor = 'parent'));
select tests.login(tests.u(74));
select tests.raises('ai-health teen: ai stays locked while the teen health is off', $q$select public.record_consent('ai_vendor', 'ai-v1')$q$, 'health_required');
select public.record_consent('health_data', 'health-v1');
select public.record_consent('ai_vendor', 'ai-v1');
select tests.logout();
select tests.ok('ai-health teen: back on with both', app.has_consent(tests.u(74), 'ai_vendor'));

-- weight_goal in SQL (service-only API emulating the server function). Teen first (health is on for both).
select tests.login(null, 'service_role');
select public.health_register_key(tests.u(74), tests.wk(74), 'local-dev', 'local-dev:test');
select public.health_write(tests.u(74), null, null, null, tests.ct('wg'), array['weight_goal']);
select tests.ok('weight: a 16-17 account may store a weight goal when the optional flag is off',
  exists (select 1 from public.health_records where user_id = tests.u(74) and weight_goal_ct = tests.ct('wg')));
select public.health_write(tests.u(74), tests.ct('n'), null, null, tests.ct('wg'));
select tests.ok('weight: a full replace can also set a teen weight goal',
  exists (select 1 from public.health_records where user_id = tests.u(74) and weight_goal_ct = tests.ct('wg') and injury_notes_ct = tests.ct('n')));
select public.health_write(tests.u(74), tests.ct('teen notes'), null, null, null, array['injury_notes','weight_goal']);
select tests.ok('weight: a teen write that CLEARS weight_goal (null) is allowed', exists (select 1 from public.health_records where user_id = tests.u(74) and weight_goal_ct is null and injury_notes_ct = tests.ct('teen notes')));
select tests.logout();
-- parent revoking health for the teen: teen health + ai off, parent ai off, effective off
select tests.login(tests.u(75)); select public.revoke_consent('health_data', tests.u(74)); select tests.logout();
select tests.ok('ai-health teen: parent revoking health also revokes ai for BOTH grantors (cascade covers ai_vendor)',
  not exists (select 1 from public.consents where user_id = tests.u(74) and kind in ('health_data','ai_vendor') and granted)
  and (select count(*) = 4 from public.consents where user_id = tests.u(74) and kind in ('health_data','ai_vendor') and not granted and revoked_at is not null)
  and not app.has_consent(tests.u(74), 'ai_vendor') and not app.has_consent(tests.u(74), 'health_data'));

-- 12-month re-ask (u73 adult)
select tests.ok('reask: u73 adult', (tests.signup3(tests.u(73), tests.dob(33)) ->> 'is_minor') = 'false');
select tests.login(tests.u(73));
select tests.ok('reask: no consent -> health_reask_due false', (public.my_onboarding_state() ->> 'health_reask_due') = 'false');
select public.record_consent('health_data', 'health-v1');
select public.record_consent('ai_vendor', 'ai-v1');
select tests.logout();
select tests.ok('reask: a health grant stores reask_on = granted date + 12 months', (select reask_on = (granted_at + interval '12 months')::date and reask_on > current_date + 360 from public.consents where user_id = tests.u(73) and kind = 'health_data'));
select tests.ok('reask: only the health row carries a re-ask date', (select reask_on is null from public.consents where user_id = tests.u(73) and kind = 'ai_vendor'));
select tests.login(tests.u(73));
select tests.ok('reask: not due yet', (public.my_onboarding_state() ->> 'health_reask_due') = 'false');
select tests.logout();
update public.consents set reask_on = current_date + 1 where user_id = tests.u(73) and kind = 'health_data';
select tests.login(tests.u(73));
select tests.ok('reask: tomorrow is not due', (public.my_onboarding_state() ->> 'health_reask_due') = 'false');
select tests.logout();
update public.consents set reask_on = current_date where user_id = tests.u(73) and kind = 'health_data';
select tests.login(tests.u(73));
select tests.ok('reask: reask_on <= today -> due', (public.my_onboarding_state() ->> 'health_reask_due') = 'true');
select tests.ok('reask: the consent does NOT expire (still effective, health + ai)', app.has_consent(tests.u(73), 'health_data') and app.has_consent(tests.u(73), 'ai_vendor'));
select public.record_consent('health_data', 'health-v2');
select tests.ok('reask: a fresh grant moves the date 12 months out and clears the flag', (public.my_onboarding_state() ->> 'health_reask_due') = 'false'
  and (select reask_on > current_date + 360 from public.consents where user_id = tests.u(73) and kind = 'health_data'));
select tests.logout();
update public.consents set reask_on = current_date - 30 where user_id = tests.u(73) and kind = 'health_data';
select tests.login(tests.u(73));
select tests.ok('reask: overdue -> due', (public.my_onboarding_state() ->> 'health_reask_due') = 'true');
select public.revoke_consent('health_data');
select tests.ok('reask: revoked -> reask_on null and not due', (public.my_onboarding_state() ->> 'health_reask_due') = 'false'
  and (select reask_on is null from public.consents where user_id = tests.u(73) and kind = 'health_data'));
select tests.login(tests.u(73)); select tests.privacy(true, false); select tests.logout();
select tests.ok('reask: the submit_privacy_safety path sets it too', (select reask_on > current_date + 360 from public.consents where user_id = tests.u(73) and kind = 'health_data'));
select tests.ok('reask: a non-health row can never carry a re-ask date', not exists (select 1 from public.consents where kind <> 'health_data' and reask_on is not null));
select tests.login(tests.u(73)); select tests.privacy(false, false); select tests.logout();
select tests.ok('reask: submit health off clears the date', (select reask_on is null from public.consents where user_id = tests.u(73) and kind = 'health_data'));
-- teen: due only while effective (teen + parent) and a granting row has passed its date
select tests.login(tests.u(75)); select public.record_consent('health_data', 'health-v1', tests.u(74)); select tests.logout();
select tests.login(tests.u(74)); select public.record_consent('health_data', 'health-v1'); select tests.logout();
update public.consents set reask_on = current_date where user_id = tests.u(74) and kind = 'health_data' and grantor = 'parent';
select tests.login(tests.u(74));
select tests.ok('reask: teen effective health + parent row past its date -> due', (public.my_onboarding_state() ->> 'health_reask_due') = 'true');
select tests.logout();
select tests.login(tests.u(75)); select public.revoke_consent('health_data', tests.u(74)); select tests.logout();
select tests.login(tests.u(74));
select tests.ok('reask: teen with health no longer effective -> not due', (public.my_onboarding_state() ->> 'health_reask_due') = 'false');
select tests.logout();

-- weight_goal in SQL: adult (u72), partial updates, backward compatibility
select tests.login(tests.u(72)); select public.record_consent('health_data', 'health-v1'); select tests.logout();
select tests.login(null, 'service_role');
select tests.raises('weight: even the service API refuses a write before a data key exists', format($q$select public.health_write(%L, null, null, null, null, null)$q$, tests.u(72)), 'no_data_key');
select public.health_register_key(tests.u(72), tests.wk(72), 'local-dev', 'local-dev:test');
select public.health_write(tests.u(72), tests.ct('n1'), tests.ct('s1'), tests.ct('c1'));
select tests.ok('weight: legacy 4-argument call still replaces the three old fields (weight cleared)', exists (select 1 from public.health_records where user_id = tests.u(72)
  and injury_notes_ct = tests.ct('n1') and health_screen_ct = tests.ct('s1') and injury_category_ct = tests.ct('c1') and weight_goal_ct is null));
select public.health_write(tests.u(72), null, null, null, tests.ct('w1'), array['weight_goal']);
select tests.ok('weight: writing only weight_goal KEEPS the other fields', exists (select 1 from public.health_records where user_id = tests.u(72)
  and injury_notes_ct = tests.ct('n1') and health_screen_ct = tests.ct('s1') and injury_category_ct = tests.ct('c1') and weight_goal_ct = tests.ct('w1')));
select public.health_write(tests.u(72), tests.ct('n2'), null, null, null, array['injury_notes']);
select tests.ok('weight: writing only the notes KEEPS weight_goal and the rest', exists (select 1 from public.health_records where user_id = tests.u(72)
  and injury_notes_ct = tests.ct('n2') and health_screen_ct = tests.ct('s1') and injury_category_ct = tests.ct('c1') and weight_goal_ct = tests.ct('w1')));
select public.health_write(tests.u(72), null, null, null, null, array['weight_goal','health_screen']);
select tests.ok('weight: an explicit null in the field list clears exactly those fields', exists (select 1 from public.health_records where user_id = tests.u(72)
  and injury_notes_ct = tests.ct('n2') and health_screen_ct is null and injury_category_ct = tests.ct('c1') and weight_goal_ct is null));
select tests.eq('weight: health_read returns weight_goal_ct', format($q$select (select count(*) from public.health_read(%L) where weight_goal_ct is null and injury_notes_ct = tests.ct('n2'))::text$q$, tests.u(72)), '1');
select public.health_write(tests.u(72), null, null, null, tests.ct('w2'), array['weight_goal']);
select tests.eq('weight: health_read returns the stored weight_goal ciphertext', format($q$select (weight_goal_ct = tests.ct('w2'))::text from public.health_read(%L)$q$, tests.u(72)), 'true');
select tests.raises('weight: an unknown field name in the list is refused', format($q$select public.health_write(%L, null, null, null, null, array['weight'])$q$, tests.u(72)), 'invalid_argument');
select tests.logout();
select tests.login(tests.u(72)); select public.revoke_consent('health_data'); select tests.logout();
select tests.login(null, 'service_role');
select tests.raises('weight: without effective health consent a write is refused', format($q$select public.health_write(%L, null, null, null, tests.ct('w3'), array['weight_goal'])$q$, tests.u(72)), 'consent_required');
select tests.raises('weight: ...and so is a read', format('select * from public.health_read(%L)', tests.u(72)), 'consent_required');
select tests.logout();
select tests.login(tests.u(72));
select tests.raises('weight: an authenticated client cannot call health_write at all', format($q$select public.health_write(%L, null, null, null, tests.ct('w'), array['weight_goal'])$q$, tests.u(72)), 'permission denied%');
select tests.blocked('weight: nor read the column directly', $q$select weight_goal_ct from public.health_records$q$);
select tests.logout();

-- =============================================================== coach attestations (Counsel §2)
create function tests.can_coach_minors(p_coach uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp as $$
  select app.can_coach_minors(p_coach);
$$;

select tests.signup3(tests.u(76), tests.dob(30));
select tests.signup3(tests.u(77), tests.dob(30));
select tests.login(tests.u(76));
select tests.raises('attest: general hash is required', $q$select public.apply_for_coach(true, 'coach-attest-v1', null)$q$, 'attestation_required');
select tests.raises('attest: malformed general hash is refused', $q$select public.apply_for_coach(true, 'coach-attest-v1', 'nope')$q$, 'attestation_required');
select tests.raises('attest: minors box without version/hash is refused', $q$select public.apply_for_coach(true, 'coach-attest-v1', tests.h('e'), true, null, null)$q$, 'attestation_required');
select public.apply_for_coach(true, 'coach-attest-general-v1', tests.h('e'));
select tests.ok('attest: general-only apply writes one general event and no minors event',
  (select count(*) = 1 from public.coach_attestation_events where coach_id = tests.u(76) and kind = 'general' and policy_version = 'coach-attest-general-v1' and text_hash = tests.h('e'))
  and not exists (select 1 from public.coach_attestation_events where coach_id = tests.u(76) and kind = 'minors')
  and exists (select 1 from public.coach_applications where applicant_id = tests.u(76) and attestation_hash = tests.h('e') and minors_attested_at is null));
select tests.logout();

select tests.login(tests.u(77));
select public.apply_for_coach(true, 'coach-attest-general-v1', tests.h('e'), true, 'coach-attest-minors-v1', tests.h('8'), 'NSCA-CPT', 'NSCA', current_date + 365);
select tests.ok('attest: minors box logs a separate event and stamps clearance attest (not NSOPW or training)',
  exists (select 1 from public.coach_attestation_events where coach_id = tests.u(77) and kind = 'general' and text_hash = tests.h('e'))
  and exists (select 1 from public.coach_attestation_events where coach_id = tests.u(77) and kind = 'minors' and policy_version = 'coach-attest-minors-v1' and text_hash = tests.h('8'))
  and exists (select 1 from public.coach_minor_clearance where coach_id = tests.u(77) and minors_attested_at is not null and minors_hash = tests.h('8') and nsopw_status = 'not_started' and training_completed_at is null));
select tests.eq('attest: minors box alone does not allow minor clients', format('select tests.can_coach_minors(%L)::text', tests.u(77)), 'false');
select tests.raises('attest: client cannot record an NSOPW result', format($q$select public.set_coach_nsopw(%L, 'passed', 'x')$q$, tests.u(77)), 'permission denied%');
select tests.raises('attest: client cannot record training', format($q$select public.set_coach_minor_training(%L, 'x')$q$, tests.u(77)), 'permission denied%');
select tests.logout();

-- 77 is only coach_pending; promote to verified via service so we can test the relationship trigger.
select tests.login(null, 'service_role');
select public.set_user_role(tests.u(77), 'coach_verified');
select tests.raises('attest: a relationship to a minor is refused without NSOPW and training',
  format($q$insert into public.coach_relationships (coach_id, client_id, status, started_at) values (%L, %L, 'active', now())$q$, tests.u(77), tests.u(54)),
  'minors_coaching_not_allowed');
select public.set_coach_nsopw(tests.u(77), 'passed', 'nsopw-test-77');
select tests.raises('attest: NSOPW without training is still refused',
  format($q$insert into public.coach_relationships (coach_id, client_id, status, started_at) values (%L, %L, 'active', now())$q$, tests.u(77), tests.u(54)),
  'minors_coaching_not_allowed');
select public.set_coach_minor_training(tests.u(77), 'training-test-77');
select tests.eq('attest: minors box + NSOPW passed + training allows minor clients', format('select tests.can_coach_minors(%L)::text', tests.u(77)), 'true');
insert into public.coach_relationships (coach_id, client_id, status, started_at) values (tests.u(77), tests.u(54), 'active', now());
select tests.ok('attest: relationship to a linked minor is stored once clearance is complete',
  exists (select 1 from public.coach_relationships where coach_id = tests.u(77) and client_id = tests.u(54) and status = 'active'));
-- failed NSOPW revokes the ability even with training + box still on file
select public.set_coach_nsopw(tests.u(77), 'failed', 'nsopw-fail-77');
select tests.eq('attest: a failed NSOPW result blocks minor clients', format('select tests.can_coach_minors(%L)::text', tests.u(77)), 'false');
select tests.raises('attest: a new minor link is refused after a failed NSOPW',
  format($q$insert into public.coach_relationships (coach_id, client_id, status, started_at) values (%L, %L, 'active', now())$q$, tests.u(77), tests.u(58)),
  'minors_coaching_not_allowed');
insert into public.coach_relationships (coach_id, client_id, status, started_at)
values (tests.u(76), tests.u(57), 'active', now());
select tests.ok('attest: general-only coach can still take an adult client',
  exists (select 1 from public.coach_relationships where coach_id = tests.u(76) and client_id = tests.u(57) and status = 'active'));
select tests.logout();

-- later minors box for a coach who applied without it
select tests.login(tests.u(76));
select public.record_coach_minors_attestation('coach-attest-minors-v1', tests.h('8'));
select tests.ok('attest: record_coach_minors_attestation writes the minors event on an existing applicant',
  exists (select 1 from public.coach_attestation_events where coach_id = tests.u(76) and kind = 'minors' and text_hash = tests.h('8')));
select tests.logout();
select tests.login(tests.u(50));
select tests.raises('attest: an athlete cannot record the minors box', $q$select public.record_coach_minors_attestation('coach-attest-minors-v1', tests.h('8'))$q$, 'forbidden');
select tests.logout();

-- =============================================================== day-14: resend does not extend expires_at
select tests.signup3(tests.u(78), tests.dob(16));
select tests.login(tests.u(78));
select public.create_parent_invite('first78@example.invalid');
select tests.logout();
create table tests.exp78 as
  select i.expires_at
    from public.parent_invites i
   where i.minor_user_id = tests.u(78) and i.status = 'queued';
grant all on tests.exp78 to public;
select tests.ok('invite: first expiry is profile created_at + 14 days',
  exists (select 1 from public.parent_invites i join public.profiles p on p.id = i.minor_user_id
           where i.minor_user_id = tests.u(78) and i.status = 'queued'
             and i.expires_at = p.created_at + interval '14 days'));
select tests.login(tests.u(78));
select public.create_parent_invite('resend78@example.invalid');
select tests.logout();
select tests.ok('invite: resending does not extend expires_at (still created_at + 14 days)',
  exists (select 1 from public.parent_invites i
            join public.profiles p on p.id = i.minor_user_id
            join tests.exp78 e on i.expires_at = e.expires_at
           where i.minor_user_id = tests.u(78) and i.status = 'queued'
             and i.parent_email = 'resend78@example.invalid'
             and i.expires_at = p.created_at + interval '14 days')
  and exists (select 1 from public.parent_invites i join tests.exp78 e on i.expires_at = e.expires_at
               where i.minor_user_id = tests.u(78) and i.status = 'cancelled'));
