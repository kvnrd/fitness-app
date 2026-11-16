-- Phase 3 / parent invites by email + attested parent acceptance.
--  * public.parent_invites: the minor's invite queue. The parent's email is stored ONLY to send the
--    invite (queued/sent) and is NULLed when the invite is accepted, cancelled or expires. Only a SHA-256
--    of the 256-bit token is stored; the raw token exists once, in the return value of
--    claim_parent_invites_to_send() (service only) for the sender.
--    TODO (not built): the sender function / email provider that calls claim_parent_invites_to_send().
--  * A parent link can only be created through an attested acceptance: attestation + terms + parent risk
--    acknowledgement + Privacy Policy version/hash (p_privacy_version, p_privacy_hash; defaulted only for
--    Postgres parameter ordering, required at runtime -> attestation_required) are required by accept_parent_invite AND the new accept_parent_link (the 1-arg
--    accept_parent_link is dropped), so no path links without them.
--  * accept_parent_invite returns boolean instead of raising on a bad token: a raised error rolls the
--    transaction back, which would also roll back the failed-attempt record that rate limiting needs.
--    false = the single generic "invalid_invite" outcome (unknown, expired, cancelled, used, wrong
--    account type, own invite, already linked). 'rate_limited' is raised after 10 failures / hour / user.

