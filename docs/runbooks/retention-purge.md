# Retention purge

Config and operator runbook only. This change does not deploy the job.

The daily job is `public.run_retention_purge()` (wrapped for cron as `private.run_retention_purge_cron()`). It is how we keep the 30-day deletion promises for progress photos and withdrawn health data, including teen health withdrawals (Counsel Phase 5, Rev 2–4).

## What it does

Each successful run:

1. Recomputes minor flags and purges unprofiled auth users, pending minors (backup for the hourly job), and expired parent invites.
2. **Health keys:** `health_shred()` for users whose `health_data` consent was revoked at least 29 days ago (deadline 30 days). Litigation holds are skipped.
3. **Photo keys:** `photo_shred()` for per-user photo keys whose `shred_after` is due (set to now + 29 days on turn-off or delete-all). Shared-copy keys are already destroyed on revoke. Litigation holds are skipped.
4. Applies older retention (consent events, export/deletion requests, coach-access audit, rate-limit attempt logs).
5. Writes a row to `private.retention_purge_runs` and an audit event `retention_purge_ran`.

Live photo and health rows are already removed or pending-delete in the app and on the live server when the user turns the feature off. This job destroys the keys so backups are unreadable within 30 days.

## Schedule

- **When pg_cron is available:** job name `retention-purge-daily`, `20 7 * * *` UTC (07:20), defined in `supabase/migrations/20261117001100_phase5_ops_rev4.sql` and `ops/retention-purge.schedule.yml`. This matches the existing hourly pending-minor job pattern (`purge-pending-minors-hourly` at minute 15).
- **When pg_cron is not available** (PGlite and some local stacks): attach the same command in the operator job runner:
  `select private.run_retention_purge_cron();`
- Do not call `public.run_retention_purge()` from cron without a service-role JWT; that function is granted only to `service_role`. The private cron wrapper is not granted to clients.

## How to verify it

As a service role or operator:

```sql
-- Latest runs
select started_at, finished_at, ok, result
  from private.retention_purge_runs
 order by started_at desc
 limit 10;

-- Health check (missed run, overdue keys, whether the job is confirmed running)
select * from public.retention_purge_health();

-- The in-app purge {date} is shown only when this is true
select app.photo_purge_deadline_guaranteed();
```

`app.photo_purge_deadline_guaranteed()` is true only when the progress-photo retention policy is enforced, a successful run landed in the last 25 hours, and there are no overdue photo keys. Outcome toasts must use this value (not a hard-coded date).

SQL tests in `supabase/tests/phase5.sql` cover: scheduled shreds never later than 30 days, a due key is shredded by the job, overdue keys and a missed run are flagged, and the guarantee flips off until the job is healthy again.

## Legal deadlines

- Photos: removed from the phone immediately; servers and backups within **30 days** of delete or turning photos off, by destroying the per-user photo key. Shared copies are shredded on revoke immediately.
- Health data (including a teen's saved health info when Health is turned off): removed from the app and the live server immediately; servers and backups within **30 days**, by destroying the per-user health key.
- The job schedules shreds at **29 days** so a daily run still meets the 30-day deadline.

## What to do when it fails

1. Read `public.retention_purge_health()` and the latest `private.retention_purge_runs` row (`ok`, `result`, and any error).
2. Alert rules and placeholder destinations are in `ops/retention-purge.alerts.yml`. A missed run, a failed run, or any overdue photo or health key is **critical** and should page the privacy on-call. While the job is not confirmed running, hide the calendar date on toasts (`app.photo_purge_deadline_guaranteed()` is false).
3. Fix the cause (permissions, locks, a litigation-hold mistake, an exception in `result`). Do not shred a user who is on a litigation hold.
4. Re-run, as service role: `select public.run_retention_purge();` or, from the operator host, `select private.run_retention_purge_cron();`.
5. Confirm `retention_purge_health()` is healthy, overdue counts are 0, and `app.photo_purge_deadline_guaranteed()` is true before turning the date back on in the app.
6. If a key is already past the 30-day deadline, treat it as a legal incident and record it; then shred immediately unless a hold applies.

## Related

- Counsel: `legal/phase5-review.md` (Rev 2 deletion, Rev 3 purge-date toasts, Rev 4 teen health withdrawal).
- Client gating: `src/progress/purgeToasts.ts`.
- Hourly pending-minor backup: `docs/phase-3-onboarding.md`.
