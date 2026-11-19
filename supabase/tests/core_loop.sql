-- Fixes found while wiring the core loop to Supabase (2026-11). Runs last and reuses the earlier helpers
-- (tests.ok, tests.u, tests.dob, tests.h, tests.login/logout). Users here are tests.u(150..159).

insert into auth.users (id, email) select tests.u(i), 'core-' || i || '@example.invalid' from generate_series(150, 159) i;

-- A signup's own Terms acceptance stores its hash in policy_doc_hash; it must count as the latest terms,
-- or every new account is sent to "accept the updated terms".
select tests.login(tests.u(150));
select public.complete_signup(tests.dob(30), null, null, null, null, 'v0.4-draft', tests.h('e'), 'privacy-v1', tests.h('d'));
select tests.ok('terms: a new account''s signup acceptance reports its hash',
  coalesce((public.my_latest_terms() ->> 'hash') = tests.h('e'), false));
select public.accept_terms('v0.4-draft', tests.h('f'));
select tests.ok('terms: a later accept_terms is the latest',
  coalesce((public.my_latest_terms() ->> 'hash') = tests.h('f'), false));
select tests.logout();
