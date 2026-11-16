-- Phase 4 legal: parent-accept Terms hash, consent-row context, parent records reference the teen.
--
--  * accept_parent_invite / accept_parent_link take p_terms_hash (64 lowercase hex), required like the
--    attestation, risk, and privacy hashes. The parent's Terms consent_events row stores it as text_hash.
--  * Those Terms and Privacy rows also store subject_user_id = the teen's account, so the parent's
--    acceptance as contracting party references the minor (Counsel: parent and minor account IDs on
--    the records). user_id stays the parent (the party who accepted); actor_user_id is the parent.
--  * consent_events gains ip_hash, device_hash, and app_version, filled on insert by a trigger:
--      - IP: private.client_ip(), then pepper-hashed the same way as trainer-code rate limits.
--        Header preference (same assumption as 20261116000400_phase3_trainer_codes.sql):
--        cf-connecting-ip, then x-real-ip, then the LAST x-forwarded-for hop. Never the first hop:
--        the client controls it. We store only the peppered hash, not the raw IP. If the pepper is
--        missing, hashes are left null rather than failing the consent write.
--      - Device: peppered hash of the x-device-id request header (client-supplied; same domain as
--        redeem_trainer_code). Never stored in the clear.
--      - App version: x-app-version request header, truncated to 32 chars, stored in the clear
--        (it is a version string, not an identifier).
--  TODO(Kevin): confirm which header the production Supabase edge actually sets for the client
--  address, same open question as the trainer-code rate limiter.

-- ------------------------------------------------------------------ client IP (shared with rate limiting)
create or replace function private.client_ip()
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp as $$
declare
  v_hdr jsonb;
  v_ip text;
begin
  -- Header preference matches redeem_trainer_code: cf-connecting-ip, then x-real-ip, then the LAST
  -- x-forwarded-for hop. Never the first hop. Assumption: when we sit behind Cloudflare or a
  -- reverse proxy that overwrites cf-connecting-ip / x-real-ip, that header is the client address;
  -- otherwise the last XFF hop is the one the platform or our edge is expected to append.
  begin
    v_hdr := coalesce(current_setting('request.headers', true), '')::jsonb;
    v_ip := coalesce(
      nullif(btrim(v_hdr ->> 'cf-connecting-ip'), ''),
      nullif(btrim(v_hdr ->> 'x-real-ip'), ''),
      nullif(btrim((regexp_split_to_array(coalesce(v_hdr ->> 'x-forwarded-for', ''), '\s*,\s*'))[
        array_length(regexp_split_to_array(coalesce(v_hdr ->> 'x-forwarded-for', ''), '\s*,\s*'), 1)]), ''));
  exception when others then
    return null;
  end;
  if v_ip is null or v_ip = '' then return null; end if;
  return left(v_ip, 64);
end;
$$;

revoke all on function private.client_ip() from public, anon, authenticated;

-- ------------------------------------------------------------------ consent_events columns
alter table public.consent_events
  add column if not exists subject_user_id uuid,
  add column if not exists ip_hash text,
  add column if not exists device_hash text,
  add column if not exists app_version text;

create index if not exists consent_events_subject_idx on public.consent_events (subject_user_id, at desc)
  where subject_user_id is not null;

create or replace function private.fill_consent_context()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp as $$
declare
  v_hdr jsonb;
  v_ip text;
  v_dev text;
  v_ver text;
