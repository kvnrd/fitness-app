-- Phase 2b / envelope encryption with an external KMS (Counsel C4, Q8, Q9).
--
-- Before: pgp_sym_encrypt in the database with a key in private.encryption_keys (same database, so a
-- backup or a privileged role had both ciphertext and key).
-- After:  each user has a random data key (DEK). The DEK is generated and wrapped by an external KMS
--         (AWS KMS in production) inside a server function (supabase/functions/health-record). Fields
--         are encrypted with AES-256-GCM in that function. The database stores ONLY ciphertext and the
--         KMS-wrapped DEK. No health key, master key or plaintext DEK ever exists in Postgres.
--         Crypto-shredding = delete the user's wrapped DEK (public.health_shred).
--
-- The SQL functions below are service_role only. The server function verifies the caller's JWT and
-- passes the caller's id as p_actor; every authorization rule (onboarded, consent, coach sharing,
-- minors hidden from coaches) is still decided here, in SQL.

-- Refuse to drop legacy pgcrypto ciphertext. There is no hosted database yet, so this never fires
-- today; if it ever does, re-encrypt the rows with the server function first (see docs).
do $$ begin
  if exists (select 1 from public.health_records where injury_notes_cipher is not null or health_screen_cipher is not null) then
    raise exception 'phase2b: legacy pgcrypto health rows exist. Re-encrypt them with the KMS server function before applying this migration.';
  end if;
end $$;

drop function public.write_health_record(text, text);
drop function public.read_health_record(uuid);
drop function private.active_health_key();

delete from public.health_records;
alter table public.health_records
  drop column injury_notes_cipher,
  drop column health_screen_cipher,
  drop column key_name,
  add column enc_version        smallint not null default 1 check (enc_version = 1),
  add column injury_notes_ct    bytea,   -- free-text notes. NEVER sent to the AI vendor.
  add column health_screen_ct   bytea,
  add column injury_category_ct bytea;   -- one of a fixed list of categories (see _shared/ai/schema.ts)

-- Health keys may no longer live in the database. The table keeps only the trainer-code pepper.
delete from private.encryption_keys where name like 'health\_%';
alter table private.encryption_keys add constraint encryption_keys_no_health_keys_chk check (name not like 'health\_%');

create table private.user_data_keys (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  wrapped_key  bytea not null check (octet_length(wrapped_key) between 16 and 4096),  -- KMS ciphertext blob
  key_provider text not null check (key_provider in ('aws-kms','local-dev')),
  kms_key_ref  text not null check (length(kms_key_ref) between 1 and 2048),          -- KMS key ARN/alias (not a secret)
  created_at   timestamptz not null default now()
);
alter table private.user_data_keys enable row level security;
alter table private.user_data_keys force row level security;
revoke all on table private.user_data_keys from public, anon, authenticated;

-- ------------------------------------------------------------------ helpers
create or replace function private.require_service()
returns void language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'forbidden' using errcode = '42501'; end if;
end $$;

