-- Phase 2b / retention (Counsel Q8, Q10 [ATTORNEY]).
-- public.retention_policies is the human-readable schedule; public.run_retention_purge() applies it.
-- Schedule run_retention_purge() daily (docs/phase-2-backend.md, "Scheduler"). Every purge skips users
-- under an active litigation hold.

create table public.retention_policies (
  record_type  text primary key,
  keep_rule    text not null,      -- Counsel's wording
  implemented  text not null,      -- what the purge job does
  status       text not null check (status in ('enforced','not_stored','no_table_yet','kept_no_period'))
);
alter table public.retention_policies enable row level security;
alter table public.retention_policies force row level security;
revoke all on table public.retention_policies from public, anon, authenticated;
grant all on table public.retention_policies to service_role;
grant select on public.retention_policies to authenticated;
create policy retention_policies_admin_read on public.retention_policies for select to authenticated
  using (app.is_platform_admin());

insert into public.retention_policies (record_type, keep_rule, implemented, status) values
  ('consent_events', 'Account life + 4 years; for minors at least until their 22nd birthday',
   'Kept while the account exists. On account deletion retain_until = greatest(deleted + 4y, adult_on + 4y); purged after that.', 'enforced'),
  ('privacy_request_logs', 'At least 24 months; 4 years recommended',
   'data_export_requests / account_deletion_requests purged 4 years after completion (or request, if never completed and not open).', 'enforced'),
  ('coach_access_audit', 'Coach access audit logs: 2 years',
   'audit_log rows with action health_read_by_coach purged after 2 years.', 'enforced'),
  ('minor_safety_records', 'Until the minor''s 22nd birthday or 4 years, whichever is later; litigation holds override',
   'No table exists yet (no chat/flags/reports built). Must use adult_on + 4y and litigation holds when built.', 'no_table_yet'),
  ('ncmec_report_materials', '1 year after the report, secure and access-limited (18 U.S.C. 2258A(h))',
   'No table exists yet.', 'no_table_yet'),
  ('raw_store_age_signal', 'Delete after verification',
   'Never stored: only age_band, age_source, store_signal (which store, no payload) and age_verified_at.', 'not_stored'),
  ('rejected_under_16_signups', 'No personal data',
   'complete_signup deletes the auth user in the same request; only per-day counts in private.signup_screen_counts.', 'enforced'),
  ('unprofiled_auth_users', 'Under 13: delete in the same request with a purge job as backup; 13-15: delete promptly',
   'Auth users without a profile are purged after 24 hours.', 'enforced'),
  ('pending_minor_accounts', 'Remind on days 3 and 7, delete the account and the parent''s email on day 14',
   'purge_pending_minors() deletes 16-17 accounts that never had a parent link accepted, 14 days after signup.', 'enforced'),
  ('health_data_after_revocation', 'Stop processing and delete health fields within 30 days of revoking health-data consent',
   'Processing stops at once (all reads/writes check consent). After 29 days the wrapped data key and ciphertext are shredded.', 'enforced'),
  ('other_audit_log', 'No period given by Counsel', 'Kept. Needs a period from Counsel.', 'kept_no_period');

-- consent history must outlive the account (no FK; it already had user_id only).
alter table public.consent_events drop constraint if exists consent_events_user_id_fkey;
alter table public.consent_events add column retain_until timestamptz;

create or replace function private.profiles_on_delete_retention()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.consent_events
     set retain_until = greatest(now() + interval '4 years',
                                 coalesce((old.adult_on + interval '4 years')::timestamptz, now() + interval '4 years'))
   where user_id = old.id and retain_until is null;
  return old;
end $$;
create trigger profiles_on_delete_retention after delete on public.profiles
  for each row execute function private.profiles_on_delete_retention();

create or replace function public.run_retention_purge()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r jsonb := '{}'::jsonb; n integer; v_user uuid;
begin
  if not private.is_service_or_admin() then raise exception 'forbidden' using errcode = '42501'; end if;

  r := r || jsonb_build_object('minor_flags_recomputed', public.recompute_minor_flags());
  r := r || jsonb_build_object('unprofiled_auth_users', public.purge_unprofiled_auth_users(interval '24 hours'));
  r := r || jsonb_build_object('pending_minors', public.purge_pending_minors());

  -- health data: shred 29 days after the effective health_data consent was revoked (deadline is 30).
  n := 0;
  for v_user in
    select h.user_id from public.health_records h
     where not app.has_consent(h.user_id, 'health_data')
       and not private.on_litigation_hold(h.user_id)
       and exists (select 1 from public.consents c where c.user_id = h.user_id and c.kind = 'health_data'
                     and c.revoked_at is not null and c.revoked_at <= now() - interval '29 days')
    union
    select k.user_id from private.user_data_keys k
     where not exists (select 1 from public.health_records h where h.user_id = k.user_id)
       and not app.has_consent(k.user_id, 'health_data')
       and not private.on_litigation_hold(k.user_id)
       and exists (select 1 from public.consents c where c.user_id = k.user_id and c.kind = 'health_data'
                     and c.revoked_at is not null and c.revoked_at <= now() - interval '29 days')
  loop
    perform public.health_shred(v_user); n := n + 1;
  end loop;
  r := r || jsonb_build_object('health_shredded', n);

  delete from public.consent_events e
   where e.retain_until is not null and e.retain_until < now() and not private.on_litigation_hold(e.user_id);
  get diagnostics n = row_count; r := r || jsonb_build_object('consent_events', n);

  delete from public.data_export_requests d
   where d.status in ('completed','rejected') and coalesce(d.completed_at, d.requested_at) < now() - interval '4 years'
     and not private.on_litigation_hold(d.user_id);
  get diagnostics n = row_count; r := r || jsonb_build_object('data_export_requests', n);
  delete from public.account_deletion_requests d
   where d.status in ('completed','cancelled') and coalesce(d.completed_at, d.requested_at) < now() - interval '4 years'
     and not private.on_litigation_hold(d.user_id);
  get diagnostics n = row_count; r := r || jsonb_build_object('account_deletion_requests', n);

  delete from public.audit_log a
   where a.action = 'health_read_by_coach' and a.at < now() - interval '2 years'
     and not private.on_litigation_hold(a.target_user_id) and not private.on_litigation_hold(a.actor_id);
  get diagnostics n = row_count; r := r || jsonb_build_object('coach_access_audit', n);

  perform private.log_audit(auth.uid(), 'retention_purge_ran', null, r);
  return r;
end $$;

revoke all on function public.run_retention_purge() from public, anon, authenticated;
grant execute on function public.run_retention_purge() to service_role;
revoke all on function private.profiles_on_delete_retention() from public, anon, authenticated;