create table public.parent_invites (
  id             uuid primary key default gen_random_uuid(),
  seq            bigint generated always as identity,   -- strict creation order (timestamps can tie)
  minor_user_id  uuid not null references public.profiles(id) on delete cascade,
  parent_email   text check (parent_email is null or (length(parent_email) between 3 and 254
                   and parent_email = lower(parent_email) and parent_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  token_hash     text unique check (token_hash is null or token_hash ~ '^[0-9a-f]{64}$'),
  status         text not null default 'queued' check (status in ('queued','sent','accepted','cancelled','expired')),
  attempts       integer not null default 0,        -- how many times the invite was handed to the sender
  created_at     timestamptz not null default now(),
  sent_at        timestamptz,
  expires_at     timestamptz not null,              -- minor profile created_at + 14 days (the pending-account purge)
  accepted_by    uuid references public.profiles(id) on delete set null,
  check (parent_email is null or status in ('queued','sent')),   -- the email never outlives the open invite
  check (token_hash is null or status = 'sent')
);
create unique index parent_invites_one_open_uq on public.parent_invites (minor_user_id) where status in ('queued','sent');
create index parent_invites_minor_idx on public.parent_invites (minor_user_id, seq desc);

alter table public.parent_invites enable row level security;
alter table public.parent_invites force row level security;
revoke all on table public.parent_invites from public, anon, authenticated;
grant all on table public.parent_invites to service_role;
-- The minor reads the STATUS of their own invites only: no email, no token hash.
grant select (id, minor_user_id, status, created_at, sent_at, expires_at) on public.parent_invites to authenticated;
create policy parent_invites_select_minor on public.parent_invites for select to authenticated
  using (minor_user_id = (select auth.uid()));

-- Failed accept attempts (rate limit). No personal data: user id + time. Purged after 30 days.
create table private.parent_invite_attempts (
  id      bigint generated always as identity primary key,
  user_id uuid not null,
  at      timestamptz not null default now()
);
create index parent_invite_attempts_idx on private.parent_invite_attempts (user_id, at desc);
alter table private.parent_invite_attempts enable row level security;
alter table private.parent_invite_attempts force row level security;
revoke all on table private.parent_invite_attempts from public, anon, authenticated;

-- ------------------------------------------------------------------ helpers
-- [ATTORNEY] attestation, terms and parent risk acknowledgement: version + SHA-256 of the exact text shown.
create or replace function private.parent_args_ok(p_att_v text, p_att_h text, p_terms_v text, p_risk_v text, p_risk_h text,
  p_priv_v text, p_priv_h text)
returns boolean language sql immutable as $$
  select coalesce(length(btrim(p_att_v)) between 1 and 64, false)
     and coalesce(length(btrim(p_terms_v)) between 1 and 64, false)
     and coalesce(length(btrim(p_risk_v)) between 1 and 64, false)
     and coalesce(p_att_h ~ '^[0-9a-f]{64}$', false)
     and coalesce(p_risk_h ~ '^[0-9a-f]{64}$', false)
     and coalesce(length(btrim(p_priv_v)) between 1 and 64, false)
     and coalesce(p_priv_h ~ '^[0-9a-f]{64}$', false)
$$;

-- Runs as the accepting parent (auth.uid()): 'parental' consent + the parent's risk acknowledgement, both
-- for the minor and with grantor 'parent', plus the parent's own Terms and Privacy Policy acceptance
-- events (user_id = the parent's account, grantor 'self': it is the parent's own acceptance as a user;
-- the privacy event carries the policy version + document hash).
create or replace function private.record_parent_acceptance(p_minor uuid, p_att_v text, p_att_h text,
  p_terms_v text, p_risk_v text, p_risk_h text, p_priv_v text, p_priv_h text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform private.write_consent(p_minor, 'parental', 'parent', true, btrim(p_att_v), p_att_h);
  perform private.write_consent(p_minor, 'risk_notice', 'parent', true, btrim(p_risk_v), p_risk_h);
  insert into public.consent_events (user_id, kind, grantor, granted, policy_version, policy_doc_hash, actor_user_id)
  values (auth.uid(), 'terms', 'self', true, btrim(p_terms_v), null, auth.uid()),
         (auth.uid(), 'privacy_policy', 'self', true, btrim(p_priv_v), p_priv_h, auth.uid());
end $$;

create or replace function private.expire_parent_invites()
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  update public.parent_invites set status = 'expired', parent_email = null, token_hash = null
   where status in ('queued','sent') and expires_at <= now();
  get diagnostics n = row_count;
  return n;
end $$;

-- ------------------------------------------------------------------ minor: queue an invite
-- Always the same neutral answer for a valid-looking email, whether or not the address belongs to an
-- account, equals the caller's own address, or replaces an earlier invite. Nothing about the parent is
-- looked up.
create or replace function public.create_parent_invite(p_parent_email text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(p_parent_email));
  v_created timestamptz;
  v_own text;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select p.created_at into v_created from public.profiles p
   where p.id = v_uid and p.deleted_at is null and app.is_pending_minor(p.id);
  if not found then raise exception 'not_allowed' using errcode = '42501'; end if;
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if (select count(*) from public.parent_invites where minor_user_id = v_uid and created_at > now() - interval '1 day') >= 5 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;
  select lower(u.email) into v_own from auth.users u where u.id = v_uid;
  if v_own is not null and v_own = v_email then
    return jsonb_build_object('status', 'queued');   -- neutral: nothing is queued, nothing is said
  end if;
  -- Fix-the-email path: the open invite (if any) is cancelled and its address erased.
  update public.parent_invites set status = 'cancelled', parent_email = null, token_hash = null
   where minor_user_id = v_uid and status in ('queued','sent');
  insert into public.parent_invites (minor_user_id, parent_email, expires_at)
  values (v_uid, v_email, v_created + interval '14 days');
  perform private.log_audit(v_uid, 'parent_invite_created', v_uid, '{}'::jsonb);   -- never the email
  return jsonb_build_object('status', 'queued');
end $$;

-- ------------------------------------------------------------------ service: hand queued invites to the sender
create or replace function public.claim_parent_invites_to_send()
returns table (invite_id uuid, parent_email text, token text)
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
#variable_conflict use_column
declare r record; v_token text;
begin
  perform private.require_service();
  perform private.expire_parent_invites();
  for r in
    select i.id as id, i.parent_email as email from public.parent_invites i
     where i.status = 'queued' and i.expires_at > now()
     order by i.created_at limit 100 for update skip locked
  loop
    v_token := encode(extensions.gen_random_bytes(32), 'hex');          -- 256 bits
    update public.parent_invites
       set token_hash = encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex'),
           status = 'sent', sent_at = now(), attempts = attempts + 1
     where id = r.id;
    invite_id := r.id; parent_email := r.email; token := v_token;
    return next;
  end loop;
end $$;

-- ------------------------------------------------------------------ parent: accept by token
create or replace function public.accept_parent_invite(p_token text, p_attestation_version text, p_attestation_hash text,
  p_terms_version text, p_risk_version text, p_risk_hash text,
  p_privacy_version text default null, p_privacy_hash text default null)
returns boolean language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.parent_invites%rowtype;
  v_ok boolean := false;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  -- Missing/ malformed attestation arguments say nothing about any token: refused before it is looked at.
  if not private.parent_args_ok(p_attestation_version, p_attestation_hash, p_terms_version, p_risk_version, p_risk_hash, p_privacy_version, p_privacy_hash) then
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
                                           p_terms_version, p_risk_version, p_risk_hash, p_privacy_version, p_privacy_hash);
  update public.parent_invites set status = 'accepted', accepted_by = v_uid, parent_email = null, token_hash = null
   where id = v_inv.id;
  perform private.log_audit(v_uid, 'parent_invite_accepted', v_inv.minor_user_id, '{}'::jsonb);
  return true;
end $$;

-- ------------------------------------------------------------------ parent: accept an existing pending link
-- Replaces accept_parent_link(uuid). Same attestation + terms + parent risk acknowledgement.
drop function public.accept_parent_link(uuid);
create or replace function public.accept_parent_link(p_link_id uuid, p_attestation_version text, p_attestation_hash text,
  p_terms_version text, p_risk_version text, p_risk_hash text,
  p_privacy_version text default null, p_privacy_hash text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_minor uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not private.parent_args_ok(p_attestation_version, p_attestation_hash, p_terms_version, p_risk_version, p_risk_hash, p_privacy_version, p_privacy_hash) then
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
                                           p_terms_version, p_risk_version, p_risk_hash, p_privacy_version, p_privacy_hash);
  perform private.log_audit(auth.uid(), 'parent_link_accepted', v_minor, '{}'::jsonb);
exception when unique_violation then
  raise exception 'link_conflict' using errcode = '23505';
end $$;

-- ------------------------------------------------------------------ grants
revoke all on function
  public.create_parent_invite(text), public.claim_parent_invites_to_send(),
  public.accept_parent_invite(text, text, text, text, text, text, text, text),
  public.accept_parent_link(uuid, text, text, text, text, text, text, text)
from public, anon, authenticated;
grant execute on function
  public.create_parent_invite(text),
  public.accept_parent_invite(text, text, text, text, text, text, text, text),
  public.accept_parent_link(uuid, text, text, text, text, text, text, text)
to authenticated;
grant execute on function
  public.create_parent_invite(text), public.claim_parent_invites_to_send(),
  public.accept_parent_invite(text, text, text, text, text, text, text, text),
  public.accept_parent_link(uuid, text, text, text, text, text, text, text)
to service_role;
revoke all on function private.parent_args_ok(text, text, text, text, text, text, text),
  private.record_parent_acceptance(uuid, text, text, text, text, text, text, text), private.expire_parent_invites()
from public, anon, authenticated;
