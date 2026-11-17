# Phase 5 — Progress and photos (groundwork)

Non-UI plumbing for the Progress tab and progress photos. The screens wait for Paper designs. Counsel's Phase 3 and 4 rules are unchanged: health and AI remain separate opt-ins, nothing is pre-checked, teen switches stay locked until the parent co-consents, and the terms/consent gates stay in place.

This branch also applies Counsel's Phase 5 review (Nov 16, 2026) and Rev 2 (10:55 PM MST) and Rev 3 (11:05 PM MST) from `legal/phase5-review.md`. Logic, config, SQL, and tests only. No new UI.

## What this pass built

### Chart numbers (server-computed)
- `public.strength_progress` and `public.cardio_progress` return per-session points for the caller only (security definer, `auth.uid()`).
- Strength metrics: e1RM (best eligible set), top set, volume (Σ w × reps). A session is a PR when its e1RM beats the previous best by more than 0.5 lb.
- Cardio metrics: distance, time, pace (sec/km), speed (km/h), power, and a row split that is always seconds per 500 m.
- The same math lives in `src/progress/` so the client (and a later worker) can compute the same numbers. Body-weight charts use a 10-day EMA, range filters (1M / 3M / 6M / 1Y / All), a cap of 120 points, and sparse/empty flags (`src/progress/charts.ts`).

### PR detection and input limits
- Eligible sets: weight 50–700 lb, reps 1–50, not over the e1RM cap, and not flagged `exclude_from_prs`.
- A typo (for example 800 lb) can still be logged; it does not get an e1RM, a top set, or volume, and it cannot create a PR.
- `exclude_from_prs` drops a set from e1RM / PR detection only. Volume still counts it when it is inside the input limits.

### Units
- Canonical storage: set-log weights are pounds, distances are metres, time is seconds, power is watts.
- Profile prefs stay lb/kg and mi/km. Conversion helpers are in `src/progress/units.ts`. Defaults are lb and mi, in `public.progress_settings`.
- Rowing splits ignore the distance pref and stay per 500 m.

### Adult weight goal and the Free Home weight card
- The adult weight *goal* may still stay on the device until Health data is on (approved goal line).
- Counsel Rev 2: **no weigh-in is written to the server or kept on the device as history while Health data is off.** `src/progress/weightLocal.ts` refuses `saveWeighIn` and returns no history when health is off.
- After health is on, ciphertext weigh-ins may be written to `public.weigh_ins`. There is no plaintext weight column.
- Body-weight sharing with a coach is a separate toggle, off by default, and only for an active 1:1 relationship. Plan followers cannot turn it on. Ending the relationship or turning the toggle off ends access immediately. Coaches never receive a decrypt key from this pass.

### e1RM formula
- Configurable between Epley (`w × (1 + reps/30)`) and Brzycki (`w × 36 / (37 − reps)`).
- **Default: Epley with a 10-rep cap.** This is Kevin's open decision and can be changed in `progress_settings` (and the TS defaults) without a schema rewrite. The cap must stay between 1 and 36 so Brzycki remains defined.

### Progress photos
- Hidden for everyone under 18 (`canUseProgressPhotos`). The server still rejects 16–17 uploads even as the service role (`photo_upload_not_allowed`). Video upload is also blocked for everyone in this phase (`upload_progress_video`).
- **Separate first-use opt-in**, never pre-checked, default off. Continue always records the switch state with a version and 64-hex text hash (`set_progress_photo_opt_in(on, version, hash)`). Not now logs `dismissed` (or could log nothing); it does not change the opt-in. No automatic re-prompts (`app.progress_photo_reprompt_due` is always false). These kinds are logged on `consent_events` only, not added to `record_consent` / the Privacy & Safety kind list.
- On the phone: JPEG EXIF / GPS / device / timestamp metadata is stripped, then the bytes are encrypted with AES-256-GCM. Counsel chose envelope-style per-user photo keys (`private.photo_data_keys`, separate from health keys) so the server can destroy the key within 30 days. The client still strips EXIF before upload. The capture date we store is ours, not the EXIF date.
- Face recognition is not used (`FACE_RECOGNITION_ENABLED = false`). CUBI: alignment is only `overlay`, `whole_image`, or `on_device_body_pose` with face points discarded and never stored. No face detection, landmarks, auto-crop, recognition, or body measurements from photos.
- Photos and metadata are scrubbed out of Anthropic / `ai-plan`, analytics, crash reports, and session replays (`src/progress/photoScrub.ts`).
- Coach sharing is **per photo**, with its own opt-in, and only for an active 1:1 with an approved coach who is 18+ (`coach_verified`). Shared copies live under a separate key, start unviewable until watermarked and hash-checked (`finalize_shared_photo_copy`; vendor already listed in Privacy Policy §8.1; wiring comes later), and have no Storage download policy. Revoking a share, turning photos off, or delete-all shreds shared-copy keys immediately.

