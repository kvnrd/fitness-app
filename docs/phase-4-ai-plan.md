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
- Preview registry ids: `parq`, `parq-yes`, `parq-clearance`, `parq-parent`, `parq-parent-clearance`, `health-switch`, `health-switch-teen`, `quiz`, `quiz-teen`, `generating`, `preview`, `blocked`, `home-ai`, `home-ai-teen`, `train-ai`, `profile-teen`

## Deviations and follow-ups

- The compact plan-notice footer is baked into the preview tab chrome (and the bottom of each live tab's scroll). It is not a custom system tab bar, because `@react-navigation/bottom-tabs` is not a direct app dependency.
- When two quiz goals are picked, only the first is sent to `ai-plan` (the request schema is one enum). The second is kept for the preview title.
- Quiz equipment chips map onto the existing equipment enums (`full_gym` expands to several; `bodyweight` is `none` unless another chip is also on).
- "Turn on Health data" reuses `submit_privacy_safety` (health + AI on, current hashed texts) rather than a new single-kind grant. A teen still needs the parent's matching grant (`parent_consent_required`).
- Privacy & safety is now also reachable after the user is in the app, so a later AI-consent or 12-month health re-ask can open it.
- **Terms of Service** are bundled as `v0.1-draft` (`src/legal/policies/terms-of-service.md`, SHA-256 of the published body). Signup records that version + hash. Acceptances are pre-production: a production build (`EXPO_PUBLIC_ENV=production`) will not count a draft acceptance, and anyone whose latest Terms row is a placeholder, a different hash, or a draft once a non-draft ships is sent to the re-accept screen (`legal/reaccept`). Non-production builds show a visible draft marker. Placeholders such as `[Company]` remain until Kevin/Counsel fill them.
- Remaining Counsel "Legal:" work on this branch: notifications / Settings › Privacy, 12-month re-ask UI, store-signal revocation, consent-row IP/device/app version, parent privacy acceptance referencing the teen (and passing the Terms document hash on the parent-accept RPC), web weight-goal encryption or memory-only, invite-code field wire-or-hide, "We sent a link" copy.

## Open questions for Kevin or Counsel

- Keep "Lose fat" on the adult quiz?
- 3-tab vs 4-tab cleanup for Tempo / Swap / Gym / Favorites (those boards were left as-is).
- Earlier open items (teen of-8 bar jump, and the Terms / policy placeholders `[Company]`, `[Coach Terms]`) still stand.
