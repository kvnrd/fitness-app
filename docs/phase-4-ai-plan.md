# Phase 4: AI plan (health screen, quiz, generation, notices)

Status: built and tested **locally only** on branch `phase-4-ai-plan` (off `phase-3-onboarding`). Nothing is pushed, deployed or sent. Every legal string is a Counsel draft marked `[ATTORNEY]` in code and needs attorney review before launch. Sources: `legal/phase4-review.md`, `legal/phase2-legal-answers.md` §13, `legal/phase3-review.md`, Paper renders in `/workspace/fitness-app/phase4/` (outside this repo). The health screen is never labeled PAR-Q+; some preview registry ids keep the historical `parq-*` stem so they line up with the Paper file names.

Counsel's rulings win over the Paper spec.

## Flow

The user starts "Build an AI plan" from Home or Train. A pure `nextAiStep()` decides the next route:

| Gate | Screen | Route | Notes |
|---|---|---|---|
| Health data off | Health data is off | `ai/health-switch` | "Turn on Health data" re-submits Privacy & safety with health and AI on (same hashed texts). "Not now" returns to the tabs. Teen copy names the teen and requires both opt-ins. |
| Health screen missing or due (12 months, or after an injury/condition edit) | Health screen | `ai/health` | Seven yes-or-no questions. Continue disabled until every question is answered. Any yes → clearance (`See what's next`). All no → quiz. A teen cannot self-submit (`parent_required`); a parent uses `?for=&name=`. |
| `clearance_needed` | Talk to a doctor first | `ai/clearance` | Checkbox + timestamp only. Continue disabled until the exact acknowledgement is checked. Hash of the displayed ack is stored with `health-clearance-2026-11-16-draft`. |
| Health on, screen ok, AI vendor still off | Privacy & safety | `privacy-safety` | Reachable in-app (not only during first onboarding). |
| All gates pass, no accepted plan | Build your AI plan | `ai/quiz` | Six short answers. Teen list omits Lose fat / size targets; "Build muscle" is strength and performance. Up to two goals; the first is sent to the API (the schema is one goal). Injury chips: None, Lower back, Knee, Shoulder, Other. |
| Generate | Building your plan | `ai/generating` | About 20 seconds. Cancel returns to the quiz. Only an injury category is sent to Anthropic. |
| Success | Preview | `ai/preview` | Week strip, session list, category swaps (not a rehab plan), full plan-notice banner, "Start this plan" → `mark_ai_plan_accepted`. |
| Safety filter / refusal / unparseable | We couldn't use this plan | `ai/blocked` | "Nothing was saved." Does not name eating disorders or the filter category. Generate again / Change goal. |

Free logging and training with a coach stay available when AI planning is off.

## Plan notice

Verbatim full text (Counsel §12, never edited):

> Made with AI. It can be wrong, so check that it fits you. It isn't medical advice. Stop and see a professional if anything hurts.

After the first session (`mark_ai_first_session_done`) it shrinks to:

> Made with AI. It can be wrong. Not medical advice.

plus a **More** control that reveals the full sentence. It is shown on every surface that shows an AI-made plan (preview, Home, Train, Progress, Profile) and never disappears.

## Tabs

Home · Train · Progress · Profile. Studio remains available only for verified coaches (the four-tab bar is otherwise unchanged). Theme tokens are not touched.

## Teen rules (Counsel)

- No bulking, body-size or weight targets, no calorie-surplus advice, no supplement suggestions. Enforced in the system prompt and the output filter (`minor_restricted`). "Build muscle" means strength and performance, not size or mass.
- The quiz does not offer Lose fat or a size-oriented Muscle chip. (Whether adults keep "Lose fat" on the quiz is an open question for Kevin / Counsel.)
- No body-weight card or trend on Home. Optional Profile weight only when both health opt-ins are on and there is no target.
- Health screen and clearance for 16–17 are parent-together. The teen cannot self-submit.
- Coaches never receive `health_screen`, `weight_goal`, or `body_weight`.

## Server

Migration `20261117000100_phase4_health_screen_ai_gates.sql`:

