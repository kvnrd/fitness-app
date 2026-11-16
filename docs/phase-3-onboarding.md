# Phase 3: onboarding (DOB-first, 8 steps), parent invite, trainer codes, Privacy & safety

Status: built and tested **locally only** on branch `phase-3-onboarding` (off `main` 68052b9). Nothing is pushed, deployed or sent. Every legal string is a Counsel draft marked `[ATTORNEY]` in code and needs attorney review before launch. Sources: `onboarding-notes.md`, `legal/phase3-review.md`, `legal/phase4-review.md`, `legal/phase2-legal-answers.md`, `legal/privacy-policy.md` (v0.2 DRAFT), `legal/consumer-health-data-privacy-policy.md` (v0.2 DRAFT), Paper renders `onb-*.jpg`, `onb-p3-*.jpg` (all outside this repo).

## Flow

| Step | Screen | Route | Notes |
|---|---|---|---|
| – | Welcome | `welcome` | Create account / I already have an account |
| – | Sign-up method | `method` | Apple / Google / email. Only records the choice; OAuth never starts before DOB |
| 1 of 8 | Date of birth | `age` | Month picker + day + year, no defaults, no hints, Continue disabled until a real date. Locked after submit |
| – | Not eligible (under 16, lower of DOB and store signal) | `not-eligible` | "Sorry, you can't create an account right now" + "Nothing you entered has been saved." No button, no back, device flag |
| – | 16–17: Parent help → Invite parent → Invite sent | `parent-help`, `invite-parent`, `invite-sent` | Invite sent can go back to Invite (fix the email); nothing goes back to DOB. Then Apple / Google / email |
| 2 of 8 | Create (email) | `create` | Name, email, password (12–128, no composition rules), only the Terms checkbox |
| 3 of 8 | Verify | `verify` | 6-digit email OTP, 60 s resend |
| – | Waiting for a parent (pending 16–17) | `waiting-parent` | Counsel's pending copy; can fix/resend the parent email |
| 4 of 8 | Role | `setup/role` | Adults only. Coach → `apply_for_coach`. Optional trainer code under "I'm training". Pending teens skip it (server sets athlete) |
| 5 of 8 | Goal | `setup/goal` | Adults: lose/gain/maintain + weights (device only) + pace. Linked teens: Counsel's minor-safe list. Held for pending teens |
| 6 of 8 | Training style + follow-ups | `setup/style`, `setup/followups` | Pending teens: device only |
| 7 of 8 | Your gym (equipment) | `setup/equipment` | Pending teens: device only |
| 8 of 8 | Preferences | `setup/prefs` | Pending teens: device only |
| – | Privacy & safety | `privacy-safety` | Adults after Prefs; teens only after the parent link |
| – | Parent consent | `parent-consent` | Opened from the invite link (token) or a pending link request |

The age band used for routing comes from the server (`screen_age` returns `band` only when eligible). `src/onboarding/ageBand.ts` mirrors the rule for tests only.

## Server (migrations `20261116000100`–`000600`)

- `screen_age` → `{eligible:false}` or `{eligible:true, band}`. Still stores nothing personal.
- `complete_signup(..., p_terms_version, p_terms_hash, p_privacy_version, p_privacy_hash)` records a `terms` event and a `privacy_policy` event (version + SHA-256 of the bundled policy text). No Terms document exists yet: the client sends `terms-placeholder-v0` with no hash.
- `training_setups` + `save_training_setup(p_setup jsonb)`: partial saves, strict keys (body weights can never get in), pending minors refused (`not_allowed`), minors only Counsel's minor-safe goals and never a pace.
- `parent_invites`: `create_parent_invite(p_parent_email)` (pending teen only, neutral response, 5/day), `claim_parent_invites_to_send()` (service only; 256-bit token, only its hash stored), `accept_parent_invite(...)` and `accept_parent_link(...)` (attestation + terms + parent risk acknowledgement + privacy version/hash all required; one generic `false`; 10 failures/hour). The parent email is nulled once the invite is used, cancelled or expired; the day-14 purge cascades.
- Trainer codes: `create_trainer_code(p_max_redemptions, p_expires_in_days, p_coach_id)` (verified coach for self, or service/admin) returns an 80-bit Crockford code once (`XXXX-XXXX-XXXX-XXXX`), stores only the peppered hash, expiry 1–90 days. `revoke_trainer_code(id)`. `redeem_trainer_code(p_code, p_device_id)`: one generic `false` for every failure, `rate_limited` at 10 failures/hour or 30/day per user, 30/hour per IP, 10/hour per device (attempts in `private.trainer_code_attempts`, peppered hashes, purged after 30 days). Pending minors always fail generically; coaches are 18+; coaches never see minors' health fields.
- Privacy & safety: `submit_privacy_safety(health, ai, risk versions + text hashes, p_health_policy_hash)` logs each item as its own `consent_events` row (on or off) with version, text hash and policy document hash. AI requires health on (`health_required`), on every path; revoking health revokes AI for that grantor (and the parent → teen cascade). Health grants get `reask_on` = grant date + 12 months; `my_onboarding_state().health_reask_due` reports it (the re-ask UI is a later TODO; the consent does not auto-expire).
- `app.can_train(uid)` = onboarded and effective `risk_notice` (teen AND current parent for 16–17). `set_logs` insert/update require it.
- `my_onboarding_state()` → `{is_minor, linked, invite_status, setup_done, privacy_done, can_train, health_reask_due, parent_risk_done}` (own row; UI gating only).
- `health-record` function: new `weight_goal` field (adult body-weight goal, KMS envelope, JSON string, strict keys), partial writes (an omitted field keeps its value), refused for 16–17, needs effective health consent.

