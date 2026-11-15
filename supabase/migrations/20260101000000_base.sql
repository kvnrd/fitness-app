-- Phase 2 / base: schemas, extensions, default privileges, shared helpers, key table.
-- Targets Supabase / Postgres 17 with pgcrypto. Roles anon, authenticated, service_role
-- and auth.uid() are provided by Supabase (tests/auth_stub.sql emulates them for local runs).

create schema if not exists extensions;
create schema if not exists private;   -- secrets + internals. ZERO grants to anon/authenticated.
create schema if not exists app;       -- RLS helper functions. Must NEVER be an exposed API schema.

-- pgcrypto. Skipped when a function already exists (PGlite test stub only).
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where p.proname = 'pgp_sym_encrypt' and n.nspname = 'extensions') then
    create extension if not exists pgcrypto with schema extensions;
  end if;
end $$;

revoke all on schema private from public, anon, authenticated;
revoke all on schema app from public, anon;
grant usage on schema app to authenticated;

-- Supabase grants ALL on new public objects to anon/authenticated by default. Turn that off:
-- everything below is deny-by-default and granted explicitly, table by table.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema app revoke execute on functions from public, anon;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

-- Whole years between a birth date and today.
create or replace function app.age_years(p_birth date)
returns integer language sql stable
as $$ select date_part('year', age(current_date, p_birth))::integer $$;

create or replace function private.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Encryption keys. Operator inserts these (see docs/phase-2-backend.md). NEVER commit a key.
create table private.encryption_keys (
  name       text primary key,            -- e.g. health_v1, health_v2, trainer_code_pepper
  key        text not null check (length(key) >= 32),
  created_at timestamptz not null default now(),
  retired_at timestamptz                   -- set when rotated out; old keys stay for decrypting old rows
);
alter table private.encryption_keys enable row level security;
alter table private.encryption_keys force row level security;
revoke all on table private.encryption_keys from public, anon, authenticated;
-- No policies: no role other than the owner/superuser/BYPASSRLS can read it.
-- SECURITY DEFINER functions (owned by the migration role) read it.