- `health_screen_state` stores the derived gate only (completed_at, reask_on, any_yes, clearance checkbox + timestamp + version + text hash). Answers themselves are encrypted in `health_records.health_screen_ct`.
- `app.health_screen_status` → `missing` / `due` / `clearance_needed` / `ok`. `app.can_ai_plan` requires onboarded + effective health and AI consents + status `ok`.
- `submit_health_screen`, `attest_health_clearance`, `my_ai_plan_state`, `mark_ai_plan_accepted`, `mark_ai_first_session_done`.
- `log_ai_plan_filtered` (service only) records an allowlisted reason code and never the draft.
- `my_onboarding_state` also returns `health_screen_status` and `can_ai_plan`.
- First write of a previously-null injury category/notes does not mark the screen due; a later edit does.

`ai-plan` function: maps `health_screen_required`, `clearance_required`, and `parent_required` to 403; logs only the reason code when a draft is rejected. Goals now include `hybrid` and `hyrox`.

`health-record` function: current-only `body_weight` (`{current, unit}`, no target or pace). Parents may read/write a linked minor's record (DEK and AAD bound to the teen). Coaches never receive health-screen or weight fields.

## Client

- `src/ai/healthScreen.ts`, `quiz.ts`, `flow.ts`, `api.ts`, `notice.ts`, `planDraft.ts`, `useAiPlan.ts`
- Screens in `src/ai/screens/`, routes under `src/app/ai/`
- Preview registry ids include the Phase 4 flow plus legal/settings states (including `profile`, `terms-reaccept-waiting`, `health-reask-teen`, `health-reask-waiting`, `home-ai-paused`, `home-ai-paused-teen`, `train-ai-paused`, `settings-notifications-teen`).
- Settings › Privacy (`/settings/privacy`) and Notifications (`/settings/notifications`) are reachable from Profile. The 12-month health-consent re-ask is `/settings/health-reask` (also from a card on Privacy when `health_reask_due`). `health_reask_self_due` / `health_reask_parent_due` are split; when only the parent is due the teen sees a waiting line. The consent is not auto-expired and this clock never locks or pauses the app.

## Deviations and follow-ups

