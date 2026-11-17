# Phase 5 — Progress and photos (groundwork)

Non-UI plumbing for the Progress tab and progress photos. The screens wait for Paper designs. Counsel's Phase 3 and 4 rules are unchanged: health and AI remain separate opt-ins, nothing is pre-checked, teen switches stay locked until the parent co-consents, and the terms/consent gates stay in place.

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
- Both stay **on the device** until the Health data switch is on (Counsel, Nov 15).
- The existing adult goal path (`deviceSetupStore` / `uploadWeightAfterPrivacy`) is unchanged.
- Home weigh-ins use the same health-data storage adapter (`src/progress/weightLocal.ts`): nothing is uploaded while health is off; a failed upload keeps the device copy.
- After health is on, ciphertext weigh-ins may be written to `public.weigh_ins`. There is no plaintext weight column. 16–17s may have body weight on the server only with effective `health_data` consent; the **goal** remains adults-only (existing Phase 4 rule).
- Body-weight sharing with a coach is a separate toggle, off by default, and only for an active 1:1 relationship. Plan followers cannot turn it on. Ending the relationship or turning the toggle off ends access immediately. Coaches never receive a decrypt key from this pass.

### e1RM formula
- Configurable between Epley (`w × (1 + reps/30)`) and Brzycki (`w × 36 / (37 − reps)`).
- **Default: Epley with a 10-rep cap.** This is Kevin's open decision and can be changed in `progress_settings` (and the TS defaults) without a schema rewrite. The cap must stay between 1 and 36 so Brzycki remains defined.

### Progress photos
- Hidden for everyone under 18 (`canUseProgressPhotos`). The server still rejects 16–17 uploads even as the service role (`photo_upload_not_allowed`).
- **Separate first-use opt-in**, never pre-checked, default off (`public.set_progress_photo_opt_in`, `src/progress/photoOptIn.ts`). Minors cannot turn it on. Health data consent is still required; this opt-in does not replace it.
- On the phone: JPEG EXIF / GPS / device / timestamp metadata is stripped, then the bytes are encrypted with AES-256-GCM. The key stays in SecureStore (never AsyncStorage, never the server). The capture date we store is ours, not the EXIF date.
- Face recognition is not used (`FACE_RECOGNITION_ENABLED = false`). The upload path does not import a face-recognition library.
- Coach sharing is **per photo**, opt-in, and only for an active 1:1 relationship plus `coach_sharing` consent. Plan followers cannot share. Coaches can read the shared row's metadata; they have **no** Storage download policy. Revoking the share or ending the relationship ends access immediately.

## What this pass did not build
- No new Progress, Home, or Photos screens (those wait for Paper).
- No victory-native chart UI, no HealthKit / Health Connect sync, no PhotoDNA / image-moderation hook, no watermark or screenshot notice on coach-viewed photos.
- No server-side EXIF re-strip (see open questions).
- No server-computed body-weight EMA: weigh-ins are ciphertext, so aggregates run in the TS library on decrypted or still-on-device points until a decrypting worker exists.
- Strength and cardio coach-sharing toggles (separate from body weight) are not wired yet.

## Open questions

### For Kevin
1. **e1RM formula (still open).** This pass defaults to Epley with a 10-rep cap and offers Brzycki as a setting. Confirm or change that default before the Progress UI ships.
2. Photos notes, still open: show a one-time "Photos are now available" note at 18, or stay silent until the user finds the feature?
3. Confirm canonical storage (pounds and metres in `set_logs`) now that almost no production logs exist.
4. Accept only JPEG for now (so metadata can be stripped), or do we need HEIC / PNG in v1?

### For Counsel
1. **Server-side EXIF re-strip vs on-phone encryption.** The notes ask for a second strip on the server (defence in depth). If the file is encrypted with a key that never leaves the phone, the server cannot re-strip without a decrypt path. Envelope encryption like health records would allow a server re-strip and would match the existing health-data pattern; pure device-key encryption would not. Which should we use?
2. Image moderation (CSAM hash matching, e.g. a PhotoDNA-type service) on any coach-shared image is called out in the photos notes and is not built yet. When should that land relative to sharing?
3. Coaches can currently `SELECT` ciphertext weigh-in rows after the athlete opts in (no decrypt key). Is exposing ciphertext and the weigh-in date acceptable, or should even the row be hidden until a view function mediates it?

Per-photo sharing (not the whole gallery) is what this pass implements, as the photos notes proposed.
