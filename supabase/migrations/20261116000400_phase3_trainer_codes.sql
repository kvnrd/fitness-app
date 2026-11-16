-- Phase 3 / trainer codes: server-generated, high entropy, rate limited.
--  * create_trainer_code(...) replaces the old client-chosen-code version. The code is 80 bits from
--    gen_random_bytes, Crockford base32 (no I L O U), shown ONCE as XXXX-XXXX-XXXX-XXXX in the return
--    value; only the peppered hash is stored. Expiry is required (1..90 days), max redemptions 1..500.
--  * Input is normalised before hashing: uppercase, spaces/dashes stripped, and Crockford's O->0, I/L->1
--    (those letters never appear in a generated code, so this cannot collide with another code).
--  * redeem_trainer_code(code, device_id) keeps the single generic outcome (false) for every failure and
--    raises 'rate_limited' only when a limit is hit: per user 10 failures/hour and 30/day, per IP 30
--    failures/hour, per device 10 failures/hour. IP = the first of: cf-connecting-ip, x-real-ip, the LAST
--    x-forwarded-for hop (the one the platform proxy appended; the FIRST hop is client-controlled and
--    trivially spoofed), taken from request.headers when PostgREST passes it. IP and device id are stored only as peppered hashes, purged after 30 days.

-- Legacy codes were client-chosen (weak) and could be non-expiring: retire them, then require an expiry.
update public.trainer_codes set revoked = true, expires_at = now() where expires_at is null;
alter table public.trainer_codes add constraint trainer_codes_expiry_required_chk check (expires_at is not null);
alter table public.trainer_codes add constraint trainer_codes_max_chk check (max_redemptions between 1 and 500);

create table private.trainer_code_attempts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  ip_hash     text,
  device_hash text,
  success     boolean not null,
  at          timestamptz not null default now()
);
create index trainer_code_attempts_user_idx   on private.trainer_code_attempts (user_id, at desc) where not success;
create index trainer_code_attempts_ip_idx     on private.trainer_code_attempts (ip_hash, at desc) where not success;
create index trainer_code_attempts_device_idx on private.trainer_code_attempts (device_hash, at desc) where not success;
alter table private.trainer_code_attempts enable row level security;
alter table private.trainer_code_attempts force row level security;
revoke all on table private.trainer_code_attempts from public, anon, authenticated;

-- ------------------------------------------------------------------ hashing
create or replace function private.normalize_trainer_code(p_code text)
returns text language sql immutable as $$
  select translate(regexp_replace(upper(coalesce(p_code, '')), '[^0-9A-Z]', '', 'g'), 'OIL', '011')
$$;

create or replace function private.hash_trainer_code(p_code text)
returns text language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare v_pepper text;
begin
  select key into v_pepper from private.encryption_keys where name = 'trainer_code_pepper';
  if v_pepper is null then raise exception 'server_not_configured' using errcode = '55000'; end if;
  return encode(extensions.digest(convert_to(v_pepper || ':' || private.normalize_trainer_code(p_code), 'UTF8'), 'sha256'), 'hex');
end $$;

-- Peppered hash of an IP / device id (domain-separated from code hashes). null in -> null out.
create or replace function private.pepper_hash(p_domain text, p_value text)
returns text language plpgsql stable security definer set search_path = public, extensions, pg_temp as $$
declare v_pepper text;
begin
  if p_value is null or btrim(p_value) = '' then return null; end if;
  select key into v_pepper from private.encryption_keys where name = 'trainer_code_pepper';
  if v_pepper is null then raise exception 'server_not_configured' using errcode = '55000'; end if;
  return encode(extensions.digest(convert_to(v_pepper || ':' || p_domain || ':' || p_value, 'UTF8'), 'sha256'), 'hex');
end $$;

-- 80 random bits as 16 Crockford base32 characters, grouped 4-4-4-4.
create or replace function private.generate_trainer_code()
returns text language plpgsql volatile security definer set search_path = public, extensions, pg_temp as $$
declare
  v_alpha constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   -- 32 symbols, no I L O U
  v_bytes bytea := extensions.gen_random_bytes(10);               -- 80 bits
  v_bits text := '';
  v_code text := '';
  i integer;
begin
  for i in 0 .. 9 loop
    v_bits := v_bits || get_byte(v_bytes, i)::bit(8)::text;
  end loop;
  for i in 0 .. 15 loop
    v_code := v_code || substr(v_alpha, substr(v_bits, i * 5 + 1, 5)::bit(5)::integer + 1, 1);
  end loop;
  return substr(v_code, 1, 4) || '-' || substr(v_code, 5, 4) || '-' || substr(v_code, 9, 4) || '-' || substr(v_code, 13, 4);
end $$;

