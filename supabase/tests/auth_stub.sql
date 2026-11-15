-- TEST ONLY. Emulates the parts of Supabase Auth that the migrations rely on.
-- Never apply to a real Supabase project (it already has all of this).

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email text,
  deleted_at timestamptz
);

create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

create or replace function auth.role() returns text language sql stable as $$
  select coalesce(auth.jwt() ->> 'role', 'anon')
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.jwt(), auth.role() to anon, authenticated, service_role;

create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

create or replace function tests.login(user_id uuid, auth_role text default 'authenticated', app_role text default null)
returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claim.sub', user_id::text, false);
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', user_id, 'role', auth_role, 'app_role', app_role)::text, false);
  if auth_role = 'anon' then set role anon;
  elsif auth_role = 'service_role' then set role service_role;
  else set role authenticated; end if;
end $$;

create or replace function tests.logout() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claim.sub', '', false);
  perform set_config('request.jwt.claims', '', false);
end $$;

grant execute on function tests.login(uuid, text, text), tests.logout() to anon, authenticated, service_role;