### Deletion (Rev 2)
- Turning photos off: export must be offered first (`export_required` unless there were no photos and the switch was never on); device copies are deleted immediately (`photoDeviceStore.deleteAllNow`); server copies and backups are shredded within 30 days by destroying the per-user photo key (`schedule_photo_key_shred` sets `shred_after` to now + 29 days; `run_retention_purge` / `photo_shred` delete due keys); coach access is revoked immediately.
- Delete-all does the same deletion path but **leaves photos enabled**. The current key is deactivated and scheduled for shred; a new key can be registered for later shots.
- Pending-delete rows are hidden from the athlete's select policy.

### Lock, blur, privacy line, compare (Rev 2)
- The photo lock re-locks after 1 minute away (`PHOTO_LOCK_RELOCK_MS = 60_000`), whether the lock is always on or a setting.
- App-switcher blur is always on and is not tied to the thumbnail-blur setting.
- Thumbnail blur is a setting.
- The gallery privacy line is computed from real state: Face ID / Touch ID / Locked (Android) or "Not locked", plus "Not in your camera roll" or "Some copies in your camera roll" (`galleryPrivacyLine`). Touch ID body copy is fingerprint only.
- Compare only scales to fit. No crop, rotation, or alignment (`PHOTO_COMPARE_TRANSFORM = 'scale_to_fit'`). Caption: "Shown as taken. Nothing is cropped or lined up for you."
- Android lock row title is "Require phone unlock" (Rev 3); Touch ID is "Require Touch ID".

### Export (Rev 3)
- One ZIP, delivered through the system save dialog (share sheet with only the ZIP is an acceptable fallback). (`src/progress/photoExport.ts`)
- Files named like `2026-11-14-front.jpg`.
- Location and device metadata are stripped again.
- Nothing is burned into the images (no dates, no watermark). Weight appears only as an optional sidecar when "Show weight on labels" is on.
- `README.txt` includes the date range and the line "This copy isn't locked or encrypted."
- No password.
- Nothing is auto-deleted after export (`app.photo_export_auto_deletes()` is false). The export hook only records that a copy was offered.

### Purge date in outcome toasts (Rev 3)
- `{date}` is the request date + 30 days.
- It is shown only when the purge job guarantees that deadline (`photoPurgeDeadlineGuaranteed` from `public.retention_purge_health()`, and `app.photo_purge_deadline_guaranteed()`).
- The guarantee is true only when the daily job is confirmed running (a successful run in the last 25 hours) and no photo shred is overdue. Scheduled shreds are never more than 30 days out; `run_retention_purge` shreds due photo and health keys.
- Ops wiring is config and a runbook only, not a deploy: `ops/retention-purge.schedule.yml` (daily 07:20 UTC via `private.run_retention_purge_cron()`), `ops/retention-purge.alerts.yml` (placeholder destinations), and `docs/runbooks/retention-purge.md`.
- Teen "Clear weight" while Health stays on only nulls the live value; the health key still encrypts other records, so that toast omits `{date}` (`TEEN_WEIGHT_CLEAR_PURGE_DEADLINE_GUARANTEED = false`). When Health is withdrawn, the health-key shred path applies and the date may be shown if the job is confirmed running.

### Teens (weight) and Health-off (Rev 4)
- No photos or video.
- No weight card, trend, or sparkline on Progress or Home, whether or not Health is on. No Lose, Gain, or size goals.
- When teen weight exists, it is a **single current Profile value** (both health opt-ins, no target). Saving overwrites the previous value; there is no history and no `weigh_ins` row (`teen_weight_history_not_allowed`).
- If either Health opt-in turns off (teen or parent): AI planning turns off; all saved health info is deleted, including weight, injury notes, the health screen, the derived injury category, and weigh-ins (`private.clear_teen_health_data`). Immediate in the app and on the live server; backups go with the health-key shred within 30 days. When Health is turned back on, those values start empty.
- If the parent caused the withdrawal, the teen is notified once (`teen_data_notices.health_deleted_by_parent`) and the notice stays in their notification list. There is no "ask your parent to turn it back on" nudge. `{date}` in that notice is shown only when the purge guarantee is on.
- "Clear weight" while Health stays on still only nulls the live weight and does not insert that parent notice.

