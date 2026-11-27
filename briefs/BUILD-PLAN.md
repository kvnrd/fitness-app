# Fitness app: full build plan

> **Updated Nov 17, 2026, 6:45 PM MST.** Converted from the build plan Page "Fitness app build plan v1", last fully revised Nov 15, 2026. The top sections (status, phases, pending steps, decisions since Nov 15) reflect today. The detailed plan below them is carried over as written on Nov 15. Where a later decision replaced something, it's marked **[Superseded]** inline. When this file and `CLAUDE.md` disagree, `CLAUDE.md` and the phase brief win.
>
> Repo: GitHub `kvnrd/fitness-app` (private). `main` = `1ba83c7`. Nothing is deployed to production or the stores.
> Working mode, in Kevin's words: "Build through the plan, review me at the end of each phase."

## Where things stand (Nov 17, 2026)

| # | Phase | Status | PR / commit |
|---|---|---|---|
| 0 | Security fixes | **Merged** Nov 15 | PR #3 (`26b55c8`) |
| 1 | Theme in code (v2 Carbon/Concrete/Champagne) | **Merged** Nov 15 | PR #2 (`ce4ea21`) |
| 1+ | Aurora theme (Midnight / Grove / custom color wheel), then Aurora as default | **Merged** Nov 16 | PR #9 (`f2e5be7`), PR #11 (`a9d84c4`) |
| 2 | Auth, backend, roles and consent (Supabase) | **Merged** Nov 15 | PR #4 (`26cf92d`) |
| 2b | Legal changes to Phase 2 | **Merged** Nov 15 | PR #5 (`68052b9`) |
| 3 | Onboarding | **Merged** Nov 16 | PR #6 (`f8a85d7`); privacy-screen fix PR #8 (`1eae3e9`) |
| 4 | Core training and AI plan with health screen | **Merged** Nov 16 | PR #7 (`1b4f487`); CI SQL-test fix PR #10 (`1b7f2e2`) |
| 5 | Progress and photos | **Merged** Nov 17 | PR #12 (`f6f7e5c`) |
| 5b | Photo import, workout recap, teen weight | **Merged** Nov 17, **now `main`** | PR #13 (`1ba83c7`) |
| 6 | Coach Studio, verification, moderation | **In progress.** Local branch `phase-6-coach-studio` at `2c2eddc`, **not pushed**. All checks pass (typecheck, functions tsc, check:shippable, unit 212, functions 63, SQL 1101 on PGlite and Postgres 17, gitleaks). Remaining work is in `briefs/phase-6.md` | none yet |
| 7 | Form check | **In progress.** Parts 1–2 (analysis logic, server tables, native pose module, dev lab) in PR #22; screens wait for copy. See `docs/phase-7-form-check.md` | |
| 8 | Messaging and live check-ins | Not started | |
| 9 | Paywall and in-app subscriptions | Not started | |
| 10 | Trainer catalog, 1:1 Stripe and B2B | Not started | |
| Later | Run tracking (precise GPS, route map) | Backlog, after launch | |

Order and dependencies: see "Phases at a glance" below. Each phase is built on its own branch and merged only with Kevin's OK.

## Needs Kevin

### Pending manual steps (current)
- [ ] Check Anthropic US-only data processing in the Anthropic Console
- [ ] Create the Supabase project(s) and pick a plan tier (this also settles Supabase log retention)
- [ ] Pick the app name (bundle ID, store listing, trademark search; replaces "[App]")
- [ ] Confirm the email vendor (Resend) for sign-up codes, parent invites, and deletion reminder and suspension emails
- [ ] Pick the arbitration provider: AAA or JAMS (arbitration itself is decided: yes)
- [ ] Company details later: Texas LLC name and details (replaces "[Company]")