begin
  begin
    v_hdr := coalesce(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_hdr := '{}'::jsonb;
  end;
  v_ip := private.client_ip();
  v_dev := nullif(btrim(coalesce(v_hdr ->> 'x-device-id', '')), '');
  v_ver := nullif(btrim(coalesce(v_hdr ->> 'x-app-version', '')), '');
  begin
    if new.ip_hash is null and v_ip is not null then
      new.ip_hash := private.pepper_hash('ip', v_ip);
    end if;
    if new.device_hash is null and v_dev is not null then
      new.device_hash := private.pepper_hash('device', left(v_dev, 200));
    end if;
  exception when others then
    -- Never fail a consent write because the pepper is missing or hashing failed.
    null;
  end;
  if new.app_version is null and v_ver is not null then
    new.app_version := left(v_ver, 32);
  end if;
  return new;
end;
$$;

drop trigger if exists consent_events_fill_context on public.consent_events;
create trigger consent_events_fill_context
  before insert on public.consent_events
  for each row execute function private.fill_consent_context();

revoke all on function private.fill_consent_context() from public, anon, authenticated;

-- ------------------------------------------------------------------ parent-accept: require terms hash; reference the teen
drop function if exists public.accept_parent_invite(text, text, text, text, text, text, text, text);
drop function if exists public.accept_parent_link(uuid, text, text, text, text, text, text, text);
drop function if exists private.record_parent_acceptance(uuid, text, text, text, text, text, text, text);
drop function if exists private.parent_args_ok(text, text, text, text, text, text, text);

create or replace function private.parent_args_ok(p_att_v text, p_att_h text, p_terms_v text, p_terms_h text,
  p_risk_v text, p_risk_h text, p_priv_v text, p_priv_h text)
returns boolean language sql immutable as $$
  select p_att_v is not null and length(btrim(p_att_v)) between 1 and 64
     and p_att_h is not null and p_att_h ~ '^[0-9a-f]{64}$'
     and p_terms_v is not null and length(btrim(p_terms_v)) between 1 and 64
     and p_terms_h is not null and p_terms_h ~ '^[0-9a-f]{64}$'
     and p_risk_v is not null and length(btrim(p_risk_v)) between 1 and 64
     and p_risk_h is not null and p_risk_h ~ '^[0-9a-f]{64}$'
     and p_priv_v is not null and length(btrim(p_priv_v)) between 1 and 64
     and p_priv_h is not null and p_priv_h ~ '^[0-9a-f]{64}$'
$$;

create or replace function private.record_parent_acceptance(p_minor uuid, p_att_v text, p_att_h text,
  p_terms_v text, p_terms_h text, p_risk_v text, p_risk_h text, p_priv_v text, p_priv_h text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform private.write_consent(p_minor, 'parental', 'parent', true, btrim(p_att_v), p_att_h);
  perform private.write_consent(p_minor, 'risk_notice', 'parent', true, btrim(p_risk_v), p_risk_h);
  -- user_id = the parent (who accepted); subject_user_id = the teen this acceptance is for.
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, policy_doc_hash, text_hash, actor_user_id, subject_user_id)
  values (auth.uid(), 'terms',          'self', true, btrim(p_terms_v), null,     p_terms_h, auth.uid(), p_minor),
         (auth.uid(), 'privacy_policy', 'self', true, btrim(p_priv_v),  p_priv_h, null,      auth.uid(), p_minor);
end $$;

create or replace function public.accept_parent_invite(p_token text, p_attestation_version text, p_attestation_hash text,
  p_terms_version text, p_terms_hash text, p_risk_version text, p_risk_hash text,
  p_privacy_version text default null, p_privacy_hash text default null)
returns boolean language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.parent_invites%rowtype;
  v_ok boolean := false;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- Missing/ malformed attestation arguments say nothing about any token: refused before it is looked at.
  if not private.parent_args_ok(p_attestation_version, p_attestation_hash, p_terms_version, p_terms_hash,
       p_risk_version, p_risk_hash, p_privacy_version, p_privacy_hash) then
    raise exception 'attestation_required' using errcode = '22023';
  end if;
  if (select count(*) from private.parent_invite_attempts where user_id = v_uid and at > now() - interval '1 hour') >= 10 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  if p_token is not null and p_token ~ '^[0-9a-f]{64}$'
     and exists (select 1 from public.profiles p where p.id = v_uid and not p.is_minor and p.deleted_at is null) then
    select * into v_inv from public.parent_invites i
     where i.token_hash = encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex')
       and i.status = 'sent' and i.expires_at > now() for update;
    if found and v_inv.minor_user_id <> v_uid
       and exists (select 1 from public.profiles p where p.id = v_inv.minor_user_id and p.is_minor and p.deleted_at is null)
       and not app.is_minor_onboarded(v_inv.minor_user_id) then
      begin
        update public.parent_links set status = 'active', accepted_at = now(), is_contracting_party = true
         where minor_user_id = v_inv.minor_user_id and parent_user_id = v_uid and status = 'pending';
        if not found then
          insert into public.parent_links (minor_user_id, parent_user_id, status, is_contracting_party, accepted_at)
          values (v_inv.minor_user_id, v_uid, 'active', true, now());
        end if;
        v_ok := true;
      exception when unique_violation then
        v_ok := false;
      end;
    end if;
  end if;

  if not v_ok then
    insert into private.parent_invite_attempts (user_id) values (v_uid);   -- survives: we return, not raise
    return false;
  end if;

  perform private.record_parent_acceptance(v_inv.minor_user_id, p_attestation_version, p_attestation_hash,
    p_terms_version, p_terms_hash, p_risk_version, p_risk_hash, p_privacy_version, p_privacy_hash);
  update public.parent_invites set status = 'accepted', accepted_by = v_uid, parent_email = null, token_hash = null
   where id = v_inv.id;
  perform private.log_audit(v_uid, 'parent_invite_accepted', v_inv.minor_user_id, '{}'::jsonb);
  return true;
end $$;

create or replace function public.accept_parent_link(p_link_id uuid, p_attestation_version text, p_attestation_hash text,
  p_terms_version text, p_terms_hash text, p_risk_version text, p_risk_hash text,
  p_privacy_version text default null, p_privacy_hash text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_minor uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not private.parent_args_ok(p_attestation_version, p_attestation_hash, p_terms_version, p_terms_hash,
       p_risk_version, p_risk_hash, p_privacy_version, p_privacy_hash) then
    raise exception 'attestation_required' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and not p.is_minor and p.deleted_at is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.parent_links set status = 'active', accepted_at = now()
   where id = p_link_id and parent_user_id = auth.uid() and status = 'pending'
  returning minor_user_id into v_minor;
  if not found then raise exception 'forbidden' using errcode = '42501'; end if;
  perform private.record_parent_acceptance(v_minor, p_attestation_version, p_attestation_hash,
    p_terms_version, p_terms_hash, p_risk_version, p_risk_hash, p_privacy_version, p_privacy_hash);
  perform private.log_audit(auth.uid(), 'parent_link_accepted', v_minor, '{}'::jsonb);
exception when unique_violation then
  raise exception 'link_conflict' using errcode = '23505';
end $$;

revoke all on function
  public.accept_parent_invite(text, text, text, text, text, text, text, text, text),
  public.accept_parent_link(uuid, text, text, text, text, text, text, text, text)
from public, anon, authenticated;
grant execute on function
  public.accept_parent_invite(text, text, text, text, text, text, text, text, text),
  public.accept_parent_link(uuid, text, text, text, text, text, text, text, text)
to authenticated, service_role;
revoke all on function
  private.parent_args_ok(text, text, text, text, text, text, text, text),
  private.record_parent_acceptance(uuid, text, text, text, text, text, text, text, text)
from public, anon, authenticated;