### Download my data (Rev 4)
- The server builds one ZIP of JSON/CSV plus photos (`private.build_data_export_package`, `prepare_data_export` / `fetch_data_export`).
- Included: account and settings (age range and the date the person turns 18, not date of birth); training setup; workouts, sets and PRs; AI plans; saved health info including the derived injury category and plan changes; connected health apps (empty when none); photos; coach messages (empty when none); consent history with the exact text shown; recipients; purchases; rights requests.
- Never included: IP/device hashes (available on a separate request only); the pepper or any keys; other people's data; safety, moderation or NCMEC records; security logs; AI prompts.
- Delivery is a short-lived in-app signed link (15 minutes), only after the photo/app lock check passes (`lock_required` otherwise). Fetching an expired link raises `link_expired`.
- The request is logged as a rights request (`audit_log.data_export_requested` with `rights_request: true`).
- Parent export of teen data stays behind `PARENT_CAN_EXPORT_TEEN_DATA` / `app.parent_can_export_teen_data()`. The existing `request_data_export()` queue stub is unchanged.
- Sheet rows are shown or hidden by whether that data exists, not by age (`dataExportLabelsFor`). The exception is Photos, which never appears for 16–17s. An adult with 0 photos also hides that row. The footer stays the single security-logs line; there is no separate crash-reports line.

### Weigh-in visibility (Rev 3 addendum)
- Encrypted weigh-in rows are fully hidden from a coach unless the athlete has turned on weight sharing for that coach (`body_weight_share` is per-coach; `app.shares_body_weight_with`).
- Teens never share weight. Turning sharing off cuts access immediately, including realtime (`weigh_ins` is not in `supabase_realtime`; `app.weigh_in_push_signals_enabled()` is false).
- When sharing is off, coaches get no metadata either: no row counts, timestamps, `updated_at`, sync events, or "last active" signals derived from weigh-ins. `progress_weight_series` is owner-only.

### Crash and analytics (Rev 5)
- Crash and analytics events must not include a user ID, email, or name. They may carry at most a random install ID (`src/analytics/installId.ts`) that resets on sign-out and on account deletion, is never joined to account data, and is shared only with service providers. This is a separate ID from the trainer-code rate-limit id.
- `assertCrashAnalyticsSafe` / `trackAnalyticsEvent` / `reportCrash` fail if a payload includes those identifiers. A unit scan fails if a vendor SDK is added or if source calls `setUser` / `identify` style APIs.
- No analytics or crash vendor is wired today (`package.json` and `app.json` have none). Under that rule these events are not part of Download my data, and the footer stays the single security-logs line. If a vendor setup ever attaches user IDs, add "crash reports" to the footer and pull them on request.

### Teen Health-off notice and push (Rev 5)
- Lock-screen / push preview is exactly: "Your parent changed a privacy setting." It must not mention health.
- The kept in-app notice uses the Rev 4 text with `{date}` until that date, then reads exactly: "Your parent turned off Health data. Your saved health info, including your weight, was deleted. AI planning is off too."

### Curly apostrophes (Rev 6)
- Bundled legal policies and hashed consent texts use curly apostrophes (U+2019). The version hash is of the exact characters shown. A unit guard fails if a straight apostrophe appears in those texts.
- Counsel later published Privacy Policy and Consumer Health Data Privacy Policy v0.3 DRAFT and Terms of Service v0.2 DRAFT. Those are bundled and hashed (`privacy-policy-v0.3-draft`, `health-policy-v0.3-draft`, Terms `v0.2-draft`). `npm run policies` regenerates `policies.generated.ts` and the seed migration. Acceptances stay pre-production and must be repeated before launch.
- After a version is live, any text change, including typography, must bump the version.

### Download my data lead (Rev 6)
- When the photos row is shown: "One ZIP file with your data and photos. Data is in common file formats (JSON and CSV)."
- When the photos row is hidden (16–17s, or an adult with 0 photos): "One ZIP file with your data. Data is in common file formats (JSON and CSV)."

## Kevin flags (not yet decided)

These are config flags in `src/progress/phase5Flags.ts` so the rest of the logic can land without a UI. Defaults follow Counsel's recommendation / the drawn option, and can be flipped without a schema rewrite.

