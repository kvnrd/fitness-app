-- Phase 3 / Counsel phase3-build-answers.md §3 (Nov 16, 2026): run the pending-minor purge hourly.
-- The day-14 clock is already profiles.created_at (resend does not extend expires_at). A daily-only
-- run_retention_purge() could leave a pending minor until about day 15; purge_pending_minors() itself
-- is cheap and is also still invoked by the daily full purge. pg_cron is optional: PGlite and some
-- local stacks do not have it. If the extension cannot be created, the operator must attach the
-- hourly job (docs/phase-3-onboarding.md, docs/phase-2-backend.md).

update public.retention_policies
   set implemented = 'Hourly purge_pending_minors() deletes 16-17 accounts that never had a parent link accepted, 14 days after signup (profiles.created_at). Resending the invite does not extend the clock. The daily run_retention_purge() still includes this purge as a backup.'
 where record_type = 'pending_minor_accounts';

do $cron$
begin
  execute 'create extension if not exists pg_cron';
  perform cron.unschedule(j.jobid) from cron.job j where j.jobname = 'purge-pending-minors-hourly';
  perform cron.schedule('purge-pending-minors-hourly', '15 * * * *', 'select public.purge_pending_minors()');
exception when others then
  raise notice 'pg_cron not available (%); schedule purge_pending_minors() hourly in the operator job runner', sqlerrm;
end
$cron$;
