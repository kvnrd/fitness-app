# Phase 6 Coach Studio: build brief

> **Branch:** `phase-6-coach-studio` · **Stop commit (HEAD):** `2c2eddc` (`2c2eddcd06a64aaf94b5735f5e62c9728de280c9`) · **Base:** `main` @ `1ba83c7` (PR #13 merge)
> Check first: `git rev-parse --short HEAD` must print `2c2eddc` before you start. If it doesn't, stop and tell Kevin.
> As of Nov 17, 2026, 6:15 PM MST this branch has **not** been pushed to GitHub. Kevin either pushes it or imports it from the bundle (see HOW-TO-USE.md).

Read `CLAUDE.md` first. Its rules (no push, PR or merge without Kevin; don't edit legal text; don't invent copy; security first) apply to every task below.

---

## 1. Goal

Ship the Coach Studio described by the approved Phase 6 mockups (**rev 3, 85 screens × 2 themes, SPEC rev 3, all copy approved by Counsel**):
- coach application and verification;
- 16–17 approval;
- Studio client list and client pages;
- plan, tempo, activity and coach picks;
- exercise library and custom demos;
- report, block, DMCA, DFPS and NCMEC safety screens;
- the 30-day coach deletion duty with reminder, pause and suspension;
- parent and teen registry disclosure.

All of it must pass every check and match the mockups in Midnight (dark) and Grove (light), so Kevin can review the phase and decide whether to push.

**Source of truth, in order:**
1. Mockups: `phase6-mockups.zip`, unzipped to e.g. `~/fitness-mockups/phase6/`. It holds `midnight-<id>.png`, `grove-<id>.png`, `compare-*.png` boards, `SPEC.md`, `contrast-report.txt` and the HTML sources in `src/`. A copy of the SPEC is also at `briefs/reference/SPEC-phase6-rev3.md`.
2. Counsel: `briefs/reference/legal/phase6-review.md` (especially "Kevin’s Phase 6 decisions (Nov 17)", "Phase 6 rev 2" and "Phase 6 rev 3"), `coach-terms.md` and `phase5-review.md` ("Teen weight screens", "Teen streaks and parent safety exception"). These are read-only.
3. The existing branch code and `docs/phase-6-coach-studio.md`.

---

## 2. Current status (at 2c2eddc)

14 commits on top of `1ba83c7`. 33 files, about 4,900 lines added. **No new dependencies.**

**DONE and checked (adc131c … 016aff4):**
- launch flags (`src/studio/phase6Flags.ts`, `app.dmca_form_enabled()`, `app.hash_matching_live()`);
- deletion date math (`src/studio/deletionDates.ts`, `app.deletion_schedule`);
- Stripe Identity rules, document-only with server keys only (`src/studio/stripeIdentity.ts`);
- `check:shippable` (`scripts/check-shippable-bundle.mjs`);
- studio SQL (`supabase/migrations/20261117001900_phase6_coach_studio.sql`) and `consent_events` kind `coach_terms`;
- the three-strike rule (`src/studio/copyrightStrikes.ts`, `app.upheld_strikes`, `record_copyright_notice`);
- all 85 preview screens plus the pending-coach Studio tab;
- docs, the 70e spacing fix, and 62 as a sheet.

At 016aff4 Engineer recorded: tsc and functions tsc clean, check:shippable clean, unit 212, SQL 1101 on PGlite and pg17, functions 63, gitleaks clean.

**The last fidelity pass (ba81dcb, c46113f, 2c2eddc):**
- toast and demo-plate tokens, equal-row stretch;
- screens 13, 49–56 and 60–68 (safety, legal, deletion);
- screens 36–46 (library and create flow).

Engineer never ran checks on these three. **On Nov 17 at about 6:10 PM MST the handoff tool re-ran every check at 2c2eddc and they all passed:**
- `npm run typecheck` clean;
- `check:shippable` clean;
- unit 212/212;
- functions 63/63, functions tsc clean;
- SQL 1101/1101 on PGlite **and** on Postgres 17.11;
- gitleaks: 106 commits, no leaks.

**Not done yet:** screenshots of the last three commits haven't been recaptured or reviewed in either theme.

**Copy status at 2c2eddc:** `briefs/reference/copy-diff-2c2eddc.txt` compares the visible text of every preview screen with the mockup builder text. It's machine-extracted, case-insensitive, with icons stripped. 71 of 85 screens match. The 14 that differ are:
- **Expected (intentional):** 01 in Grove (the mockup hard-codes "Midnight · Aurora"), 53/53b (the placeholder agent line and the NOT SHIPPABLE mark are left out on purpose), and 66b/68b (sample lock-screen dates replaced by an annotation).
- **To look at:** 25, 33, 48, 49, 51, 57, 59, 70c and 70d. Each is missing one tab-bar label ("Studio", "Train", "Profile" or "Library") that the mockup shows under its scrim or sheet. Check by eye whether the tab bar is drawn under the overlay as in the mockup.
- 55, 56, 65, 40 and 42 now match the SPEC text. They still need a visual check (task 2).

---

## 3. Ordered tasks

Work through these in order. After each task, run the checks in §5 and commit to `phase-6-coach-studio` with a plain commit. Don't push.

### Task 1: Confirm your local environment reproduces the green state
- Set up as in HOW-TO-USE.md (Node 22+, Postgres 17, ripgrep, gitleaks, Chrome).
- Run every command in §5.
- **Accept when** your counts match: unit 212, functions 63, SQL 1101 on PGlite and 1101 on pg17, plus tsc, functions tsc, check:shippable and gitleaks all clean. If anything differs, stop and report it before you change code.

### Task 2: Recapture all 85 screens in both themes and fix visual drift
- Build the preview export and capture (`CLAUDE.md` §4; tools in `briefs/tools/`). This gives 170 PNGs.
- Compare each one with `midnight-<id>.png` / `grove-<id>.png` and with the `compare-*.png` boards.
- Check each by eye for full-height background, button contrast, safe-area margins and no blank charts.
- **Must-pass screens. Accept only when all of these are true:**
  - **55 Report suspected abuse:**
    - the Texas DFPS report steps (Fam. Code §261.101 intro, the "Report to Texas DFPS" card);
    - first actions **Call 1-800-252-5400**, **Report online at txabusehotline.org** and **Call 911**;
    - **View reporting training**;
    - a secondary **Tell [App] too** that says it "doesn’t replace your report."
    - There's no in-app DFPS form.
  - **56 How we report illegal content:**
    - the body ends "…preserve the reported material **for 1 year**.";
    - the **What you’ll see** card is shown;
    - "16–17 year olds can’t upload progress photos." is shown;
    - **no hash-matching sentence** while `HASH_MATCHING_LIVE` is false.
  - **65 Coaching settings** shows every row:
    - Certification verified (NASM checked · identity passed);
    - Work with 16–17 year olds (Approved);
    - Reporting training (Completed);
    - Report suspected abuse (Texas DFPS hotline and guide);
    - Client data / Deletion requests;
    - the 30-day line;
    - the "You can’t download a copy of a client’s data from [App]…" body.
  - **40 Edit cues and 42 What clients log** use the SPEC wording exactly. Engineer flagged earlier copy as made up; it now matches textually, so confirm it visually.
  - **13** uses the SPEC string: "Your training is recorded. We’re running the registry search and reviewing this request…". No reviewer is named.
- Resolve the 9 "missing tab label under overlay" screens from §2.
- **Tests to add:** a unit test that the preview registry contains every ID in `PHASE6_SCREEN_IDS` (85). Snapshot-free string assertions for 55 (all three first actions plus "doesn’t replace your report") and 56 ("for 1 year"; no hash sentence when the flag is off).

### Task 3: Grove soft-glass cards on pale sheets need at least 3:1
- On Grove, the global `glass` token is `rgba(255,255,250,0.62)` and `glassBorder` is `rgba(255,255,250,0.92)` (`src/theme/auroraPalettes.ts`). On a pale sheet (`colors.surface`) that edge is close to 1:1.
- A quick capture at 2c2eddc shows 62's row cards now have a darker sage fill and a visible border, so this may be partly fixed already. **Measure it; don't assume.**
- Also check the **off-state switch track** on 62 (white thumb on a very pale track), which also needs 3:1.
- Affected: **62 / 62b / 62c** (itemized deletion sheet) and **45 / 47** (trim demo, client view of a custom exercise).
- **Accept when** each card boundary (border or fill against the sheet) is **at least 3:1** (WCAG 1.4.11) in Grove, Midnight is unchanged, and the mockup look is kept.
  - Prefer a sheet-scoped card variant, such as a border from an existing token like `faint` `#5E6657`, which is 5.6:1 on Grove sheets per `contrast-report.txt`.
  - Don't change global `glass` tokens. That would restyle every screen.
- This touches a design question still open with Gucci (Kevin's designer): the faint Grove border. Show Kevin before and after shots.
- **Tests to add:** a contrast unit test (pattern: `tests/unit/auroraTheme.test.ts` / `styles.test.ts`) asserting at least 3:1 for the chosen card boundary color against the Grove sheet surface.

### Task 4: List and scope the UI-only controls (don't wire without Kevin)
**Fact from the code:** the Phase 6 screens are presentational.
- `src/studio/screens/*.tsx` contain **zero `onPress` handlers**.
- `SwitchRow` uses `onValueChange={noop}`, and `CheckRow`, `TextLink`, `SettingsRow` and `EqualRow` have no handlers.
- `Field` is a display-only `Text`, not a `TextInput`.
- Every screen renders hard-coded sample data (Alex Rivera, Kevin, Maya Chen, Sam, NASM-1234567, 640 exercises).
- Only **16 (locked)** and **17 (client list)** are reachable in the real app, from `src/app/(tabs)/studio.tsx`, and **17 shows the sample `CLIENTS` array** to a verified coach.
- The other 83 screens exist only in `/dev-preview`.

The UI-only list is in §6. **Accept when** you've confirmed it against the code, added anything missed, and given Kevin a short proposal: what to wire in Phase 6 versus a follow-up, plus any backend pieces that don't exist yet. **Don't start wiring until Kevin picks.**

The one exception to raise first: the **55 call and link buttons are safety actions**. Propose wiring them first (`tel:18002525400`, `https://www.txabusehotline.org`, `tel:911`, via `expo-linking`), but get Kevin's OK.

### Task 5: Prepare for Kevin's review (no push)
- Make a short review note, which can live in the PR body later:
  - what changed;
  - the check results with counts;
  - a link or path to the 170 recaptured shots and a list of any screens that still differ from the mockups and why;
  - the UI-only proposal;
  - the open sign-offs (§4, "Before production").
- Ask Kevin whether to push the branch and open a PR. **Only if Kevin says so in the session:** push, open the PR against `main`, wait for CI to go green, then send Kevin the full PR URL (`https://github.com/kvnrd/fitness-app/pull/<n>`). Never merge.

---

## 4. Build rules to keep (restated; don't weaken)

- **Release check:** the build fails if `NOT SHIPPABLE` or `[DMCA agent` appears in shippable source (`npm run check:shippable`, in CI).
- **DMCA:** `DMCA_FORM_ENABLED = false`. Screens **53 / 53b** stay behind it, out of production navigation, until the designated agent is registered with the Copyright Office (17 U.S.C. §512(c)(2)) and the real 5.11 details replace the placeholder. 5.10 is the checkbox's accessibility label. **54 keeps 5.13 exactly** ("Accounts with repeated copyright problems can be closed."), with no 3-in-12 count on screen.
- **Repeat infringer:** 3 upheld copyright notices in 12 months closes the account (inclusive window). This is enforced in SQL and unit code, not in copy.
- **Hash matching:** `HASH_MATCHING_LIVE = false`. Enqueue is a no-op, demo videos aren't sent to a vendor, and the hash sentence stays off **56** (with 5.20 omitted) until the vendor is live.
- **Coach deletion** (America/Denver, calendar-day math with `date + integer`, so DST can't shift it):
  - computed **"Delete by {date}"** = trigger + 30;
  - **day 23**: reminder (6.10, push and in-app);
  - **day 31**: pause new clients plus a **trust-and-safety ticket** (6.11);
  - **day 45**: suspend (6.12, push and email, then shown in Studio). 6.12 cites the 30-day due date.
  - **Never show "45 days"** on coach screens. Day 45 is Kevin's enforcement step, not the Tex. Bus. & Com. Code §541.052(b) consumer deadline.
  - Sample: trigger Nov 17, 2026 → reminder Dec 10, due Dec 17, pause Dec 18, suspend Jan 1, 2027.
  - **Counsel or Kevin must sign off before production.**
  - Ending a relationship cuts coach access right away. A client's deletion request ends coaching and starts the same clock. Turning off sharing counts as a deletion request.
- **70e:** after the parent approves, **nothing reaches the coach** until the teen also agrees (`app.teen_coaching_share_active`, `private.maybe_start_teen_share`). If the teen declines or never agrees, nothing is shared.
- **Teen blocks or reports a coach:** the parent sees **only "Coaching ended"** (6.13, `parent_coaching_label`) on Parent Settings and billing, with no reason and no coach name in the title. Trust and safety may tell a parent more when the teen's safety requires it. That's an **admin-only override** (`set_parent_safety_notice`, `parent_safety_notices` admin-only RLS), never product copy. Report and block must work for 16–17s with no parent approval or delay.
- **Minors' data:** coaches never see a minor's weight, goal weight, health info or photos (enforced on the server, with negative tests). Sam's list and page say "16–17 · Weight isn’t shared · No photos".
- **Applications:** `apply_for_coach` requires a `consent_events` kind `coach_terms`. Applications go to a **manual review queue Kevin works himself**. Copy says "[Company] reviews every application." with no automated approval and no named reviewer.
- **Stripe Identity:** document-only (no selfie, no face data, no CUBI notice), restricted keys on the server only, never `EXPO_PUBLIC_*`.
- **Badges:** "Certification verified" only. "Verified" isn't a medical or dietetics license or a background check.
- **NSOPW:** a name match alone never denies. Use the neutral 2.11 notice and give the applicant a chance to respond. Never show registry details in the app. Re-check yearly.
- **Coach Terms, ToS and policies are [ATTORNEY] drafts.** Don't edit `src/legal/policies/*`.

**Before production (not your call; list these in the review note):**
- deletion date math sign-off;
- DMCA agent registration;
- NCMEC ESP registration;
- hash-match vendor;
- attorney review of the Coach Terms, ToS and policies;
- the app name and company placeholders.

### Gotchas
- **Intentional divergences from the mockups:**
  - **01** (Grove shows "Grove · Aurora", not the mockup's hard-coded "Midnight · Aurora");
  - the **DMCA placeholder line and NOT SHIPPABLE mark are left off 53/53b**;
  - **66b/68b** show a "LOCK SCREEN · ANNOTATION, NOT PRODUCT COPY" note instead of sample lock-screen dates.
- Phase 5b screen fixes **a776dae** and **c69abec** (equal-weight consent sheet buttons) live on this branch, not on main.
- **SQL tests need Postgres 17 as well as PGlite.** PGlite uses a pgcrypto stub; only pg17 exercises real encryption.
- The runner **drops schemas**, so `DATABASE_URL` must point at a database whose name ends in `_test`.
- `check:shippable` needs `rg` installed.
- Commits need `gitleaks` installed (pre-commit hook).
- `src/app/(tabs)/studio.tsx` still contains the old MVP `StudioEditor` / `AddExercise` code, which isn't routed. Leave it unless Kevin asks.
- `docs/phase-6-coach-studio.md` is the in-repo summary. Keep it in sync if rules change.

---

## 5. Screen-to-file map

Every ID renders through `src/studio/screens/Phase6Screen.tsx` (`PHASE6_SCREEN_IDS` plus a switch), which is registered in `src/onboarding/preview/registry.tsx`. Shared chrome is `src/studio/chrome.tsx`: Phase6Shell, SheetOverlay, GlassCard, SettingsRow, PrimaryButton, TextLink, Toast, EqualRow, SwitchRow, CheckRow, Field, CoachTabBar, AthleteTabBar and Banner.

| IDs | Component (variant prop) | File |
|---|---|---|
| 01 | BecomeACoachScreen | `src/studio/screens/ApplyScreens.tsx` |
| 02 | ApplyIntroScreen | ApplyScreens.tsx |
| 03 / 03b | AgeAttestScreen (`on`) | ApplyScreens.tsx |
| 04 | CertificationScreen | ApplyScreens.tsx |
| 05 | IdentityScreen | ApplyScreens.tsx |
| 06 / 06b / 06c | CoachTermsScreen (`on`, `nudge`) | ApplyScreens.tsx |
| 07 / 08 / 09 | ApplyPendingScreen / ApplyApprovedScreen / ApplyNeedInfoScreen | ApplyScreens.tsx |
| 10 / 11 | MinorsIntroScreen / AbuseTrainingScreen | ApplyScreens.tsx |
| 12 / 12b | AbuseAttestScreen (`on`) | ApplyScreens.tsx |
| 13 / 14 / 15 / 15b | MinorsPendingScreen / MinorsApprovedScreen / MinorsNotApprovedScreen / MinorsNameMatchScreen | ApplyScreens.tsx |
| 16 | StudioLockedScreen (**live** in the Studio tab for pending coaches) | `src/studio/screens/StudioScreens.tsx`, route `src/app/(tabs)/studio.tsx` |
| 17 / 17b / 18 | StudioClientsScreen (`banner`, `empty`) (**17 live** for verified coaches, sample data) | StudioScreens.tsx |
| 19 / 20 | ClientAdultScreen (`photos`) | StudioScreens.tsx |
| 21 | ClientTeenScreen | StudioScreens.tsx |
| 22 | EndRelationshipScreen | StudioScreens.tsx |
| 23 / 26 | PlanWeekScreen (`empty`) | StudioScreens.tsx |
| 24 / 25 | PlanDayScreen (`add`) | StudioScreens.tsx |
| 27 / 28 | TempoEditorScreen (`perSet`) | StudioScreens.tsx |
| 29 / 30 / 31 | ActivityScreen (`hidden`, `empty`) | StudioScreens.tsx |
| 32–35 | CoachPicksScreen (`add`, `full`, `empty`) | StudioScreens.tsx |
| 36 / 37 / 38 | LibraryBrowseScreen (`mine`, `empty`) | `src/studio/screens/LibraryScreens.tsx` |
| 39 / 40 | LibraryDetailScreen / EditCuesScreen | LibraryScreens.tsx |
| 41 / 42 / 43 | CreateBasicsScreen / CreateTrackingScreen / CreateDemoScreen | LibraryScreens.tsx |
| 44 / 45 / 46 / 47 | RecordDemoScreen / TrimDemoScreen / DemoPendingScreen / ClientViewCustomScreen | LibraryScreens.tsx |
| 48 / 49 / 50 | ReportVideoScreen / ReportReasonsScreen / VideoRemovedNoticeScreen | `src/studio/screens/SafetyScreens.tsx` |
| 51 / 52 | BlockUserScreen / BlockedListScreen | SafetyScreens.tsx |
| 53 / 53b / 54 | DmcaRequestScreen (`signed`) / DmcaReceivedScreen | SafetyScreens.tsx |
| 55 / 56 / 57 | SafetyReportingScreen / NcmecPolicyScreen / UploadsSuspendedScreen | SafetyScreens.tsx |
| 58 / 59 / 60 | AskCoachDeleteScreen / AskCoachDeleteConfirmScreen / AskCoachDeleteSentScreen | SafetyScreens.tsx |
| 61 | CoachDeletionRequestScreen | SafetyScreens.tsx |
| 62 / 62b / 62c | CoachDeletionConfirmScreen (`filled`, `ready`) | SafetyScreens.tsx |
| 63 / 64 / 65 | CoachDeletionDoneScreen / AccessEndedScreen / CoachSettingsNoExportScreen | SafetyScreens.tsx |
| 66 / 66b | DeletionReminderScreen / DeletionReminderPushScreen | SafetyScreens.tsx |
| 67 / 68 / 68b | DeletionOverdueScreen / AccountSuspendedScreen / SuspensionPushScreen | SafetyScreens.tsx |
| 69 | ParentCoachingEndedScreen | SafetyScreens.tsx |
| 70 / 70b | TeenRegistryDisclosureScreen / ParentRegistryDisclosureScreen | SafetyScreens.tsx |
| 70c / 70d / 70e | CertVerifiedTeenScreen / CertVerifiedParentScreen / ParentApprovalPendingScreen | SafetyScreens.tsx |

**Logic and server files:**

| File | Purpose |
|---|---|
| `src/studio/phase6Flags.ts` | DMCA and hash flags |
| `src/studio/deletionDates.ts` | Deletion calendar |
| `src/studio/copyrightStrikes.ts` | 3-in-12 rule |
| `src/studio/stripeIdentity.ts` | Document-only, server-key guard |
| `supabase/migrations/20261117001900_phase6_coach_studio.sql` | Flags, `hash_match_queue`, `deletion_schedule`, `coach_deletion_requests`, `trust_safety_tickets`, `end_coach_relationship`, `request_coach_deletion`, `confirm_client_deletion`, `process_deletion_deadlines`, `copyright_notices`, `apply_for_coach`, `teen_coaching_approvals`, `parent_approve_teen_coaching`, `teen_agree_teen_coaching`, `parent_safety_notices`, `parent_coaching_label`, `coach_can_see` |
| `supabase/tests/phase6.sql` | SQL tests |
| `tests/unit/phase6Rules.test.ts` | Unit tests |

---

## 6. UI-only controls (no handler and/or no backend at 2c2eddc)

This list was identified from the code. "No handler" means the control does nothing when tapped. "No backend" means there's no RPC, table, edge function or job for it yet.

**App-wide**
- Studio tab (17) shows a hard-coded `CLIENTS` sample list (Kevin, Maya Chen, Jordan Lee, Sam) to verified coaches. It needs a real client query that goes through `coach_can_see`.
- 83 of 85 screens aren't reachable from app navigation. There are no routes for apply, minors, client pages, plan, library, safety, deletion or parent screens.

**Apply (01–09)**
- "Start application" / "Not now" on 01 and 02 have no handlers.
- Age switch (03) uses `onValueChange` noop.
- Issuer list and credential number field (04) are display-only, not inputs. **There's no certification lookup backend.**
- "Start identity check" (05) does nothing. **There's no Stripe Identity edge function or webhook**; only the key and config guard exists.
- Coach Terms checkbox and "Agree and apply" (06/06c) aren't wired. The `apply_for_coach` RPC exists, but it's only called from the older SetupFlow (`src/onboarding/api.ts`).
- "Open Studio", "Edit and resubmit" and the status screens are static. **There's no admin review queue UI or backend for Kevin** to approve, deny or request info.

**Minors (10–15b)**
- "Start training", "Continue module 2" and the attestation switch (12) do nothing. **There's no training-module content or progress tracking.**
- **There's no NSOPW search, reviewer log or yearly re-check job.** Pending, approved, not-approved and name-match states are static.

**Studio and clients (16–35)**
- "Keep coaching" / "End and delete copies" (22) have no handler. `end_coach_relationship` exists but isn't called.
- Plan week/day and the add-exercise chooser (23–26) aren't wired. **There's no Phase 6 plan-editing backend for a coach editing a client's plan**; earlier `plans`/`plan_days` tables exist.
- Tempo editor and per-set tempo, plus the "Lock tempo" switch (27/28), have no backend.
- Activity feed (29–31) is static.
- Coach picks, "Add from library · n of 20" (32–35): **no picks table.**

**Library and demos (36–47)**
- Search, equipment filter and Clear (36/37) are static `Pressable`s with no behavior.
- Edit cues, Add cue and Reset to default (40) have no backend for coach cue overrides.
- Create flow (41–43): Name field, metric chips and "Continue" / "Save draft". **There's no custom-exercise table.**
- Record demo (44), trim (45), "Loop for clients" / "Sound off" switches and "Use this demo". The switches use `onValueChange={() => …}` stubs. **There's no camera capture, upload, video storage or allowlisted playback.**
- Demo pending (46) has no moderation queue. Hash enqueue exists but is flag-off.
- "Report this video" link (47) has no handler.

**Safety (48–57)**
- Report reasons and "Choose a reason" (48/49) have no handler. **There's no reports table or trust-and-safety intake.**
- Block (51) and blocked list (52) have no handler. **There's no blocks table.** Block must end coaching and start the 30-day clock.
- DMCA form fields, signature and "Submit request" (53/53b) are display-only. They're behind the flag either way, and there's no submission backend. "Send a counter-notice" (54) has no handler.
- **55: "Call 1-800-252-5400", "Report online at txabusehotline.org", "Call 911", "View reporting training" and "Tell [App] too" have no handlers.** These are safety-critical (see task 4).
- 56 "Got it" and 57 "Back to library" / "Contact support" have no handlers.

**Deletion and parent (58–70e)**
- Ask coach to delete, "Send request" and "Download my data" (58–60) have no handlers. `request_coach_deletion` exists but isn't called.
- Itemized Deleted/None rows, attestation switch, "I’ll do this later" and "Confirm deletion" (62–62c) have no handlers. `confirm_client_deletion` exists but isn't called.
- "Confirm deletion" on 67/68 has no handler.
- Reminder and suspension **push/email (66b/68b): there's no push or email sender and no scheduler** that runs `process_deletion_deadlines` daily. The SQL function exists; there's no cron entry in `ops/`. The email vendor (Resend) is still unconfirmed.
- "Approve coaching" / "Not now" (70b) and the 70e teen agree step aren't wired. `parent_approve_teen_coaching` and `teen_agree_teen_coaching` exist.
- "What certification verified means" (70/70b) is a `TextLink` with no handler. 70c/70d are static sheet variants.
- 69 parent label is static. `parent_coaching_label` exists.

---

## 7. Checks required before asking Kevin to push

Run all of these on the branch tip and report the counts:

```bash
npm ci
npm run typecheck
npm run check:shippable
npm run test:unit                                   # expect >= 212, 0 fail
(cd supabase/functions && npm test)                 # expect >= 63, 0 fail
(cd supabase/functions && npx tsc -p tsconfig.json)
(cd supabase/tests && npm install && node run.mjs)  # PGlite, expect >= 1101, 0 fail
DATABASE_URL=postgres://$USER@localhost:5432/fitness_test node supabase/tests/run.mjs   # Postgres 17, same count
gitleaks detect --source . --log-opts="--all" --redact --no-banner
git diff 1ba83c7 --stat -- src/legal/policies    # must be empty: legal text untouched
```

Also:
- Recapture **all screens you touched, in both themes**, check them by eye (CLAUDE.md §4), and compare them with the mockups.
- Confirm no new dependency was added without Kevin's OK (`git diff 1ba83c7 -- package.json package-lock.json`).

---

## 8. Definition of done (Phase 6)

- [ ] Every check in §7 passes locally, with counts reported.
- [ ] All 85 screens are recaptured in Midnight and Grove, checked by eye, and match the mockups apart from the listed intentional divergences.
- [ ] 55, 56, 65, 40, 42 and 13 meet task 2's acceptance criteria.
- [ ] Grove cards on pale sheets (62/62b/62c, 45, 47) are at least 3:1, with a test.
- [ ] The UI-only list (§6) is confirmed, and Kevin has picked what's wired in Phase 6. Whatever he picked is wired, with tests (including negative tests for any coach-facing data).
- [ ] The §4 build rules are intact: flags off, check:shippable in CI, no "45 days" on coach UI, 70e sharing off until the teen agrees, parent sees only "Coaching ended", minors' data never reaches coaches, and the weight goal never reaches Anthropic.
- [ ] No edits to `src/legal/policies/*`, no invented copy, no secrets, no ad SDKs.
- [ ] The review note is ready for Kevin. Kevin decides on push and PR. If a PR is opened, CI is green and Kevin has the full PR URL. Nothing is merged.
