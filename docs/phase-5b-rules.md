# Phase 5b rules

Logic, backend, and UI for photo import, PRs, the end-of-workout recap, legal v0.4 / Coach Terms, WeatherKit, and teen Option 3. Counsel Phase 3/4 consent rules stay intact.

## Streaks (Kevin, Nov 17)

Teens use the same planned-workouts streak as adults. The recap line is shown only when n ≥ 2, with exactly:

- `{n}-week streak`
- `You’ve hit your planned workouts {n} weeks in a row.`

(Curly apostrophe in You’ve.) Below n = 2 there is no streak UI. There is no streak-break or freeze copy, and no streak push notifications.

## Teen weight (Option 3) and fixed rules

- 16–17s with both health opt-ins can log weight, history, and trends like adults.
- Coaches never see a minor’s weight or health info.
- Nothing is calculated from a teen’s body weight for volume or PRs; teens never get an e1RM from body-weight loads.
- Progress photos are 18+, enforced on the server.
- “Lose fat” stays adults only.
- The teen AI safety filter stays on (no supplements, no pro-eating-disorder content).
- Optional flags in `src/progress/phase5bFlags.ts` are all off (`TEEN_NO_GOAL_WEIGHT_OR_LOSS_ADVICE`, `TEEN_NO_LOSS_CELEBRATIONS`, `TEEN_SUPPORT_LINK`). Tests cover both states.

## Photos

System picker only. HEIC/PNG convert to JPEG on device, EXIF/XMP/GPS stripped, leftover GPS rejected, user-confirmed date only, original never uploaded, PhotoDNA hook, no face processing. Import consent is just-in-time (`photos-v2-2026-11-17-draft`); camera `photos-v1` stays valid for camera; launch is never blocked.

## Weather, region, wearables, analytics

- Weather: Apple WeatherKit REST from a Supabase function. Rounded ~1-mile location, short TTL cache, attribution passthrough, alert fields unchanged, signing key server-side, coordinates never logged.
- Region: AWS us-west-1, KMS in the same region (`src/config/region.ts`).
- Wearables: Apple Health and Garmin only.
- PostHog / Sentry: configured only when `EXPO_PUBLIC_POSTHOG_KEY` / `EXPO_PUBLIC_SENTRY_DSN` are set. No vendor SDKs are added in this pass. Retention: PostHog 12 months, Sentry 90 days.

## Out of scope for this branch

- Coach onboarding UI (Phase 6).
- Trust-and-safety exception / parent-facing “Coaching ended” (Phase 6, admin-only).