-- ------------------------------------------------------------------ create / revoke
drop function public.create_trainer_code(uuid, text, integer, timestamptz);
create or replace function public.create_trainer_code(p_max_redemptions integer default 25,
  p_expires_in_days integer default 30, p_coach_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_service boolean := private.is_service_or_admin();
  v_coach uuid;
  v_code text; v_id uuid; v_try integer := 0;
begin
  if v_uid is null and not v_service then raise exception 'not_authenticated' using errcode = '28000'; end if;
  v_coach := coalesce(p_coach_id, v_uid);
  if v_coach is null then raise exception 'invalid_coach' using errcode = '22023'; end if;
  if not v_service and (v_coach <> v_uid or not app.is_verified_coach()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.user_roles where user_id = v_coach and role = 'coach_verified') then
    raise exception 'invalid_coach' using errcode = '22023';
  end if;
  if p_max_redemptions is null or p_max_redemptions not between 1 and 500
     or p_expires_in_days is null or p_expires_in_days not between 1 and 90 then
    raise exception 'invalid_argument' using errcode = '22023';
  end if;
  loop
    v_code := private.generate_trainer_code();
    begin
      insert into public.trainer_codes (code_hash, coach_id, max_redemptions, expires_at)
      values (private.hash_trainer_code(v_code), v_coach, p_max_redemptions, now() + make_interval(days => p_expires_in_days))
      returning id into v_id;
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try >= 3 then raise exception 'server_busy' using errcode = '55000'; end if;
    end;
  end loop;
  perform private.log_audit(v_uid, 'trainer_code_created', v_coach, jsonb_build_object('code_id', v_id));   -- never the code
  return jsonb_build_object('id', v_id, 'code', v_code);   -- the only time the raw code exists
end $$;

create or replace function public.revoke_trainer_code(p_code_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_coach uuid;
begin
  if auth.uid() is null and not private.is_service_or_admin() then raise exception 'not_authenticated' using errcode = '28000'; end if;
  update public.trainer_codes set revoked = true
   where id = p_code_id and (coach_id = auth.uid() or private.is_service_or_admin())
  returning coach_id into v_coach;
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  perform private.log_audit(auth.uid(), 'trainer_code_revoked', v_coach, jsonb_build_object('code_id', p_code_id));
end $$;

-- ------------------------------------------------------------------ redeem
drop function public.redeem_trainer_code(text);
create or replace function public.redeem_trainer_code(p_code text, p_device_id text default null)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_ip text; v_ip_hash text; v_dev_hash text; v_hdr jsonb;
  v_row public.trainer_codes%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- TODO(Kevin): confirm which header Supabase's edge actually sets for the client address and whether
  -- it overwrites or appends. Header preference: cf-connecting-ip, then x-real-ip, then the LAST
  -- x-forwarded-for hop. Never the first hop: the client controls it. The per-user and per-device limits
  -- below hold regardless of what this yields (an attacker who spoofs the IP only evades the IP limit).
  begin
    v_hdr := coalesce(current_setting('request.headers', true), '')::jsonb;
    v_ip := coalesce(
      nullif(btrim(v_hdr ->> 'cf-connecting-ip'), ''),
      nullif(btrim(v_hdr ->> 'x-real-ip'), ''),
      nullif(btrim((regexp_split_to_array(coalesce(v_hdr ->> 'x-forwarded-for', ''), '\s*,\s*'))[
        array_length(regexp_split_to_array(coalesce(v_hdr ->> 'x-forwarded-for', ''), '\s*,\s*'), 1)]), ''));
  exception when others then v_ip := null;
  end;
  v_ip_hash := private.pepper_hash('ip', left(v_ip, 64));
  v_dev_hash := private.pepper_hash('device', left(p_device_id, 200));

  if (select count(*) from private.trainer_code_attempts where user_id = v_uid and not success and at > now() - interval '1 hour') >= 10
     or (select count(*) from private.trainer_code_attempts where user_id = v_uid and not success and at > now() - interval '1 day') >= 30
     or (v_ip_hash is not null and (select count(*) from private.trainer_code_attempts
           where ip_hash = v_ip_hash and not success and at > now() - interval '1 hour') >= 30)
     or (v_dev_hash is not null and (select count(*) from private.trainer_code_attempts
           where device_hash = v_dev_hash and not success and at > now() - interval '1 hour') >= 10) then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  select * into v_row from public.trainer_codes where code_hash = private.hash_trainer_code(coalesce(p_code, '')) for update;

  -- ONE generic outcome: unknown, revoked, expired, exhausted, own code, coach not verified, caller a
  -- pending minor (or no profile). The attempt is recorded, and we return so the record commits.
  if not found or v_row.revoked or v_row.expires_at <= now()
     or v_row.redemptions >= v_row.max_redemptions or v_row.coach_id = v_uid
     or not exists (select 1 from public.user_roles where user_id = v_row.coach_id and role = 'coach_verified')
     or not app.is_minor_onboarded(v_uid) then
    insert into private.trainer_code_attempts (user_id, ip_hash, device_hash, success) values (v_uid, v_ip_hash, v_dev_hash, false);
    return false;
  end if;

  if not exists (select 1 from public.coach_relationships
                  where coach_id = v_row.coach_id and client_id = v_uid and status = 'active') then
    insert into public.coach_relationships (coach_id, client_id, status, started_at)
    values (v_row.coach_id, v_uid, 'active', now())
    on conflict (coach_id, client_id) where status in ('pending','active') do update set status = 'active', started_at = now();
    update public.trainer_codes set redemptions = redemptions + 1 where id = v_row.id;
  end if;
  insert into private.trainer_code_attempts (user_id, ip_hash, device_hash, success) values (v_uid, v_ip_hash, v_dev_hash, true);
  perform private.log_audit(v_uid, 'trainer_code_redeemed', v_row.coach_id, jsonb_build_object('code_id', v_row.id));
  return true;
end $$;

-- ------------------------------------------------------------------ grants
revoke all on function public.create_trainer_code(integer, integer, uuid), public.revoke_trainer_code(uuid),
  public.redeem_trainer_code(text, text) from public, anon, authenticated;
grant execute on function public.create_trainer_code(integer, integer, uuid), public.revoke_trainer_code(uuid),
  public.redeem_trainer_code(text, text) to authenticated, service_role;   -- create/revoke are body-guarded
revoke all on function private.normalize_trainer_code(text), private.hash_trainer_code(text),
  private.pepper_hash(text, text), private.generate_trainer_code() from public, anon, authenticated;