-- coach_can_see() for an explicit actor (the server function's verified caller) instead of auth.uid().
create or replace function private.coach_can_see_as(p_actor uuid, p_client uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.user_roles r where r.user_id = p_actor and r.role = 'coach_verified')
     and exists (select 1 from public.coach_relationships cr
                  where cr.coach_id = p_actor and cr.client_id = p_client and cr.status = 'active')
     and app.has_consent(p_client, 'coach_sharing')
     and app.is_minor_onboarded(p_client)
$$;

-- ------------------------------------------------------------------ service-only API for the server function
-- Write path step 1: may p_actor write, and do they already have a wrapped DEK?
create or replace function public.health_prepare_write(p_actor uuid)
returns table (wrapped_key bytea, key_provider text, kms_key_ref text)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform private.require_service();
  if p_actor is null or not app.is_minor_onboarded(p_actor) or not app.has_consent(p_actor, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  return query select k.wrapped_key, k.key_provider, k.kms_key_ref from private.user_data_keys k where k.user_id = p_actor;
end $$;

-- Write path step 2 (first write only): store the freshly wrapped DEK. On a race the existing row wins
-- and is returned, so the caller always encrypts with the stored key.
create or replace function public.health_register_key(p_actor uuid, p_wrapped_key bytea, p_key_provider text, p_kms_key_ref text)
returns table (wrapped_key bytea, key_provider text, kms_key_ref text)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform private.require_service();
  if p_actor is null or not app.is_minor_onboarded(p_actor) or not app.has_consent(p_actor, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  insert into private.user_data_keys (user_id, wrapped_key, key_provider, kms_key_ref)
  values (p_actor, p_wrapped_key, p_key_provider, p_kms_key_ref)
  on conflict (user_id) do nothing;
  return query select k.wrapped_key, k.key_provider, k.kms_key_ref from private.user_data_keys k where k.user_id = p_actor;
end $$;

-- Write path step 3: store ciphertext. Null clears that field.
create or replace function public.health_write(p_actor uuid, p_injury_notes_ct bytea, p_health_screen_ct bytea, p_injury_category_ct bytea)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform private.require_service();
  if p_actor is null or not app.is_minor_onboarded(p_actor) or not app.has_consent(p_actor, 'health_data') then
    raise exception 'consent_required' using errcode = '42501';
  end if;
  if not exists (select 1 from private.user_data_keys where user_id = p_actor) then
    raise exception 'no_data_key' using errcode = '55000';
  end if;
  insert into public.health_records (user_id, enc_version, injury_notes_ct, health_screen_ct, injury_category_ct, updated_at)
  values (p_actor, 1, p_injury_notes_ct, p_health_screen_ct, p_injury_category_ct, now())
  on conflict (user_id) do update
    set enc_version = 1, injury_notes_ct = excluded.injury_notes_ct, health_screen_ct = excluded.health_screen_ct,
        injury_category_ct = excluded.injury_category_ct, updated_at = now();
  perform private.log_audit(p_actor, 'health_written', p_actor, '{}'::jsonb);
end $$;

-- Read path: owner (onboarded) or a coach who may see the client. Coaches get NO rows for minor
-- clients. Returns ciphertext + the wrapped DEK; only the server function (with KMS access) can open it.
create or replace function public.health_read(p_actor uuid, p_target uuid default null)
returns table (wrapped_key bytea, key_provider text, kms_key_ref text,
               injury_notes_ct bytea, health_screen_ct bytea, injury_category_ct bytea)
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_target uuid := coalesce(p_target, p_actor);
begin
  perform private.require_service();
  if p_actor is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if v_target = p_actor then
    if not app.is_minor_onboarded(p_actor) then raise exception 'forbidden' using errcode = '42501'; end if;
  else
    if not private.coach_can_see_as(p_actor, v_target) then raise exception 'forbidden' using errcode = '42501'; end if;
    if exists (select 1 from public.profiles where id = v_target and is_minor) then return; end if;
  end if;
  if not app.has_consent(v_target, 'health_data') then raise exception 'consent_required' using errcode = '42501'; end if;
  if v_target <> p_actor then
    perform private.log_audit(p_actor, 'health_read_by_coach', v_target, '{}'::jsonb);
  end if;
  return query select k.wrapped_key, k.key_provider, k.kms_key_ref, h.injury_notes_ct, h.health_screen_ct, h.injury_category_ct
    from public.health_records h join private.user_data_keys k on k.user_id = h.user_id
   where h.user_id = v_target;
end $$;

-- Crypto-shredding: delete the wrapped DEK and the ciphertext. Without the DEK any copy of the
-- ciphertext (including backups) is unreadable. Service/admin only.
create or replace function public.health_shred(p_user uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  delete from public.health_records where user_id = p_user;
  delete from private.user_data_keys where user_id = p_user;
  get diagnostics n = row_count;
  perform private.log_audit(auth.uid(), 'health_shredded', p_user, '{}'::jsonb);
  return n > 0;
end $$;

revoke all on function
  public.health_prepare_write(uuid), public.health_register_key(uuid, bytea, text, text),
  public.health_write(uuid, bytea, bytea, bytea), public.health_read(uuid, uuid), public.health_shred(uuid)
from public, anon, authenticated;
grant execute on function
  public.health_prepare_write(uuid), public.health_register_key(uuid, bytea, text, text),
  public.health_write(uuid, bytea, bytea, bytea), public.health_read(uuid, uuid), public.health_shred(uuid)
to service_role;
revoke all on function private.require_service(), private.coach_can_see_as(uuid, uuid) from public, anon, authenticated;