| Flag | Default | Meaning |
|---|---|---|
| `PHOTO_LOCK_MODE` | `'default_on_setting'` | Lock is a default-on setting. Flip to `'always_on'` to remove the off switch. |
| `CAMERA_ROLL_SAVE_OPTION` | `true` | Keep the "save copies to camera roll" option, default off. Flip to `false` to drop the row and always report "Not in your camera roll". If dropped, the opt-in and policy hashes must be bumped and the "camera roll aren't affected" line must come out. |
| `TEEN_WEIGHT_PROFILE_ONLY` | `true` | Teen weight, if it exists, is Profile-only (Counsel's recommendation). |
| `TEEN_WEIGHT_EXISTS` | `true` | Whether teen weight exists at all (Rev 3). Flip to `false` to hide even the Profile current value. |
| `PARENT_CAN_EXPORT_TEEN_DATA` | `true` | Whether a parent can export a teen's data, with the teen notified (Rev 3). Counsel recommended yes. Teens have no photos, so this covers other teen data. Mirrored by `app.parent_can_export_teen_data()`. |

## Counsel answers applied

1. **EXIF re-strip vs device-only key.** Counsel chose encrypt-before-upload plus per-user key destruction within 30 days (envelope-style shreddable key, not a device-only key the server can never destroy). Client strip before upload is required. Server re-strip is not required in this review.
2. **PhotoDNA / hash matching.** "Run hash matching on shared copies. The vendor is already listed in Privacy Policy §8.1." The hook is `finalize_shared_photo_copy`. Actual vendor wiring remains later.
3. **Coaches seeing ciphertext weigh-in rows after the share toggle.** Answered in the Rev 3 addendum: fully hidden unless the client has turned on sharing for that coach. Applied above.

Counsel's published Privacy Policy v0.3 DRAFT, Consumer Health Data Privacy Policy v0.3 DRAFT, and Terms of Service v0.2 DRAFT are now the bundled policy sources in `src/legal/policies/` and the `legal_text_versions` seed. In-app opt-in sheets, lock strings, and confirm copy still live in the client helpers.

## What this pass did not build
- No new Progress, Home, or Photos screens (those wait for Paper).
- No victory-native chart UI, no HealthKit / Health Connect sync.
- No actual PhotoDNA vendor integration (hook only), no on-image watermark renderer (shared copies are flagged watermarked by the finalize hook).
- Policy markdown and `legal_text_versions` now carry Counsel's published Privacy / Health v0.3 DRAFT and Terms v0.2 DRAFT. AI consent versions are `ai-B-2026-11-16-draft` (and the teen / parent siblings) so the list includes training schedule (days and session length).
- No field-level shred for "Clear weight" while Health stays on, so that toast does not claim a calendar date.
- No server-computed body-weight EMA: weigh-ins are ciphertext, so aggregates run in the TS library on decrypted or still-on-device points until a decrypting worker exists.
- Strength and cardio coach-sharing toggles (separate from body weight) are not wired yet.

## Open questions

### For Kevin
1. **e1RM formula (still open).** This pass defaults to Epley with a 10-rep cap and offers Brzycki as a setting. Confirm or change that default before the Progress UI ships.
2. Photos notes, still open: show a one-time "Photos are now available" note at 18, or stay silent until the user finds the feature?
3. Confirm canonical storage (pounds and metres in `set_logs`) now that almost no production logs exist.
4. Accept only JPEG for now (so metadata can be stripped), or do we need HEIC / PNG in v1?
5. **Photo lock:** always on, or a default-on setting? (Flag: `PHOTO_LOCK_MODE`.)
6. **Camera-roll save option:** keep it (default off) or drop it? (Flag: `CAMERA_ROLL_SAVE_OPTION`.)
7. **Teen weight:** Profile-only current value, or none? (Flags: `TEEN_WEIGHT_EXISTS`, `TEEN_WEIGHT_PROFILE_ONLY`.)
8. **Parent export of teen data,** with the teen notified? Counsel recommended yes. (Flag: `PARENT_CAN_EXPORT_TEEN_DATA`.)
9. The coach-deletion clause in the Coach Terms (still open from Rev 2).
10. Lose fat on the adult AI quiz (carried forward).

### For Counsel
1. ~~Coaches seeing ciphertext weigh-in rows.~~ Answered in the Rev 3 addendum (fully hidden unless sharing is on for that coach).