### Manual steps from the Nov 15 plan (not re-checked since; may overlap the list above)
- [ ] Form the Texas LLC (Form 205 on SOSPortal, $300, https://www.sos.state.tx.us/corp/instructions/205.shtml), before the developer and Anthropic accounts
- [ ] Supabase dev and production projects, plus a signed DPA, before real user data
- [ ] Apple Developer account and Google OAuth client, under the LLC, before sign-in on a test build
- [ ] AWS account for the KMS that wraps the per-user data keys (region us-west-1), before real user data
- [ ] Anthropic account under the LLC. Keep PDFs of the Commercial Terms and DPA as accepted. Request zero data retention (ZDR) from Anthropic sales. Consent Version B ships until ZDR is confirmed in writing
- [ ] Turn on GitHub secret scanning, push protection and branch protection on `main`
- [ ] Attorney review of everything marked [ATTORNEY]:
  - Privacy Policy, Consumer Health Data Privacy Policy, ToS and Coach Terms (all drafts in `src/legal/policies/`)
  - consent wording (Anthropic Version A and B)
  - parent verification and retention periods
  - the KMS design
  - the MHMDA processor question
- [ ] Phase 6 production sign-offs:
  - coach-deletion date math (day 23 reminder, day 30 due, day 31 pause, day 45 suspend; America/Denver)
  - register the DMCA agent with the Copyright Office
  - register with NCMEC as an electronic service provider
  - pick a hash-matching vendor

### Open decisions
| Decision | Needed by | Status |
|---|---|---|
| Which Phase 6 UI-only controls get wired now vs later (list in `briefs/phase-6.md` §6) | Phase 6 review | Open |
| Push `phase-6-coach-studio` and open a PR | After Phase 6 checks and review | Kevin's call |
| Which Claude model (set by env; must not be a Covered Model while on ZDR; the code refuses Fable/Mythos under ZDR) | Before production AI | Open |
| Which licensed demo-video library to buy | Phase 6 / launch | Open (not re-checked) |
| Live video or voice provider for check-ins | Phase 8 | Open |
| Messaging: broadcast cap, read receipts, retention after coaching ends | Phase 8 | Open |
| RevenueCat or own store integration; Family Sharing for Pro; Free chart ranges (1M + 3M, or 3M only) | Phase 9 | Open |
| Platform cut (recommended 15% on catalog 1:1) and whether it's refunded with a coaching refund | Phase 10 | Open |
| What a 1:1 client without Pro gets (proposal: Free features plus the coach's content) | Phase 10 | Open |
| B2B prices (Solo, Studio, Gym) | Phase 10 | After trainer talks |
| When to add the US web checkout | After launch | Open |
| Legal open questions: licensed providers, meal plans, coaches outside TX/US; web checkout timing and year-one revenue; marketing claims and data retention; legal and tax budget | Varies | Open |
| Whether a pre-workout weather card counts as "real-time weather guidance" (Apple's notice in the Terms) | Before launch | Open [ATTORNEY] |

## Decisions made since the Nov 15 plan

These close or replace items in the detailed plan below.

- **Teen weight (16–17):** weight works the same as for adults, including goal weight (Lose / Maintain / Gain). It needs both health opt-ins. With either off, no weight is stored, including Apple Health and Garmin sync. *Replaces* "no weight-loss, calorie or body-fat goals for minors", "teen body-weight card hidden" and "body weight hidden from coaches by default".
- **Teen safeguards 5–7 declined:** "None of the teen safeguards."
- **Still in force for teens:**
  - Coaches never see a minor's weight, goal weight, health info or photos (server-enforced).
  - "Lose fat" stays an adults-only training goal.
  - The teen AI safety filter is required by Anthropic's usage policy: no pro-eating-disorder content, no supplement suggestions. Ordinary calorie and weight-loss advice is allowed legally, but the current code filter is stricter for teens and also blocks it. Leave it unless Kevin decides otherwise (see `CLAUDE.md`).
- **Teen streaks:** "Teens get adult streaks", meaning the planned-workouts streak shown only at 2+ weeks. Strings 40, 42 and 43 are retired. No loss copy for anyone.
- **Parent safety exception kept:** after a teen blocks or reports a coach, the parent sees only "Coaching ended". Trust and safety may tell the parent more when the teen's safety requires it.
- **"Lose fat":** kept as an adult goal (closes the Phase 4 open item).
- **e1RM:** Epley, `load × (1 + reps/30)`, only for sets of 10 reps or fewer, labeled "Est. 1RM" (closes the Phase 5 open item; Brzycki stays in code as a setting).
- **Progress photos:** 18+ only. 16–17s see a disabled "Available when you turn 18." row. Import uses the system picker only, and metadata is stripped.
- **Approximate location:** used only for local weather on outdoor cardio, through Apple WeatherKit REST. Rounded to about 1 mile, never stored, with attribution required. No run GPS or maps in v1.
- **Analytics:** PostHog (12 months) and Sentry (90 days), public keys only, no user ID; crash reports only for teens. No ad SDKs, ever (closes the analytics open item).
- **Wearables:** Apple Health and Garmin only (workouts, heart rate, steps, active energy, body weight). No sleep and no Health Connect.
- **Hosting/KMS region:** AWS us-west-1.
- **Arbitration:** yes (provider still to pick).
- **Coach Terms deletion clause:** yes. Coaches delete client data within 30 days; there's no parent export.
- **Themes:** v2 (Carbon/Concrete/Champagne) and Aurora (Midnight dark / Grove light / custom color wheel). Aurora Midnight is the default.
- **Phase 6 decisions:**
  - the parent sees only "Coaching ended" after a teen blocks or reports a coach;
  - a coach who doesn't confirm deletion is paused on day 31 and suspended on day 45;
  - 3 upheld copyright notices in 12 months closes an account;
  - Stripe Identity is document-only (no selfie);
  - **Kevin reviews coach applications himself** (closes "who reviews coach applications");
  - 16–17 coaching sharing turns on only after both the parent approves and the teen agrees.
- **Tabs:** Home, Train, Progress, Profile, plus Studio for coaches (closes the Phase 4 retab question).
- **Phase 3 open items** (Prefs Apple Health card wording, risk card checkbox vs button, teen progress bar) were settled in the Phase 3 build (PR #6). See the code.

---

# Detailed plan (carried over from Nov 15, 2026)

**Sources of the Nov 15 plan:**

- GitHub kvnrd/fitness-app (PRs #1–#5 at the time; PR #1 closed unmerged)
- Design notes on onboarding, tempo, favorites, swap, studio library, form check, monetization, features, messaging, photos, progress and motion (not in this handoff)
- The Paper design file and its build log
- Monetization notes and pricing research (consumer tiers decided Nov 15, 2026)
- Legal review rounds 1 and 2 (Nov 15, 2026) and Kevin's answers
- Phase 2 legal answers: `briefs/reference/legal/phase2-legal-answers.md`
- Phase 3 legal review: `briefs/reference/legal/phase3-review.md`
- Phase 4 legal review: `briefs/reference/legal/phase4-review.md`
- Phase 4 design handoff: `briefs/reference/phase4-design-handoff.md`
- Privacy Policy and Consumer Health Data Privacy Policy: now in `src/legal/policies/` (don't edit)
- Later legal reviews (Phase 5, 5b, 6): `briefs/reference/legal/phase5-review.md`, `phase6-review.md`, `coach-terms.md`

## Security gaps found in the original MVP (Nov 15)

- **`.gitignore` doesn't block plain env files** _[Phase 0]_: It ignores `.env*.local`, `*.key`, `*.p8`, `*.p12`, `*.pem` and `*.jks`, but not `.env`, `.env.production`, service-account JSON or keystores. No secrets are in the repo today.
- **Studio is open to everyone** _[Phase 0 + 2]_: Studio is a normal tab in `src/app/(tabs)/_layout.tsx`, so anyone can edit or delete the program. Today that only touches mock data, but it has to be fixed for real before any backend goes live.
- **Video links aren't checked** _[Phase 6]_: `VideoHero` passes any URI to the player. When uploads arrive, only our own storage should be allowed.

Status now: the `.gitignore` and secret-scanning fixes shipped in Phase 0. Studio is role-gated on the server since Phase 2 (the Studio tab shows only for coaches). Video-source allowlisting is still open; it comes with Phase 6 uploads.

## Guiding principles

1. Security comes first. A phase that touches data doesn't ship until its access rules are written and tested.
2. The server enforces access. The app only hides things for a cleaner screen, and every real check (role, tier, coach relationship, age, consent) happens in the database or on the server.
3. Least privilege. Each role sees only what it needs. Coaches see a client's data only during an active 1:1 relationship, and only what the client chose to share. Admin keys never ship in the app.
4. Health data is sensitive. It's encrypted and needs its own opt-in. It stays out of analytics, logs and ads, is never sold, and users can delete it.
5. Design first. Every screen goes into Paper before it's coded, and the code follows the approved design and notes.
6. Nothing ships without you. Every change goes on a branch and opens as a PR for you to review. You decide what gets merged or published.

## Recommended architecture

### Backend options

|  | Supabase | Firebase | Custom |
|---|---|---|---|
| Database | Postgres (relational) | Firestore (documents) | Your choice |
| Access rules | Row-level security in SQL | Security Rules | Hand-written |
| Auth | Apple, Google, email built in | Apple, Google, email built in | Build or buy |
| Fits coach/client data | Strong (joins, roles) | Weaker (many joins) | Strong |
| Lock-in | Low (plain Postgres) | High | None |
| Effort | Low | Low | High |

> **Pick: Supabase** Coach, client, gym, plan and relationship data is relational, and row-level security lets the database itself enforce rules like "a coach sees body weight only if the client shared it". It covers sign-in, private file storage with short-lived links, and server functions, and it's plain Postgres, so we can move off it later. The README and onboarding notes already assume it. The legal review requires a data processing agreement (DPA) with Supabase.

### Sign-in

- Sign in with Apple using the native button, which Apple requires when Google sign-in is offered. Plus Google sign-in and email with a 6-digit code.
- PKCE for every redirect. Sessions stored in the phone's secure keychain (`expo-secure-store`), never in plain storage.
- Passwords at least 12 characters, checked against known breached passwords, with no forced rotation. Rate limits on every sign-in and code step.
- Generic error messages that never reveal whether an email has an account. Account deletion in the app, including revoking the Apple token.

### Roles and permissions

| Role | Can do | Granted by |
|---|---|---|
| Athlete | Own data only: plans, logs, photos, favorites | Signing up (16+) |
| Coach (pending) | Same as athlete. Studio locked | Applying in onboarding |
| Coach (verified) | Studio. Clients' plans and shared data during an active 1:1 | A reviewer, after checking the certification with the issuer's lookup tool (NASM, ACE, ACSM, NSCA), or a valid trainer code. Server-side only |
| Gym admin | Manage the gym's trainers and seats | B2B contract (Phase 10) |
| Platform admin | Approvals, moderation, with every access logged | You, manually |

The app never writes a role. Roles live in a server table and reach the database as a signed claim. Ending a coach relationship cuts off access immediately, and coach reads of sensitive data are logged. The app explains what "verified" means, and coaches can't use the title dietitian.

### Protecting health data

- In transit: HTTPS/TLS everywhere, with no plain HTTP.
- At rest: the provider's disk encryption, plus field-level encryption for the most sensitive fields (injury notes, health-screen answers).
- Keys: envelope encryption with a data key per user, wrapped by an external KMS (AWS or GCP) and called only from the server. The database never holds usable keys (decided).
- Consent: separate, explicit opt-ins for health data, sending data to the AI vendor, and coach sharing, each stored with its version and time. Adult progress photos need their own opt-in the first time they're used. Minors need both their own and the parent's opt-in, including before a coach can see a minor's form-check numbers.
- Revoking health-data consent deletes the health fields within 30 days by destroying the user's data key.
- Progress photos: adults give a separate opt-in the first time they're used. Encrypted on the phone before upload, kept in a private bucket, served through links that expire within 5 minutes, and stripped of location data. No face recognition. No photos for users under 18.
- Form check: pose analysis stays on the phone, face landmarks are thrown away, and cues stay rule-based for now (LLM cues are deferred; they aren't covered by the AI consent).
- Health data is never sold. It stays out of analytics, crash reports and push previews. AI prompts carry no personal details.
- A breach-response plan covering the FTC Health Breach Notification Rule and Texas law (Texas Bus. & Com. Code ch. 521), including notice to the Texas AG within 30 days if 250 or more Texans are affected (§521.053(i)). There's also a separate consumer health-data privacy policy.

### Payments

- **Consumer tiers (decided):** Free; Pro at $12.99/month or $69.99/year with a 7-day trial; Coach Program (coach-set price, includes Pro); 1:1 Coaching (coach-set price). Trainer-code clients are covered by their trainer's B2B plan.
- **Pro and Coach Program (approved):** Apple and Google in-app purchase only at launch. Enroll in Apple's Small Business Program and Google's 15% tier before the first sale. The optional $59.99 first-year promo can show only if it clearly says it renews at $69.99.
- **US web checkout (later, approved):** Added after launch, with in-app purchase kept alongside it. Apple's US link-out fee is 0% today but may become 5–15% (Apple's Aug 13, 2026 proposal; Epic v. Apple No. 25-1311 is at the Supreme Court). Android US uses Google's alternative-billing or external-link programs, which carry their own fees. It must follow ROSCA and California's auto-renewal law: express consent, online cancellation, and notice before a price change.
- **1:1 Coaching (approved):** Stripe charges only for the human coaching: the coach's plan, chat, check-ins, coach reviews, and new scheduled live video or voice check-ins. AI plans and Pro are bought separately through in-app purchase. The coach is the seller of record through Stripe direct charges (decided), so the coach covers refunds and chargebacks. Stripe handles identity checks and 1099-Ks. App Review notes explain why. If that fails, the fallbacks are the iOS US link-out and Google's US alternative billing.
- **Coach prices:** $79/month is a suggested price for 1:1, not a minimum. Caps stay only as anti-fraud ceilings. The Coach Program minimum stays. Every coach needs a Stripe connected account. Coaches must be 18+ (self-attested). **[Nov 17: "Stripe requires coaches to be 18+" was flagged as unverified and removed from product copy.]**
- **Buyers aged 16–17:** A parent consents and is the contracting party and the Stripe customer, because minors' contracts can be voided and store consent doesn't cover Stripe.
- **Platform cut (recommended, not decided):** 15% on catalog 1:1 through Stripe, plus Stripe's 2.9% + 30¢. No extra cut for trainers on a paid B2B plan billing their own trainer-code clients. Whether the 15% is refunded along with a coaching refund is still open.
- **1:1 client without Pro (open):** Proposal: the Free features plus the coach's content (plan, chat, check-ins, reviews and live sessions). Not decided yet.
- **B2B seats:** Solo, Studio and Gym plans billed to trainers on the web with Stripe Billing. Card data never touches our servers.

### Form check on the phone

MediaPipe Pose Landmarker runs on the phone, so video never has to leave it for analysis, and face landmarks are thrown away (legal review, for Texas and Illinois biometric laws). It's free and open source (Apache-2.0). It needs an Expo development build instead of Expo Go, and the community plugin the notes found targets SDK 57, so check that it works on SDK 58 before Phase 7.

### Other services

- AI plans are generated on the server only, using Anthropic (Claude), after a health screen (never labeled PAR-Q+) and the AI-vendor opt-in, which names Anthropic. They use a fixed prompt and schema, output is checked against our exercise library and safety rules, no personal details are sent, and Anthropic's automatic DPA applies. Anthropic doesn't train on our data, deletes it within 30 days by default (flagged requests up to 2 years), and keeps nothing after replying only under ZDR. See AI vendor: Anthropic.
- Media goes in private storage behind signed links. Exercise demos start from a licensed library, as you decided.
- Push notifications through Expo Notifications, with no health details shown in the preview.

## Phases at a glance

_Size is a rough relative estimate: S is days, M is about one to two weeks, L is several weeks of build work plus your reviews._

| # | Phase | Needs | Size |
|---|---|---|---|
| 0 | Security fixes | None | S |
| 1 | Theme in code: tokens, dark/light, accents | 0 | M |
| 2 | Auth, backend, roles and consent | 0, backend choice | L |
| 3 | Onboarding: training style, 3 paths, opt-ins | 1, 2 | M |
| 4 | Core training, AI plan with health screen | 3 | L |
| 5 | Progress and photos | 4 | M |
| 6 | Coach Studio, verification, moderation | 2, 4 | L |
| 7 | Form check | 4, dev build | L |
| 8 | Messaging and live check-ins | 6 | M |
| 9 | Paywall and in-app subscriptions | 4 | M |
| 10 | Trainer catalog, 1:1 Stripe and B2B | 6, 8, 9 | L |
| — | Later: run tracking (precise GPS, route map) | After launch | M |

```
0 Security -> 1 Theme
0 Security -> 2 Auth & roles
1 Theme -> 3 Onboarding
2 Auth & roles -> 3 Onboarding
3 Onboarding -> 4 Core training
4 Core training -> 5 Progress
4 Core training -> 6 Studio
4 Core training -> 7 Form check
4 Core training -> 9 Paywall
6 Studio -> 8 Messaging
8 Messaging -> 10 Catalog & B2B
9 Paywall -> 10 Catalog & B2B
```

Phases 1 and 2 can run side by side, and so can 5, 6, 7 and 9 once core training is done. Review them one at a time. **Status (Nov 17):** Phases 0–5b are merged (`main` = `1ba83c7`). Phase 6 is on local branch `phase-6-coach-studio` at `2c2eddc` (not pushed). Phases 7–10 haven't started. Nothing is deployed.

## Phase details

### Phase 0 · Security fixes (S)

- **Scope:** Add `.env`, `.env.*` (keeping `.env.example`), keystores, service-account and credential JSON, and Supabase local folders to `.gitignore`. Add a secret scanner (gitleaks) as a pre-commit hook and a GitHub check. Hide the Studio tab behind a dev-only flag so no build ships it open. Add a typecheck CI job.
- **Depends on:** Nothing.
- **You review:** The `.gitignore` diff, the hidden Studio tab, and whether to turn on GitHub secret scanning and branch protection on `main` (repo settings only you can change).
- **Note:** Hiding the tab is a stopgap and doesn't count as security. The real fix is server-side role checks in Phase 2.
- **Status:** Merged into `main` with PR #3 (https://github.com/kvnrd/fitness-app/pull/3, `26b55c8`). Not deployed.

### Phase 1 · Theme in code (M)

- **Scope:** Replace the Iron & Chalk tokens with the v2 set from Paper: Carbon (dark) and Concrete (light), Champagne `#D9C08A` as the default accent, Brushed Gold `#C9A24A` only for PRs, the seven accents plus Custom from `theme_accents.json`, and the Barlow Condensed and Inter Tight fonts. Add a theme provider with system, dark and light modes, and an accent picker that blocks colours failing AA contrast. Add motion tokens and Reduce Motion support from the motion spec. Restyle the existing screens.
- **Depends on:** Phase 0.
- **You review:** Screenshots of the existing screens in both modes and a few accents, next to the Paper boards, plus the contrast report.
- **Status:** Merged into `main` with PR #2 (https://github.com/kvnrd/fitness-app/pull/2, `ce4ea21`), including the glow. The Aurora theme followed in PR #9 (`f2e5be7`) and became the default in PR #11 (`a9d84c4`). Not deployed.

### Phase 2 · Auth, backend, roles and consent (L)

- **Scope:** A Supabase project (separate dev and production) under a signed DPA. Schema for profiles, roles, coach relationships, gyms, plans, workouts and logs. Row-level security on every table, with automated tests that try to read across accounts and must fail. Sign in with Apple, Google and email. Secure session storage. Server functions for coach applications and trainer-code redemption. A consent table for the separate opt-ins (health data, AI vendor, coach sharing, parental consent), each with version and time. Parent accounts linked to minor accounts. Store age data is deleted after the check, and only a derived minor flag is kept. Accounts found to be under 13 are closed and deleted (COPPA). Account deletion and data export. Audit logging to support the breach-response plan. Move the in-memory store onto the database. Studio unlocks only for a verified coach role from the server.
- **Depends on:** Phase 0, and your backend choice.
- **You review:** First a short written data and permissions spec, before any code. Then the PR with the access-rule test results, and a walk-through of sign-up on a test build.
- **Setup you do:** Create the Supabase, Apple Developer, Google Cloud and KMS (AWS or GCP) accounts yourself and keep the keys. The legal review says the developer accounts should sit under the Texas LLC, so it's best to form the LLC before opening them. Tools and services get only the keys they need, through environment settings, never in the repo.
- **Status:** Phase 2 merged with PR #4 (https://github.com/kvnrd/fitness-app/pull/4). Phase 2b, the legal decisions below, merged with PR #5 (`68052b9`, Nov 15, 9:11 PM MST). Not deployed. Real user data still waits on your Supabase production project, DPA and AWS KMS account.

#### Phase 2 legal decisions (answers to the 12 Phase 2 legal questions)

General legal information, not formal legal representation. Items the legal review marked for attorney review are noted. Full answers: `briefs/reference/legal/phase2-legal-answers.md`.

- **Encryption keys in an external KMS (key custody decided)** _[Decided]_: Keys in the same database undo the encryption: the FTC rule counts data as unsecured unless keys are stored separately, and Texas breach law covers encrypted data when the key goes with it. So: envelope encryption with one data key per user, each wrapped by an external KMS (AWS or GCP) and called only from a server function. The database holds only ciphertext and wrapped keys. Supabase Vault is fine for secrets but not as the only protection for health data, and pgsodium is being deprecated. Needs attorney and security sign-off.
- **Date of birth first, with no age hints** _[Decided]_: Ask for date of birth before email or creating the auth account. No default date and no "you must be 16" before entry (COPPA neutral age screen). After a rejection, show only "Sorry, you can't use [App]. Nothing you entered has been saved.", with no age, threshold or retry, and set a device flag with no personal data so the user can't retry with another date.
- **Age = the lower of the store signal and the date of birth** _[Decided]_: Read Apple Declared Age Range or Google Play Age Signals wherever the store says they apply (SB 2420 §121.054; Utah requires the lowest age; California AB 1043 treats a signal as actual knowledge). Delete the raw store response after verification and keep only the age band, its source and a timestamp.
- **No raw date of birth** _[Decided]_: Store an age band plus an `adult_on` date, which flips a 16–17 user to adult at 18.
- **Pending minor accounts** _[Decided]_: A 16–17 account can exist before the parent links, holding only email, age band, `adult_on`, the parent's invite email and invite status. It can reach only the parent-link screen, and all writes are blocked on the server. Reminders on days 3 and 7, then the account and the parent's email are deleted on day 14. The parent's email is used only for the invite.
- **No purchases until the parent link is active** _[Decided]_: The paywall and in-app purchases are hidden for unlinked minors.
- **Minors need both opt-ins** _[Decided]_: For minors, each scope (health data, AI vendor, coach sharing) is on only when both the minor and the parent have turned it on, and either can turn it off. Accepting the parent link creates separate records for terms acceptance and for each scope, never bundled.
- **Parent verification** _[Decided]_: The parent's own account, an attestation of being an adult with legal authority, a Stripe card charge or $0 authorization in the parent's name, a matching store parent-consent signal where available, and Stripe Identity for 1:1 coaching (attorney to confirm it's enough). Keep the method and result ID, never raw card or ID images.
- **Opt-in screen rules** _[Decided]_: All switches start off. Next to each switch, before any collection: the data categories, purpose and uses, recipients, and how to withdraw. Separate switches for collecting and sharing. Equal-weight buttons, no nagging, and continuing with everything off still gives the free logging tier.
- **Parent visibility** _[Decided]_: The parent can see the minor's consent history, workout and training logs, and everything the coach sees. The minor sees a "parent can view" indicator and is notified whenever the parent changes a setting or consent.
- **Revocation and deletion** _[Decided]_: Revoking health-data consent stops processing and deletes the health fields within 30 days by destroying that user's data key, after a warning and an offer to export. Deletion requests are answered within 45 days, backups can lag up to 6 months, and every recipient, including the coach, is told to delete. Ending coach sharing cuts access immediately. Coaches get no export or download.
- **Coaches must be 18+** _[Decided]_: Coaches attest to being 18+, and the Stripe identity check must pass before approval.

| Record | Keep (attorney to review) |
|---|---|
| Consent grants and revocations | Account life + 4 years; minors at least until their 22nd birthday |
| Privacy-rights and deletion request logs | At least 24 months; 4 years recommended |
| Coach access audit logs | 2 years |
| Minor safety records | Until the minor's 22nd birthday or 4 years, whichever is later; litigation holds override |
| NCMEC report materials | 1 year after the report, secure and access-limited |
| Raw store age signal | Delete after verification |
| Rejected under-16 signups | No personal data |

### Phase 3 · Onboarding (M)

- **Status (Nov 17):** **Merged** with PR #6 (`f8a85d7`, Nov 16), plus the privacy-screen fix PR #8 (`1eae3e9`).
- **Order change (legal):** Date of birth comes before the email or any account is created, with no default date and no age hints. A rejected user sees only the generic notice.
- **Scope:** An 8-step flow with date of birth first, then sign-up and the approved steps: role, weight goal, training style (multi-select with one Main, plus follow-ups), your gym (equipment with max-weight steppers), and preferences. The adult weight goal stays on the device only until the Health data switch is on. One combined Privacy & safety screen: the health-data and AI switches start off, plus a risk card with a required checkbox (the legal review cleared it, you approved it). Age attestation for 16+, using Apple's Declared Age Range API and Google Play Age Signals. Conspicuous not-medical-advice and assumption-of-risk text, which the legal review says Texas requires to be express and conspicuous. Skip defaults. The three paths: trainer catalog (an entry point that opens in Phase 10), trainer code or invite link, or go solo.
- **Depends on:** Phases 1 and 2.
- **You review:** Each screen against Paper in both modes, including new screens for the opt-ins and risk text. Also the trainer-code security (unguessable, rate-limited, revocable, capped, and what happens when a client is dropped), and a full sign-up on a test device.
- **16–17 (decided):** SB 2420: Apple Declared Age Range (`isEligibleForAgeFeatures`) and Google Play Age Signals (`requestAgeSignalsAccess`, `checkAgeSignals`). Handle Apple `RESCIND_CONSENT` and Google revocation by locking the account's minor features. Parent consent before any of a minor's data goes to the AI vendor.

### Phase 4 · Core training (L)

- **Scope:** Tabs become Home, Train, Progress and Profile, plus Studio for verified coaches. Home dashboard, plan and week view, exercise library and detail with standard cues, and workout logging. Tempo, swaps, gyms (up to 5), favorites and Coach picks as designed. Server-side AI plan generation with Anthropic (Claude), behind a health screen (never labeled PAR-Q+) and the AI-vendor opt-in naming Anthropic (Apple 5.1.2(i)), following the legal review's build requirements in AI vendor: Anthropic (minimized prompts, backend-only calls, injury category only for avoiding or swapping exercises, and an eating-disorder and body-shaming output filter). Not-medical-advice text on the plan. No injury, accuracy or results claims in the app or the store listing.
- **Status (Nov 17):** **Merged** with PR #7 (`1b4f487`, Nov 16), plus the CI SQL-test fix PR #10 (`1b7f2e2`). Design handoff: `briefs/reference/phase4-design-handoff.md`. Phase 4 legal rulings: `briefs/reference/legal/phase4-review.md`.
- **Depends on:** Phase 3, the Anthropic account under the LLC, and a model choice checked against the Covered Models list.
- **You review:** Probably best split into 3 or 4 PRs (logging, tempo, swaps and gyms, favorites and AI plan), each with screenshots and a short test run.
- **16–17 (decided):** No weight-loss, calorie or body-fat goals for minors. Teen goal is "Build muscle" (strength framing; no bulking, calories, or supplements). Teen body-weight card hidden. **[Superseded Nov 17: teen weight and goal weight work as for adults; only "Lose fat" stays adults-only.]** Health screen is completed with the parent (never labeled PAR-Q+). After an uncleared yes, logging stays on and AI stays off; human coaching is allowed. Minor data stays out of AI prompts and analytics.

- Minor-safe goal list: approved.
- Health screen: approved. Never labeled PAR-Q+. Needs the Health switch. Clearance is a checkbox. Re-ask every 12 months or on injury edits.
- Blocked copy: approved. Log the reason code only.
- Teen goal is "Build muscle" (strength framing; no bulking, calories, or supplements).
- Teen body-weight card: hidden. **[Superseded Nov 17: teen weight works as for adults.]**
- After an uncleared health-screen yes: logging stays on and AI stays off; human coaching is allowed.
- Plan notice: always visible, and may shrink to a one-line footer after the first session.

### Phase 5 · Progress and photos (M)

- **Scope:** Weight, strength and cardio charts with server-computed numbers, the goal sheet, PR detection with input limits, and units. The adult weight goal and Free Home weight card stay on the device until the Health data switch is on. Progress photos with a separate first-use opt-in for adults, Face ID lock, on-phone encryption, location stripping, compare slider, opt-in sharing with a coach, no face recognition, and hidden entirely for under-18s. Uploads from 16–17 accounts are blocked on the server (decided).
- **Depends on:** Phase 4.
- **You review:** Charts against the designs, and a privacy check of photo storage: who can open what, how long links last, and that deletion works.
- **Status (Nov 17):** **Merged.** Phase 5 with PR #12 (`f6f7e5c`). Phase 5b (photo import, end-of-workout recap, PR celebration, teen weight and goal weight, coach-terms deletion clause) with PR #13 (`1ba83c7`, now `main`).

### Phase 6 · Coach Studio (L)

- **Scope:** Client list, plan builder, tempo editor, the Activity page, Coach picks (up to 20 per client), the coach exercise library with cue overrides, and 30-second custom videos in private storage behind signed links. Coach verification through the issuers' lookup tools. Report, block and filter tools (Apple 1.2), upload moderation, a DMCA takedown flow, NCMEC CyberTipline registration and reporting with 1-year preservation (18 USC 2258A), and a Texas DFPS reporting process (Fam. Code 261.101). For minor clients, body weight is hidden from coaches by default. **[Superseded Nov 17: coaches never see a minor's weight, goal weight, health info or photos.]** Video sources limited to our own storage.
- **Minor clients (decided):** No full background checks (a known risk). Before a coach is approved for minors: an NSOPW registry search and required Texas abuse-reporting training (Fam. Code 261.101). The platform carries insurance with an abuse and molestation endorsement. CSAM hash matching runs on any minor media that reaches the server.
- **Depends on:** Phases 2 and 4. Coach applications: Kevin reviews them himself (decided Nov 17).
- **Status (Nov 17):** **In progress.** Local branch `phase-6-coach-studio` at `2c2eddc` (base `main` `1ba83c7`), not pushed. All checks pass. Remaining work, build rules and the definition of done: `briefs/phase-6.md`.
- **You review:** Access tests showing a coach can't see non-clients, the verification and moderation flows, and a hands-on session as a test coach.

### Phase 7 · Form check (L)

- **Scope:** Switch from Expo Go to development builds. MediaPipe pose tracking on the phone with face landmarks thrown away: live rep count (free), plus angles, flagged reps, bar path and rule-based extra cues (Pro). LLM form-check cues are deferred; they aren't covered by the AI consent. Saved videos deleted after 90 days unless starred (20 stars max). Coach review only for the user's own 1:1 coach.
- **Depends on:** Phase 4, plus a check that the plugin works on SDK 58.
- **16–17 (decided):** Analysis happens on the phone only. Coaches see just the pose skeleton and metrics, never the raw video, and only after both the teen and the parent opt in. Minors' videos stay on the phone or are deleted automatically, and are never uploaded.
- **You review:** Accuracy on real sets on your phone, and the battery and heat after a session.

### Phase 8 · Messaging and live check-ins (M)

- **Scope:** 1:1 coach chat and coach broadcasts, with server-side encryption at rest, report and block, retention rules, text only for 16–17 year olds, and push notifications without health details. New: scheduled live video or voice check-ins between a coach and a 1:1 client, the real-time part of 1:1 that the approved payment model relies on.
- **Depends on:** Phase 6, plus a design pass in Paper for scheduling and the call screen, and a choice of video/voice provider.
- **16–17 (decided):** Minor chat safeguards are mandatory: safety filters with human review, 988 and NEDA resources, text only, parent-visible chat, no disappearing messages, no messages from 10 pm to 7 am, and off-platform contact blocked. Live sessions with minors: the parent is invited to every session, and nothing is recorded. Sessions stay in the app and are logged.
- **You review:** The open messaging questions first (below), the new check-in screens in Paper, then the PR.

### Phase 9 · Paywall and in-app subscriptions (M)

- **Scope:** Enroll in Apple's Small Business Program and Google's 15% tier before the first sale. RevenueCat setup, Pro and Coach Program products in App Store Connect and Play Console ($12.99/month, $69.99/year). The $59.99 first-year promo appears only with clear renews-at-$69.99 wording. Paywall with full disclosures and Restore, trial timeline and day-5 reminder, subscription management, and server-enforced Pro features. Store listings match the 16+ minimum: Apple age rating 16+, Google target audience 16–17 and 18+ only, and every in-app purchase rated 16+. Google Play health-app and Data safety declarations, and the Texas App Store Accountability Act (SB 2420). The paywall and in-app purchases stay hidden for minors until their parent link is active. In-app purchase only at launch. The US web checkout comes later, with ROSCA and California auto-renewal compliance.
- **Depends on:** Phase 4. Prices are decided.
- **You review:** Prices in the store consoles (only you can set them), a sandbox purchase, restore and cancel, and the store compliance checklist.

### Phase 10 · Trainer catalog, 1:1 Stripe and B2B (L)

- **Scope:** Trainer profiles, ratings and filters, with verified certification before listing. Reviews follow the FTC rule (16 CFR 465): no fake reviews and no hiding negative ones, and no review-gag terms. Stripe Connect with the coach as seller of record for 1:1 (direct or `on_behalf_of` charges). Stripe bills only the human coaching, and Pro stays separate in-app. $79/month shown as a suggested price, with anti-fraud ceilings. For a 16–17 year old, the parent consents, is the Stripe customer, and must re-consent to significant changes (catalog, 1:1, video sharing, live sessions) through PermissionKit Significant Change or Play Console, with the feature locked until then. Coaches must be 18+ (self-attested). Direct charges (decided), so refunds and chargebacks come out of the coach's balance. Refunds are handled by the coach, or by the platform via the `Stripe-Account` header. A standard client agreement: the parent can cancel anytime, prorated refunds, an immediate refund if a safety report is upheld, and no off-platform contact. App Review notes explaining the 1:1 model. The coach agreement flow. B2B plans (Solo, Studio, Gym) on Stripe Billing with a 30-day trial, and gym admin tools.
- **Depends on:** Phases 6, 8 and 9, your talks with trainers about B2B prices, and the coach agreement reviewed by a Texas attorney.
- **Open:** Whether the 15% platform fee is refunded with a coaching refund, and what a 1:1 client without Pro gets (proposal: Free features plus the coach's content).
- **You review:** The platform cut and B2B prices first, then the PRs, then a test payout in Stripe's test mode.

### Later · Run tracking (backlog, not in the current build)

- **Status:** Backlog, after launch. Not part of Phases 0–10.
- **Scope:** Run tracking with precise GPS and a Strava-style route map. Needs a separate precise and background location opt-in, plus privacy zones that hide each route's start and end. The rest of the app stays on approximate location, requested only when a feature needs it.
- **Legal:** Needs its own legal review for the policies and for teens. Do not design or build it until that review is in and you have approved a later phase. (Nov 17: run GPS and maps were removed from the v1 policies; adding them needs a new opt-in and new policy text.)

## Before store submission

_Status as of Nov 15, 2026._

- [ ] Form a Texas LLC (Form 205 on SOSPortal, $300, https://www.sos.state.tx.us/corp/instructions/205.shtml) and put the Apple and Google developer accounts under it (Apple 5.1.1(ix)) _(None yet)_
- [ ] General liability, tech E&O and cyber insurance, with an abuse and molestation endorsement
- [ ] Trademark clearance for the app name _(Name not chosen)_
- [ ] Licensed Texas attorney reviews the ToS, Privacy Policy and coach agreement
- [ ] Privacy Policy and a separate Consumer Health Data Privacy Policy (Washington MHMDA), published and linked from the homepage _(Drafts in `src/legal/policies/` (v0.4); app name still open; attorney review still open; not yet published)_
- [ ] DPAs in place: Supabase (to sign); Anthropic's is automatic with the Commercial Terms
- [ ] Breach-response plan (FTC Health Breach Notification Rule, Texas ch. 521)
- [ ] DMCA agent registered, NCMEC CyberTipline registration, and a Texas DFPS reporting process
- [ ] Enrolled in Apple Small Business Program and Google's 15% tier
- [ ] Age ratings, Data safety and health-app declarations filled in

## How every phase gets built

**Kevin, working mode:**

> "Build through the plan, review me at the end of each phase."

1. **Design in Paper first.** Every new screen is designed in Paper before it's coded.
2. **Build the phase.** Claude Code works through the phase on a branch like `phase-3-onboarding`, made from `main`, without stopping for approval at each step.
3. **Review at the end of the phase.** When the phase is done, it comes to you with screenshots, test results and a plain-words summary.
4. **Merge only with your OK.** Each phase is merged only after you approve it, and nothing is published to the stores without your explicit go-ahead.

## Legal review (Nov 15, 2026)

> **General legal information, not formal advice** A licensed Texas attorney should still review the ToS, Privacy Policy and coach agreement before launch.

### Approved and applied

- **Store billing**: Pro and Coach Program on in-app purchase. Small Business Program and Google 15% tier before the first sale. In-app purchase only at launch, with a US web checkout later alongside it (ROSCA, California auto-renewal). $59.99 promo only with clear renews-at-$69.99 wording.
- **Launch region**: US only, iOS and Android. Comply with Washington's My Health My Data Act, with no state geo-blocking. EU and UK later (GDPR Art. 9, EU representative, Apple EU terms, VAT).
- **Health data**: Treat the FTC Health Breach Notification Rule as applying. Breach plan covering it and Texas ch. 521 (notice to people within 60 days; notify the Texas AG within 30 days if 250+ Texans are affected, Tex. Bus. & Com. Code §521.053(i)). Separate opt-ins for health data, the AI vendor and coach sharing. Separate health-data privacy policy. DPAs. Never sell health data.
- **Biometrics**: Pose analysis stays on the phone, face landmarks are thrown away, and there's no face recognition on photos (Texas 503.001, Illinois BIPA).
- **AI plans**: Health screen first (never labeled PAR-Q+; needs the Health switch; clearance is a checkbox; re-ask every 12 months or on injury edits). Conspicuous not-medical-advice and assumption-of-risk text. No unsubstantiated claims (FTC Act s5, Apple 1.4.1). The ToS bars clinical use by licensed providers, which keeps HIPAA out.
- **Coach verification**: Through NASM, ACE, ACSM and NSCA lookup tools. The app defines what "verified" means. Coaches can't call themselves dietitians (Texas Occ. Code ch. 701).
- **Ratings and uploads**: 16 CFR 465, Consumer Review Fairness Act, report/block/filter (Apple 1.2), a DMCA agent, and CSAM reporting to NCMEC.
- **Coach agreement**: Fees and payout schedule; refunds, chargebacks and negative balances; coaches handle their own taxes and insurance; content license; data duties. It doesn't set hours, methods or training, and has no exclusivity or broad non-solicit.
- **Store compliance**: Texas SB 2420 is in effect (the Fifth Circuit stayed the injunction June 4, 2026). Age ratings for the app and each in-app purchase. Apple Declared Age Range API and Google Play Age Signals. Play health-app and Data safety declarations.
- **Before submission**: Texas LLC holding the developer accounts, insurance (general liability, tech E&O, cyber), trademark clearance.
- **Phase 4 AI plan (legal review, Nov 15)**: Minor-safe goal list approved. Health screen approved (never labeled PAR-Q+; needs the Health switch; clearance is a checkbox; re-ask every 12 months or on injury edits). Blocked copy approved (log the reason code only). Teen goal is "Build muscle" (strength framing; no bulking, calories, or supplements). Teen body-weight card hidden **[superseded Nov 17]**. Logging on and AI off after an uncleared yes, with human coaching allowed. Plan notice always visible, and may shrink to a one-line footer after the first session.
- **Privacy policies and design conflicts**: The legal review finished the Privacy Policy and Consumer Health Data Privacy Policy (Nov 15, 2026): `src/legal/policies/privacy-policy.md` and `src/legal/policies/consumer-health-data-privacy-policy.md`. Applied from those drafts: the adult weight goal and the Free Home weight card stay on the device until the Health data switch is on; adult progress photos need a separate first-use opt-in; form-check cues stay rule-based (LLM cues deferred); a minor's form numbers go to a coach only after both the teen and the parent opt in; Texas AG breach notice is due within 30 days, not 60 (§521.053(i)). Your later answers (Nov 15): no ad SDKs or ad sharing; wearables yes; location is approximate and requested only when a feature needs it, everywhere in the app; a policy contact email has been provided (provisional; a domain alias was suggested). Run tracking with precise GPS and a route map is a later backlog item, not in the current build, and the legal review is reviewing it for the policies and for teens. Still needed to finish the drafts: the real app name (placeholders being explored) and analytics (default unless you say otherwise: crash reports plus basic analytics, with no ad sharing).

### Legal recommendations and your answers

| Recommendation | Your answer |
|---|---|
| Minimum age 18+ at launch | Final: stays 16+ |
| Restructure 1:1: Stripe only for human coaching, Pro unbundled on in-app purchase, live video or voice check-ins | Final: approved |
| $79 1:1 minimum becomes a suggested price; coach is seller of record | Final: approved |
| Require coaches to carry liability insurance | Final: not required |
| (Your addition) Parental consent for 1:1 under 18 | Decided |

### Round 2 correction: Texas SCOPE Act

The Fifth Circuit granted rehearing en banc on Oct 28, 2026, which vacated the July 24 panel ruling. Sec. 509.053 filtering and the targeted-ad and age-verification duties are still blocked. Registration, data limits, parental tools and parent rights were never blocked. SCOPE likely doesn't apply to us yet because of the SBA small-business exemption (509.002(b)(4)), but we build SCOPE-style protections anyway.

### Coach as seller of record: build notes

- Every coach needs a Stripe connected account. Coaches must be 18+ (self-attested). **[Nov 17: "Stripe requires coaches to be 18+" was flagged as unverified and removed from product copy.]**
- Direct charges, decided (as legally recommended): refunds and chargebacks come out of the coach's balance. Destination charges plus `on_behalf_of` would have put them on the platform.
- Refunds are issued by the coach, or by the platform on the coach's account using the `Stripe-Account` header. Still open: whether the 15% platform fee is refunded too.
- For minors, the parent is the Stripe customer.
- Standard client agreement: the parent can cancel anytime, refunds are prorated, a refund is immediate if a safety report is upheld, and off-platform contact is banned.
- The $79 suggested price, rather than a set price, supports the coaches' contractor status.

### Other states

- Utah app-store age law from May 6, 2027, Louisiana from July 1, 2027, and California AB 1043 from Jan 1, 2027. They use the same age-signal APIs as Texas SB 2420.
- California's Age-Appropriate Design Code doesn't apply yet.
- Washington's My Health My Data Act covers minors' health data too.

### Legal open questions for you

_Status as of Nov 15, 2026, 9:56 PM MST. Questions 5, 7 and 10–12 are still open. Q9 is partly answered._

- [x] LLC status _(Answered: none yet. Forming it (Form 205) is on the pre-submission checklist)_
- [x] Employment agreement IP and outside-work clause _(Resolved: no IP clause, no employer resources used)_
- [x] 18+ minimum age _(Final: 16+)_
- [x] Live sessions and unbundling 1:1 _(Approved)_
- [ ] 1:1 seller of record, refunds and chargebacks _(Seller (coach) and direct charges decided; 15% fee refund open)_
- [x] Price floor, insurance and background checks _(Suggested price; no coach insurance; no background checks (known risk); NSOPW search, reporting training and platform abuse and molestation insurance decided)_
- [ ] Licensed providers, meal plans, coaches outside TX/US
- [x] AI vendor and health data _(Anthropic (Claude); the final legal terms, build rules and consent wording are in AI vendor: Anthropic)_
- [ ] Apple Health, Health Connect, wearables, location; ads and analytics SDKs _(Partly answered Nov 15: no ad SDKs or ad sharing; wearables yes; location is approximate, requested only when a feature needs it, everywhere in the app. Analytics still open (default unless you say otherwise: crash reports plus basic analytics, no ad sharing). Precise GPS run tracking is later, and the legal review is reviewing it)_
- [ ] Web checkout timing and year-one revenue
- [ ] Marketing claims and data retention
- [ ] Legal and tax budget: tech/privacy attorney, TX employment attorney, CPA (Texas taxes SaaS on 80% of the price)

## Users aged 16–17 (legal review round 2)

### Required (decided)

- **SB 2420 (Tex. Bus. & Com. Code ch. 121)**: Age ratings for the app and each in-app purchase. Apple Declared Age Range API (`isEligibleForAgeFeatures`, with the confirmed value in iOS 26.5) and Google Play Age Signals (`requestAgeSignalsAccess`, `checkAgeSignals`). Relying on them in good faith is a safe harbor. Delete store age data after the check and keep only a derived minor flag. Handle Apple `RESCIND_CONSENT` and Google revocation. Significant changes (catalog, 1:1, video sharing, live sessions) need parent re-consent through PermissionKit Significant Change or Play Console, with the feature locked until the parent approves. DTPA penalties go up to $10k per violation.
- **Parent is the buyer**: For minors, the parent is the contracting party and the Stripe customer. Minors' contracts can be voided, and store consent doesn't cover Stripe.
- **Reporting duties**: Texas DFPS reporting duty (Fam. Code 261.101). NCMEC CyberTipline registration, reporting and 1-year preservation (18 USC 2258A).
- **COPPA**: Close and delete accounts found to be under 13.
- **Safety and AI**: Apple 1.2 report and block. Parent consent before a minor's data goes to the AI vendor.
- **Minor media**: Pose analysis stays on the phone. CSAM hash matching runs on any minor media that reaches the server. Minors can't upload progress photos under the current design, so this covers anything else that gets uploaded.

### Your decisions on the round 2 legal options

- **Minors' form-check videos: on-phone analysis only** _[Decided]_: For users under 18, coaches see only the pose skeleton and metrics. Raw video is never shared with coaches, and it stays on the phone or is deleted automatically. The legal review's list of safeguards for sharing raw video isn't needed and was dropped.
- **No background checks for coaches who work with minors** _[Decided, known risk]_: The legal review called background checks the biggest liability control, and there's no coach insurance requirement either. This is listed as a known risk, partly offset by the decisions below.
- **Stripe direct charges** _[Decided]_: The coach covers refunds and chargebacks. Still open: whether the 15% platform fee is refunded too.
- **Live sessions with minors** _[Decided]_: The parent is invited to every session, and nothing is recorded.
- **Offsets for no background checks** _[Decided]_: An NSOPW (sex offender registry) search before approving a coach for minors, mandatory chat safeguards for minors, required Texas abuse-reporting training for coaches (Fam. Code 261.101), and platform insurance with an abuse and molestation endorsement. The general coach insurance requirement stays dropped.

### Recommended (SCOPE-style)

- Parent dashboard: privacy settings, purchase approval, time limits, read messages, view videos, session alerts, export and delete.
- Data minimization: no precise location, no targeted ads, minor data kept out of analytics and AI prompts.
- Chat safety (now decided as mandatory): filters for self-harm, eating disorders, substances, harassment and grooming, with human review; 988 and NEDA resources; text only; parent-visible; no disappearing messages; no messages from 10 pm to 7 am; off-platform contact banned, with phone and social-handle detection; modelled on SafeSport MAAPP.
- No weight-loss, calorie or body-fat goals for minors, and body weight hidden from coaches by default. **[Superseded Nov 17: teen weight works as for adults; coaches never see it.]**
- Health screen completed with the parent (never labeled PAR-Q+); clearance is a checkbox, re-asked every 12 months or on injury edits.
- Live sessions with minors (now decided): only in the app, parent invited to every session, logged and not recorded.

## AI vendor: Anthropic

> **Final AI-vendor legal guidance, verified Nov 15, 2026** General legal information, not formal legal representation. Full text is in section 13 of `briefs/reference/legal/phase2-legal-answers.md`. The consent wording only holds if the build matches it, and an attorney still needs to review the wording before launch.

### Anthropic's terms in brief

- **No training on our data**: Anthropic may not train models on customer inputs or outputs (Commercial Terms §B).
- **DPA is automatic**: The DPA is part of the Commercial Terms (§C), so there's nothing to sign. It covers processing only on our instructions, no selling or sharing, help with data-subject requests, breach notice within 48 hours, deletion within 30 days after the contract ends, EU and UK transfer terms, and a subprocessor list with notice and a right to object.
- **Default retention: 30 days**: API inputs and outputs are deleted within 30 days. Exceptions: longer-retention features such as the Files API, a ZDR agreement, legal requirements, and Usage Policy enforcement, where flagged requests are kept up to 2 years and safety scores up to 7 years.
- **Zero data retention (ZDR) only by request**: Requested through Anthropic sales, approved by Anthropic, per organization, and only for eligible Messages API features. Even under ZDR, Anthropic keeps safety-classifier results and may keep data its safety systems flag or the law requires. Covered Models are excluded, and browser (CORS) calls are blocked.
- **Usage Policy (effective Nov 12, 2026)**: Bans content that promotes eating disorders, compensatory exercise, or idealizing body weight or shape. Bans high-risk medical recommendations such as diagnosis or treatment plans unless a qualified human reviews them. Products serving anyone under 18 must follow Anthropic's minors guidelines: age assurance, content filtering, monitoring and reporting, any child-safety system prompt Anthropic provides, a public child-privacy statement, and AI disclosure. Anthropic audits for these and can suspend accounts.
- **Washington MHMDA**: Anthropic counts as a processor, so sending it data isn't sharing and needs no separate sharing consent. The collection consent still has to cover the AI use. The DPA appears to meet the processor-contract rules but doesn't name MHMDA, so an attorney should confirm. Anthropic stays on the deletion-notice list; its 30-day auto-delete fits inside our 45-day deadline.
- **Not needed**: A HIPAA BAA exists but isn't needed. On Bedrock or Google-managed Vertex the cloud provider's terms would govern instead; we're calling the Claude API directly from our backend.

### Build requirements

- [ ] Prompt minimization: no name, email, user ID, photos or location. A random ID for each request, and the injury category only, never free-text injury or pain notes
- [ ] Messages API called from the backend only, never from the app
- [ ] No Batch API (29-day storage), Files API, Skills or Managed Agents
- [ ] No personal data in structured-output JSON schemas (cached up to 24 hours)
- [ ] Never send thumbs-up or thumbs-down feedback to Anthropic (kept 5 years)
- [ ] The injury category is used only to avoid or swap exercises, never to build rehab or treatment plans
- [ ] An output filter that blocks eating-disorder, compensatory-exercise and body-shaming content
- [ ] For 16–17 users: follow Anthropic's minors guidelines, publish a public child-privacy statement, and disclose that the plan is made by AI
- [ ] Under ZDR, avoid Covered Models (Claude Fable and Mythos 5.x, which require 30-day retention). Whatever model we pick, including any Sonnet model, must be checked against Anthropic's current Covered Models list

### Consent wording (final legal draft, verbatim)

Version B ships at launch. Switch to Version A only after Anthropic confirms ZDR in writing and the Console shows it under Settings › Privacy Controls › Data retention period.

**Version B: no ZDR (standard terms), used at launch:**

> "Use AI to build my plan. Turn on to send Anthropic, our AI provider, your goals, experience, equipment, age range, and injury category (no name, email, photos, or location) so it can create and adapt your plan. Anthropic processes it only for us, under contract, and doesn't train its AI on it. Anthropic deletes it within 30 days, unless its automated safety checks flag a request (then it may keep that request for up to 2 years) or the law requires it to keep data longer. Turn off anytime in Settings › Privacy; your saved plan stays but stops adapting."

**Version A: ZDR in place, used once ZDR is confirmed in writing:**

> "Use AI to build my plan. Turn on to send Anthropic, our AI provider, your goals, experience, equipment, age range, and injury category (no name, email, photos, or location) so it can create and adapt your plan. Anthropic processes it only for us, under contract. It doesn't train its AI on it, and it doesn't store it after replying. The one exception is when the law requires it or Anthropic's automated safety checks flag a request; Anthropic also keeps the results of those safety checks. Turn off anytime in Settings › Privacy; your saved plan stays but stops adapting."

**Minors' variant, teen (16–17; the teen's switch stays locked until the parent also agrees):**

> "Use AI to build my plan. [Version A or B text.] Your parent must also agree before this turns on, and either of you can turn it off."

**Minors' variant, parent (shown beside the AI plan box in Parental consent):**

> "Let [App] send Anthropic, our AI provider, [Teen]'s goals, experience, equipment, age range, and injury category (no name, email, photos, or location) to create and adapt [Teen]'s plan. [Same retention and training sentence as the version in use.] [Teen] must also agree. You or [Teen] can turn it off anytime; [Teen]'s saved plan stays but stops adapting."

**Plan-screen notice (required by Commercial Terms §D.3 and the Usage Policy AI-disclosure rules):**

> "Made with AI. It can be wrong, so check that it fits you. It isn't medical advice. Stop and see a professional if anything hurts."

## Decisions

| Decision | Needed by | Status |
|---|---|---|
| Backend: Supabase (built in Phases 2 and 2b) | Phase 2 | Decided |
| PR #1: closed unmerged; new work builds on `main` | Phase 0 | Decided |
| Phase 2b (legal changes to Phase 2) | Before Phase 3 | Merged, PR #5 |
| Onboarding: DOB-first 8-step flow, one combined Privacy & safety screen (switches off by default, risk card with required checkbox) | Phase 3 | Decided |
| Prefs Apple Health card wording; risk checkbox vs button; teen progress bar | Phase 3 | Settled in the Phase 3 build (PR #6) |
| Keep 'Lose fat' as an adult AI-quiz goal? | Phase 4 | Decided: yes, adults only |
| Leave Tempo, Swap, Gym and Favorites on the 3-tab bar for now, or retab later? | Phase 4 | Done: retabbed to Home, Train, Progress, Profile (+ Studio) |
| Phase 4 legal rulings: minor-safe goal list approved; health screen approved (never labeled PAR-Q+; needs the Health switch; clearance is a checkbox; re-ask every 12 months or on injury edits); blocked copy approved (log the reason code only); teen goal is 'Build muscle' (strength framing; no bulking, calories, or supplements); teen body-weight card hidden; logging on and AI off after an uncleared yes, with human coaching allowed; plan notice always visible, and may shrink to a one-line footer after the first session | Phase 4 | Decided |
| App name (also the bundle ID, store listing and trademark search); placeholders being explored | Before store setup | Open |
| Policy contact email (provided, provisional; a domain alias was suggested) | Policies | Provided |
| No ad SDKs or ad sharing | Policies | Decided |
| Wearables | Policies | Yes |
| Location data: approximate, requested only when a feature needs it, everywhere in the app | Policies | Decided |
| Later: run tracking with precise GPS and a Strava-style route map (separate precise and background location opt-in, plus privacy zones that hide each route's start and end). The legal review is reviewing it for the policies and for teens | After launch | Backlog |
| Analytics (default unless you say otherwise: crash reports plus basic analytics, with no ad sharing) | To finish the policies | Decided: PostHog (12 mo) + Sentry (90 days), no user ID; teens crash reports only |
| Minimum age 16+, parental consent for 1:1 under 18 (legal advice was 18+) | Phase 3 | Final |
| Required 16–17 safeguards (SB 2420, parent as Stripe customer, reporting, COPPA) | Phases 2–10 | Decided |
| Minors' form-check: on-phone only, coaches see skeleton and metrics, never raw video | Phase 7 | Decided |
| No background checks for coaches who work with minors (called the biggest liability control in the legal review) | Phase 6 | Decided, known risk |
| Offsets for no background checks: NSOPW search, mandatory minor chat safeguards, Texas abuse-reporting training, platform abuse and molestation insurance | Phase 6, 8, 10 | Decided |
| Stripe direct charges: the coach covers refunds and chargebacks | Phase 10 | Decided |
| Whether the 15% platform fee is refunded with a coaching refund | Phase 10 | Open |
| Live sessions with minors: parent invited to every session, no recording | Phase 8 | Decided |
| What a 1:1 client without Pro gets (proposal: Free features plus the coach's content) | Phase 10 | Open |
| Other SCOPE-style protections for minors (parent dashboard, data minimization, no weight-loss goals, PAR-Q+ with the parent) | Phases 3–10 | Recommended; no-weight-loss-goals part superseded Nov 17 (teen safeguards declined) |
| Encryption key custody: external KMS with per-user data keys | Phase 2 | Decided |
| Age logic: date of birth before email, lower of store signal and DOB, age band plus `adult_on` stored, 14-day deletion of unlinked minors, coaches 18+ | Phase 2, 3 | Decided |
| AI vendor: Anthropic (Claude API, called from the backend). Consent Version B at launch, Version A once ZDR is confirmed in writing | Phase 2b, 4 | Decided |
| Which Claude model to use (must not be a Covered Model while on ZDR) | Phase 4 | Open |
| Progress-photo uploads blocked for 16–17, enforced on the server | Phase 5 | Decided |
| 13–15 stay blocked | Phase 2 | Decided |
| Who reviews coach applications and certifications | Phase 6 | Decided: Kevin, manually |
| Launch region: US only, iOS and Android | Before launch | Decided |
| Consumer price: Pro $12.99/mo or $69.99/yr, 7-day trial, optional $59.99 first-year promo | Phase 9 | Decided |
| Payment paths: Pro and Coach Program on in-app purchase; 1:1 on Stripe for human coaching only, coach as seller | Phase 9, 10 | Decided |
| When to add the US web checkout | After launch | Open |
| Platform cut (recommended 15% on catalog 1:1) | Phase 10 | Open |
| B2B pricing (Solo, Studio, Gym) | Phase 10 | After trainer talks |
| Live video or voice provider for check-ins | Phase 8 | Open |
| RevenueCat (faster, costs a fee) or own store integration | Phase 9 | Open |
| Family Sharing for Pro | Phase 9 | Open |
| Free tier chart ranges: 1M + 3M, or 3M only | Phase 9 | Open |
| Which licensed demo library to buy | Phase 4 | Open |
| e1RM formula: Epley only or also Brzycki, and a rep cap | Phase 5 | Decided: Epley, 10 reps or fewer, "Est. 1RM" |
| Messaging: broadcast cap, read receipts, retention after coaching ends | Phase 8 | Open |

## Risks

- **App Review of the 1:1 Stripe model** _[High]_: The approved structure (Stripe only for human coaching, Pro separate, live check-ins) gives Apple 3.1.3(d) and Google's 1:1 rule the best chance, but review can still reject it. The fallbacks are the iOS US link-out and Google US alternative billing.
- **Health and privacy law** _[High]_: The legal review covered the main laws, but the policies, coach agreement and consent text still need a licensed Texas attorney before launch.
- **Access rules set up wrong** _[High]_: One missing row-level rule could expose a client's data. Automated cross-account tests in every PR reduce this risk.
- **Minors (16–17)** _[High]_: 16+ is final against the legal advice to go 18+. The required safeguards add real work (parent accounts, re-consent locks, reporting duties), DTPA penalties go up to $10k per violation, and every minor rule must be enforced on the server. Utah, Louisiana and California age laws follow in 2027. The legal review also notes that a Texas parent can't waive a child's future injury claims, and the time limit to sue doesn't start until the minor turns 18, so safety design and insurance matter more than waivers.
- **No background checks and no coach insurance** _[High]_: You decided coaches who work with 16–17 year olds won't be background-checked, and coaches don't have to carry insurance. The legal review called background checks the biggest liability control. That leaves the platform more exposed if a coach harms a minor. You approved the legal review's offsets (an NSOPW search, mandatory minor chat safeguards, Texas abuse-reporting training, and platform abuse and molestation insurance), which reduce but don't remove this risk.
- **Texas SCOPE Act in flux** _[Medium]_: The case is being reheard en banc, and the small-business exemption may not last as we grow. Building SCOPE-style protections now avoids a scramble later.
- **Apple US link-out fee may change** _[Medium]_: It's 0% now but may become 5–15%, and the case is at the Supreme Court. Keeping in-app purchase alongside the web checkout limits the damage.
- **AI plan safety and claims** _[Medium]_: Bad advice could hurt someone. That's why there's the health screen, fixed safety checks, conspicuous disclaimers, and no results claims.
- **Form-check tech on SDK 58** _[Medium]_: The plugin may need updating, and older phones may run slowly.
- **Trainer catalog liability** _[Medium]_: Verification and the FTC review rules. With direct charges, coaches cover refunds and chargebacks, but a coach who can't pay leaves a negative balance the coach agreement has to handle. No insurance requirement for coaches, by your decision.
- **Pre-launch business setup** _[Medium]_: The LLC, insurance and trademark search take time and are needed before submission. Start them early.
- **Scope** _[Medium]_: It's a big build for one person reviewing. Small PRs and one phase at a time keep it manageable.
- **Ongoing costs** _[Low]_: Supabase, RevenueCat, the AI model, the video-call provider, the demo licence, storage, moderation and legal and tax help all add up.