## Device-only data

`src/onboarding/deviceSetupStore.ts`:
- Pending 16–17: Setup steps 6–8 stay on the device, are uploaded with `save_training_setup` when the link goes active (deleted only after a successful upload), and are deleted at day 14 or sign-out.
- Adult weight goal (current/target/pace): on the device only (SecureStore on native; AsyncStorage on web, TODO) until the health switch is on, then uploaded through `health-record` and deleted from the device. While health is off it never leaves the device.
- There is no Free Home body-weight card in this codebase today; if one is added it follows the same rule, and teens get none (phase4-review #5).

## Policies in the app

`src/legal/policies/*.md` are Counsel's v0.2 drafts, bundled by `npm run policies` into `policies.generated.ts` (drafting-notes block stripped, version, SHA-256). Routes `/legal/privacy` and `/legal/health-privacy`; Train → Account → Privacy rows; the health policy is linked from Privacy & safety. `tests/unit/policies.test.ts` fails if the generated file is stale. When Counsel sends a new version: copy the files in, run `npm run policies`, commit. The hash changes, so new consents record the new version.

## Tests

- SQL: 326 → 733 assertions (`cd supabase/tests && node run.mjs`).
- Server functions: 39 → 44 (`cd supabase/functions && npm test`).
- Client unit tests (new): `npm run test:unit` (node --test, pure logic), 102 tests: DOB validation, age band (lower of store/DOB), device store + day-14 purge, setup payload (never weights), styles, policies (stale-hash guard), legal text hashes, password rules, routing, Privacy & safety and parent-consent state machines, weight-upload gate.
- Screenshots: `EXPO_PUBLIC_SCREEN_PREVIEW=1 npx expo export --platform web --dev`, then open `/dev-preview?screen=<id>&scheme=dark|light[&full=1]`. The preview route redirects home unless both `__DEV__` and that env var are set; it is not deep-linkable.

## Client details

- Privacy & safety: switches off by default, full text visible, no accept-all; Continue only by the risk checkbox. AI can be on only while health is on; tapping AI with health off shows an explanation with a "Turn on health info" button (turns health on only; AI needs its own tap). Turning health off turns AI off. Teen switches are locked until the parent grants that scope. After submit, if the parent's risk acknowledgement is missing, Train shows "Workouts unlock when your parent finishes their part." and logging is disabled (the server enforces it too).
- Parent consent: "Confirm and link" needs the attestation AND the parent risk checkbox; the three optional boxes never gate it, and the AI box needs the health box. After linking, each optional box is recorded with `record_consent(..., p_for_user)` (health before AI).
- Trainer code entry (Role step, under "I'm training"): one generic failure message, a separate calm message when rate-limited. The per-install device id is a random UUID (not an advertising id).
- Adult weight goal: "Delete my weight goal from this device" on the Goal step and in Train → Account. A launch-time sync uploads a leftover weight goal if health was turned on later.
- Sign-out clears the device draft, the weight goal and the goal marker; launch runs the day-14 purge using the profile's `created_at`.

## Kevin's setup steps (none done)

1. Apple: enable **Declared Age Range** on the App ID; build with Xcode 26 via EAS dev builds (see `docs/store-age-signal.md`).
2. Google Play: enrol in **Age signals**, set custom age ranges 16 and 18, test with a license tester (see `docs/store-age-signal.md`).
3. Supabase Auth: enable email + password sign-up with a 6-digit OTP confirmation (`{{ .Token }}` in the confirm-signup template), 10-minute expiry, leaked-password protection, rate limits; configure SMTP.
4. Apply the Phase 3 migrations after the Phase 2b ones. Insert `trainer_code_pepper` if not already (Phase 2 checklist).
5. Confirm which header Supabase's edge puts the real client IP in (the code prefers `cf-connecting-ip`, then `x-real-ip`, then the last `x-forwarded-for` hop). Per-user and per-device limits hold regardless.
6. Parent invite email: pick an email provider and build the sender function that calls `claim_parent_invites_to_send()` (service role) and emails a link `fitnessapp://parent-consent?token=…` (plus a universal link). Same for the day 3 / day 7 reminders (`claim_pending_minor_reminders()`). Not built.
7. Universal links / associated domains for the invite link, if wanted (Apple `applinks:` + Android App Links).
8. Fill the policy placeholders ([App], [Company], contact email, address, effective date) with Counsel and publish both policies on the website, with a separate homepage link to the Consumer Health Data Privacy Policy (WA MHMDA).
9. Provide a Terms of Service document (none exists; the Create checkbox links to a placeholder page).

## Later-phase TODOs (documented, not built)

- Rights-request flow: Settings › Privacy › Your privacy rights (access/export, correct, delete, withdraw, recipient list, appeal), 45-day response with one extension notice, appeal answered in 45 days with WA/TX AG links; email path for people without the app; request log kept 24 months+.
- Health-consent re-ask UI every 12 months (date already stored) and whenever an injury/condition is edited.
- Separate first-use opt-in for adult progress photos.
- Minors' form-check numbers go to a coach only after BOTH teen and parent opt in.
- Form-check cues stay rule-based / on-device (no LLM) unless the AI consent and both policies widen.
- Website homepage + footer link to the Consumer Health Data Privacy Policy (WA MHMDA, NRS 603A.495).
- Wearables (Apple Health / Health Connect / devices): separate per-source switch, off by default, never sent to AI, analytics or coaches, deleted 30 days after disconnecting.
- Approximate location: in use only, rounded on the device, with a type-it-in fallback.
- Run GPS: its own precise + background opt-in, privacy zones (locked on for teens), private routes.
- Analytics: allowlisted events only, first-party or processor-only, opt-out in Settings; crash reports only for teens. No ad SDKs ever. (None added in this phase.)
- Consent log extras from Counsel's build hooks: IP, device and app version per consent row; teen notification whenever a parent changes a setting; deletion fan-out notices (processors and coaches).
- Parent verification (Stripe $0 auth / Identity), Parent Settings, the "Settings › Privacy" screen the copy refers to (only placeholder links exist now).
- Store age-signal revocation handling at launch (`checkStoreAgeSharingRevoked()` is built but not wired; decide with Counsel).

## Decisions to confirm (Kevin / Counsel)

- Terms: no Terms document exists; signup records `terms-placeholder-v0` and the checkbox links to a placeholder page.
- Invite-sent copy says "We sent a link", but the email sender isn't built and the invite is only queued after the teen's account exists.
- Verify copy says "If an account can be created, we sent a 6-digit code…" (avoids confirming an account exists) instead of Paper's "We sent…".
- The "AI planning needs health info" explanation (teen, adult and parent versions) is our wording, marked [COUNSEL].
- Coach request note ("By requesting access you confirm you're an adult applying as a coach.") and its attestation version are placeholders [COUNSEL].
- The coach invite code field on the Role screen is not sent anywhere (no server function takes it yet). Keep or drop?
- Weight goal is never shown to coaches (own reads only).
- Parent `privacy_policy` acceptance is filed under the parent's own user id.
- Day-14 device purge counts from account creation; the server invite expiry uses the same clock.
- Custom accent color wheel from Paper Prefs is not built (presets only).
- Header carrying the real client IP on Supabase (see setup step 5).
- Store-signal revocation check at launch: built, not wired (it may show the store prompt).
- Teen progress bar jumps 3 → 6 while pending, then Goal shows as 5 of 8 after the link (as proposed in the notes).