- The compact plan-notice footer is baked into the preview tab chrome (and the bottom of each live tab's scroll). It is not a custom system tab bar, because `@react-navigation/bottom-tabs` is not a direct app dependency.
- When two quiz goals are picked, only the first is sent to `ai-plan` (the request schema is one enum). The second is kept for the preview title.
- Quiz equipment chips map onto the existing equipment enums (`full_gym` expands to several; `bodyweight` is `none` unless another chip is also on).
- "Review Health data" on the health-switch screen opens in-app Privacy & safety and does not flip Health data or AI. Each switch is turned on there, with the full texts visible.
- Privacy & safety is now also reachable after the user is in the app, so a later AI-consent or 12-month health re-ask can open it.
- **Terms of Service** are bundled as `v0.1-draft` (`src/legal/policies/terms-of-service.md`, SHA-256 of the published body). Signup records that version + hash. Acceptances are pre-production: a production build (`EXPO_PUBLIC_ENV=production`) will not count a draft acceptance, and anyone whose latest Terms row is a placeholder, a different hash, or a draft once a non-draft ships is sent to the re-accept screen (`legal/reaccept`). Non-production builds show a visible draft marker. Placeholders such as `[Company]` remain until Kevin/Counsel fill them.
- `accept_parent_invite` / `accept_parent_link` now require `p_terms_hash` (64 lowercase hex). The parent's Terms and Privacy `consent_events` rows store `text_hash` (Terms) / `policy_doc_hash` (Privacy) and `subject_user_id` = the teen's account (parent and minor ids on the same record).
- `consent_events` also records `ip_hash`, `device_hash`, `app_version`, and `meta_pepper_version` on insert. IP uses the same header preference as trainer-code rate limits (`cf-connecting-ip`, then `x-real-ip`, then the last `x-forwarded-for` hop, never the first). Hashes use a dedicated `consent_meta_pepper` (edge secret or KMS HMAC via `SET LOCAL app.consent_meta_pepper`, helper in `supabase/functions/_shared/consentMeta.ts`). This is not `private.encryption_keys` and not the trainer-code pepper. A labeled DB pepper (`private.consent_meta_dev_pepper`) is a dev fallback only. If the pepper is missing, hashes are left null and a `consent_meta_pepper_missing` audit event is logged with the user id only — never an IP. Raw IPs are never written to tables, logs, or analytics. Hashes have the same retention as consent records (account life + 4 years; minors at least until the 22nd birthday) and must not be described as de-identified.
- `legal_text_versions` is an append-only archive of the exact bundled texts that consent hashes refer to (kind, version, sha256, full text, first_shown_at), seeded at migration by `scripts/seed-legal-text-versions.mjs`. It is not auto-purged.
- TODO(export): `request_data_export()` only queues a pending row. When the packer is built, the access-request pack must include consent metadata hashes, pepper version, and the matching `legal_text_versions` rows, never a raw IP.
- Store-signal revocation is hooked at launch for signed-in users. `report_store_signal_revoked()` sets `profiles.store_signal_revoked` and never raises an age or writes install ids, store dates, or the raw response.
- The weight goal is SecureStore on native and **memory-only on web** (no localStorage). Refreshing the web app drops it.
- The unwired coach "Invite code · optional" field is hidden. The athlete trainer-code expander stays (it is wired).
- Invite-sent title, body, and note are Counsel verbatim (phase4-build-answers). The email sender for the invite and the day-3 / day-7 reminders is not built (launch blocker below).
- Settings › Privacy copy and the "Consumer Health Data Privacy Policy" link match Counsel. Rights, download, delete health data, delete account, and Coaching rows are clearly marked placeholders until those backends ship. Notification prefs are device-local. 16–17 lock-screen previews of parent/coach messages do not include message text.
- Two clocks: a due health-screen re-screen pauses AI only (`app.can_ai_plan`), with Counsel's banner on Home and Train; logging, coaching, and the saved plan stay visible and stop adapting. The 12-month Health-data consent re-ask never locks or pauses AI. Turning Health data off from the re-ask screen warns and offers an export first, and shows `HEALTH_TEXT_WITH_AI` (the text whose hash is logged).
- Adults with stale Terms are gated from general app use, but Settings › Privacy, export, and deletion stay reachable. For 16–17, the parent re-accepts (`accept_terms` also writes `subject_user_id` for each linked minor). The teen is not locked and sees "Waiting for your parent to review the updated Terms."
- Policy wording Counsel specified for Privacy Policy §4, the retention table "Consent records" row, and drafting-note build hooks is pending in v0.3 of the policies. This pass does not bump or rehash the bundled policies.

## Launch blockers

- **Email sender.** The invite ("We'll email a link…") and the day-3 and day-7 reminders are not sent until a sender is built. Kevin still needs to pick an email vendor, and it has to be listed in Privacy Policy §8.1.
- **Parent Settings.** Fine to wait in dev, but required at launch. The parent attestation and the parent health box already promise "I can view [Teen]'s data and change or withdraw any choice anytime in Parent Settings." At launch, Parent Settings must include:
  - view and withdraw for each consent scope;
  - the parent's consent re-ask card;
  - an entry point to the parent-together health re-screen (`ai/health?for=`), plus a notice to the parent when it comes due.

## Open questions for Kevin or Counsel

- Keep "Lose fat" on the adult quiz?
- 3-tab vs 4-tab cleanup for Tempo / Swap / Gym / Favorites (those boards were left as-is).
- Teen of-8 bar jump, and the Terms / policy placeholders (`[Company]`, `[Coach Terms]`, and similar) still stand.
- Attorney review of every `[ATTORNEY]` string before launch.
- Confirm a launch-time `checkStoreAgeSharingRevoked()` call is acceptable. It can show the store's sharing prompt if the user has not decided.
- Confirm which client-IP header the production Supabase edge actually sets (same open question as the trainer-code rate limiter). Assumption documented in `20261117000300_phase4_legal_consent_meta.sql` and applied by `private.client_ip()`: `cf-connecting-ip`, then `x-real-ip`, then the last `x-forwarded-for` hop. Production should set `CONSENT_META_PEPPER` (edge secret or KMS HMAC) rather than relying on the DB dev fallback.
- Policy v0.3 wording (Privacy Policy §4 "Security and consent records", the retention table "Consent records" row, drafting-note build hooks, and "training schedule" in §7 / §8.1 and health policy §8) is Counsel's next policy pass.
