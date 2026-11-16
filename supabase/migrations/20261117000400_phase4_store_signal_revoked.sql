-- Legal: store-signal revocation.
-- A store age signal once received is actual knowledge, so a later revocation must NEVER raise an
-- age or reopen an adult path. This RPC sets a boolean flag only: no install id, no store dates,
-- and no raw response are stored (Texas SB 2420 §121.055(b); Counsel). It does not touch store_signal,
-- age_source, age_band, is_minor, adult_on, or age_verified_at.
--
-- The client calls this at launch for signed-in users when checkStoreAgeSharingRevoked() is true.
-- Note: that native call can show the store's sharing prompt if the user has not decided; hooking it
-- up is what Counsel asked for, and whether a launch-time prompt is acceptable stays an open question.

alter table public.profiles
  add column if not exists store_signal_revoked boolean not null default false;

create or replace function public.report_store_signal_revoked()
returns void
language plpgsql
security definer
set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  update public.profiles
     set store_signal_revoked = true
   where id = v_uid and deleted_at is null;
end;
$$;

revoke all on function public.report_store_signal_revoked() from public, anon;
grant execute on function public.report_store_signal_revoked() to authenticated, service_role;
