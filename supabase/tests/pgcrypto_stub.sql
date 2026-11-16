-- TEST ONLY — NOT FOR PRODUCTION. THIS IS NOT ENCRYPTION.
-- PGlite has no pgcrypto. This stub lets the migrations run there: it hex-encodes the data behind a
-- key-derived tag, so ciphertext contains no plaintext bytes and a wrong key fails to "decrypt".
-- CI (postgres:17 + postgresql-contrib) and production use real pgcrypto pgp_sym_encrypt/decrypt.
create schema if not exists extensions;

create or replace function extensions.pgp_sym_encrypt(data text, psw text) returns bytea
language sql immutable as $$
  select convert_to('STUB:' || md5(psw) || ':' || encode(convert_to(data, 'UTF8'), 'hex'), 'UTF8')
$$;

create or replace function extensions.pgp_sym_decrypt(msg bytea, psw text) returns text
language plpgsql immutable as $$
declare s text := convert_from(msg, 'UTF8');
begin
  if left(s, 38) <> 'STUB:' || md5(psw) || ':' then
    raise exception 'Wrong key or corrupt data';
  end if;
  return convert_from(decode(substr(s, 39), 'hex'), 'UTF8');
end $$;

-- digest() is the portable pgcrypto API used by private.hash_trainer_code.
create or replace function extensions.digest(data bytea, type text) returns bytea
language plpgsql immutable as $$
begin
  if type = 'sha256' then
    return sha256(data);
  end if;
  raise exception 'unsupported digest type';
end $$;

-- TEST ONLY — NOT FOR PRODUCTION. PGlite has no pgcrypto gen_random_bytes. This builds random bytes from
-- gen_random_uuid() (random v4 uuids). Real pgcrypto gen_random_bytes is used by CI (postgres:17) and
-- production; the Phase 3 trainer-code / invite-token generators call extensions.gen_random_bytes.
create or replace function extensions.gen_random_bytes(n integer) returns bytea
language plpgsql volatile as $$
declare v text := '';
begin
  if n < 1 or n > 1024 then raise exception 'Length not in range'; end if;
  while length(v) < n * 2 loop
    v := v || replace(gen_random_uuid()::text, '-', '');
  end loop;
  return decode(substr(v, 1, n * 2), 'hex');
end $$;
