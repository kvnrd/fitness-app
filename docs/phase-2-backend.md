# Phase 2: backend, auth, age gate and consent (record)

Status: code and SQL are written and tested locally. **Phase 3 (onboarding, parent invites, trainer codes, Privacy & safety) extends this; see [phase-3-onboarding.md](phase-3-onboarding.md) for current behavior where they differ.** **Phase 2b (Counsel's answers, Nov 15, 2026) changed several Phase 2 items below; where a line says "(Phase 2b)" the [Phase 2b section](#phase-2b-counsels-legal-answers) is the current behavior.** **No hosted Supabase, Apple or Google project exists.** Everything below that needs an account is on Kevin's checklist. Nothing here is legal advice; legal questions are listed at the end for Counsel and are not answered.

## Layout

- `supabase/migrations/*.sql` target real Supabase / Postgres 17 with `pgcrypto` (still used for trainer-code hashing; health fields are no longer encrypted in the database, see Phase 2b).
- `supabase/tests/` holds the test-only pieces: `auth_stub.sql` (roles, `auth.uid()`, `tests.login()`), `pgcrypto_stub.sql` (PGlite only, **not encryption**), `rls.sql`, `phase2b.sql`, `run.mjs`.
- `supabase/functions/` holds the server functions (Deno Edge Functions): `health-record` (KMS envelope encryption) and `ai-plan` (Anthropic). See `supabase/functions/README.md`.
- `supabase/config.toml` has no secrets.
- Client: `src/auth/` (`supabase.ts`, `secureStorage.ts`, `signIn.ts`, `SessionProvider.tsx`, `session.ts`, `onboarding.ts`, `consents.ts`, `parentLinks.ts`, `accountRequests.ts`). Screens: `src/app/sign-in.tsx`, `onboarding.tsx`, `parent-link.tsx`, `consent.tsx`.
- `AppStore` (training data) is still on in-memory mocks. Moving it to Supabase is a later phase.

## Run the tests

```bash
cd supabase/tests && npm install && node run.mjs         # PGlite (in-memory), pgcrypto stub
DATABASE_URL=postgres://postgres:postgres@localhost:5432/fitness_test node supabase/tests/run.mjs   # real psql + pgcrypto
```

With `DATABASE_URL` the runner **drops and recreates** the `public`, `private`, `app`, `auth`, `tests`, `extensions` schemas, so the database name must end in `_test`. CI uses a `postgres:17` service container with the throwaway password `postgres`; it is a test-only value for a disposable container.

Health encryption happens in the server functions (Phase 2b), so the SQL tests check that the database only ever holds ciphertext and wrapped keys and that access control is right; the crypto itself is tested in `supabase/functions/tests` (`cd supabase/functions && npm test`).

Client logic has unit tests since Phase 3 (`npm run test:unit`); screens are checked by `npx tsc --noEmit` and the web export.

## Schema summary

| Table | Purpose | Client access |
|---|---|---|
| `private.encryption_keys` | Keys / pepper | none (zero grants, no policies) |
| `profiles` | id, display_name, `age_band` (`16_17`/`18_plus`), `adult_on`, `age_source`, `store_signal`, `age_verified_at`, derived `is_minor` (no date of birth, Phase 2b) | read own (only id, display_name, is_minor granted); update `display_name` only; coaches read consented clients |
| `user_roles` | `athlete`, `coach_pending`, `coach_verified`, `gym_admin`, `platform_admin` | read own row; no writes |
| `consents`, `consent_events` | `health_data`, `ai_vendor`, `coach_sharing`, `parental`; one row per grantor (`self`/`parent`) with `text_hash`; default not granted | read own (or as active parent); writes only via `record_consent` / `revoke_consent` |
| `parent_links` | minor to parent/guardian, `is_contracting_party` | read if party; writes via functions |
| `coach_relationships` | coach to client, `pending/active/ended` | read if party; writes via functions |
| `gyms`, `plans`, `plan_days`, `exercises`, `set_logs` | training data, aligned with `src/data/types.ts` | owner/assigned client; coach writes only while relationship is active; coach reads logs only with `coach_sharing` |
| `health_records` | AES-256-GCM ciphertext (injury notes, health screen, injury category) written by the `health-record` function; per-user wrapped data keys in `private.user_data_keys` | none; only service-only `health_*` functions, called by the server function |
| `coach_applications`, `trainer_codes` | coach onboarding stubs | read own (codes: no hash column) |
| `audit_log` | actions, no health values/emails/tokens | read own actions; platform admin reads all; insert only via definer |
| `data_export_requests`, `account_deletion_requests` | stubs | insert own, read own |
| `purchases`, `progress_photos` (+ private `progress-photos` bucket) | Phase 2b guards | read own; inserts blocked for unlinked minors / all 16-17 photos |
| `retention_policies` | Counsel's retention table | platform admin read only |

Every table has RLS enabled **and forced**, with all default Supabase grants revoked and explicit grants only. The `app` schema (policy helpers) and `private` schema must never be listed in the API's exposed schemas.

### Roles are server-side

RLS and the functions look up `user_roles` (through `SECURITY DEFINER` helpers). The `app_role` JWT claim added by `public.custom_access_token_hook` is only a client-side cache. A test forges that claim and confirms it grants nothing. Only `service_role` or a `platform_admin` can call `set_user_role`. The client reads its role with `SELECT ... FROM user_roles` (own row) and treats a missing row or an error as `athlete`.

### Age rules (as implemented; legal sufficiency is for Counsel)

**Superseded by Phase 2b** (date of birth before email, store signal, no DOB stored, ineligible auth user deleted in the same request). The original Phase 2 rule was: `complete_signup(p_birth_date, p_display_name)`: under 13 raises `under_13_not_permitted` and keeps nothing; 13 to 15 raises `under_minimum_age` (product minimum is 16) and keeps nothing; 16 to 17 creates a minor profile that is not onboarded until an active, contracting-party `parent_links` row exists (`app.is_minor_onboarded`); 18+ is not a minor. A daily job should call `recompute_minor_flags()` so 17-year-olds flip at 18.

No column or JSON stores an Apple Declared Age Range or Google Play Age Signals payload. Phase 2b keeps only which store answered (`store_signal`), not the payload, and no date of birth.

## Encryption and key management

**Superseded by Phase 2b (KMS envelope encryption).** The notes below describe the original Phase 2 design, which the `20261115000300` migration removes (health keys can no longer be stored in `private.encryption_keys`). `trainer_code_pepper` is still a hand-inserted key.


- Health fields are encrypted in the database with `pgp_sym_encrypt` using a key from `private.encryption_keys`, read only by `SECURITY DEFINER` functions. The key is never sent to or stored in the app, never in `EXPO_PUBLIC_*`, never in git.
- The operator inserts keys by hand (SQL editor / psql as the DB owner), e.g. `insert into private.encryption_keys (name, key) values ('health_v1', '<random 32+ bytes from a password manager or openssl rand -base64 48>');` plus `trainer_code_pepper` for code hashing. Do not paste real values into any file in this repo, issue, or chat.
- Rotation: add `health_v2` (newest non-retired `health_%` key is used for new writes). Each row records `key_name`, so old rows still decrypt. Re-encrypt old rows with a server job, then set `retired_at` on the old key. Keep retired keys until no row references them.
- Supabase Vault can hold the keys instead; if switched, change `private.active_health_key` and the read path to read from `vault.decrypted_secrets`. Not done yet.
- **Backups contain the keys.** The keys table is in the same database, so a full database backup or a point-in-time restore includes ciphertext and keys together. Encryption here protects against SQL-level access (a stolen API key, a leaked read replica of one table, an over-broad policy), not against theft of a whole-database backup. Whether that is acceptable, or an external KMS is needed, is an open question below.
- The migration role must have `BYPASSRLS` or be a superuser (true for Supabase `postgres`), because the tables use `FORCE ROW LEVEL SECURITY` and the definer functions run as the owner.
- The service-role key and encryption keys are **server-only**. They are never `EXPO_PUBLIC_*`, never in `app.json`, never in EAS public env.

## Auth flows (client)

- **Unconfigured prototype.** If `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing or placeholders, `supabase` is `null`. The app runs on the in-memory `AppStore`, with no sign-in, age gate, consent or parent screens (those routes are not mounted). Role comes from `EXPO_PUBLIC_DEV_ROLE` in `__DEV__` only.
- **Email OTP.** 6-digit code, no passwords. The "send code" step always reports success, and failures are generic, so the UI cannot be used to probe for accounts. Code length and expiry are set in the Supabase dashboard.
- **Apple.** `expo-apple-authentication` returns an identity token; it is exchanged with `signInWithIdToken` using a raw nonce (Apple receives the SHA-256). Only the email scope is requested. `usesAppleSignIn` is set in `app.json`.
- **Google.** `expo-auth-session` ID token, exchanged with `signInWithIdToken`. Offered on iOS only, and only when both client IDs are set. Android is not wired.
- **PKCE** is on (`flowType: 'pkce'`); `detectSessionInUrl` is off because no redirect flow is used.
- **Token storage.** Native: `expo-secure-store` (Keychain/Keystore), chunked because a session exceeds the ~2 KB value limit. Web: in-memory only; tokens are never written to `localStorage`, so web sessions do not survive a reload.
- **Role** is read from `user_roles` after sign-in; an error or no row means `athlete` (fail closed). Studio stays guarded by `isVerifiedCoach`.
- **Account deletion / data export** only enqueue requests (`accountRequests.ts`). Fulfilling them is a server job.

## Root gate (`src/app/_layout.tsx`)

When Supabase is configured, `Stack.Protected` mounts exactly one of these, in this order:

| State | Screen |
|---|---|
| device has the not-eligible flag (and no signed-in profile) | `not-eligible` (Phase 2b) |
| signed out, no date of birth entered yet | `age` (Phase 2b) |
| signed out, date of birth entered (or "I already have an account") | `sign-in` |
| signed in, no `profiles` row | `onboarding` (age gate) |
| signed in, minor, no active contracting-party `parent_links` row | `parent-link` |
| otherwise | `(tabs)`, `workout/[day]`, plus `consent` and (adults) `parent-link` |

`isOnboarded` (SessionProvider): adults true; minors true only with an active contracting-party link; no profile or any query error is false (fail closed). It is UI gating only; RLS and `app.is_minor_onboarded` enforce the same rule on the server. While the first server read for a user is in flight the app shows the splash view, so onboarding does not flash.

Deep links `/age`, `/not-eligible`, `/onboarding`, `/parent-link`, `/consent` are on the allowlist only so the router can resolve them. Each mounts only in its own state and otherwise falls through to Train. They take no params and do nothing on open.

## How each Counsel item was handled

- **Consents.** `src/app/consent.tsx` shows three separate switches (`health_data`, `ai_vendor`, `coach_sharing`), off unless the server says granted, no "accept all". Each calls `record_consent(p_kind, p_policy_version[, p_for_user])` or `revoke_consent(p_kind[, p_for_user])`. State is read from `consents` and the screen shows what the server returns (an error shows "not granted"). None is required to continue. The server still refuses health writes and coach sharing without consent. The screen opens once per app session for a user with no consent rows, and is also reachable from Train → Account → Your choices (adults also get Link requests there). **Labels and `POLICY_VERSION = 'placeholder-v1'` are placeholders; Counsel supplies the real text and version.** The `parental` consent kind exists in SQL but is not shown.
- **Age / COPPA.** `onboarding.tsx` collects birth date (year/month/day) and an optional display name and calls `complete_signup`. The server computes the age; the client never computes, shows or stores one. Under 13 and under 16 both give the same generic message ("Sorry, you can't use this app."), no age or reason is echoed, the user is signed out, and the message is shown on the sign-in screen. Other errors give a generic retry message and never say whether an account exists. The screen states, as information and not legal advice: under 13 cannot create an account (COPPA), minimum age is 16, 16 to 17 are minors and a parent or guardian must be the contracting party before the account is fully active.
- **Parent as contracting party.** `parent_links.is_contracting_party` defaults true. A 16 to 17 account is not usable (`app.is_minor_onboarded`, enforced in RLS and functions) until one active contracting-party link exists. `parent-link.tsx` explains this. The email invite is a **stub**: it sends nothing, looks nothing up and stores nothing, because a client-side email lookup would be an account oracle. A "test path" that takes a typed parent user id and calls `link_parent` exists in `__DEV__` builds only (even a generic success/failure answer lets a caller test whether a user id exists). A signed-in adult sees pending requests on the same screen and can call `accept_parent_link`. The linked parent can switch consent toggles to act for the minor (`p_for_user`).
- **No raw store-age data.** Since Phase 3 the app reads the store age range on device, keeps only the bounds in memory, and sends only lower/upper bounds + source; nothing raw is stored.

## Gaps and server work still needed

- **Under-13 account closure has no trigger.** `complete_signup` raises, which rolls back everything, so the database holds no record that an under-13 attempt happened. The client signs out but cannot delete the Auth user, and the Auth user (with its email) remains. `close_under_13_account(user_id)` is service-only. To use it, put an Edge Function in front of the signup call (the client calls the function with its JWT, the function calls `complete_signup` as that user and, on `under_13_not_permitted`, calls `close_under_13_account` with the service role). Not built.
- **Parent email invite:** Phase 3 adds `create_parent_invite` (neutral response) and token-based `accept_parent_invite`; the email sender is still not built.
- Account deletion and data export have request helpers (`src/auth/accountRequests.ts`) but no in-app buttons yet; fulfilling them is a server job.
- Parent-facing display of a linked minor's name is not possible (RLS gives parents no profile read); the UI says "Linked minor 1, 2".
- Parent-link revoke (`revoke_parent_link`) has no UI.
- `npx tsc --noEmit` passes on this branch.

## Kevin's setup checklist (nobody has done any of this)

Accounts and entity
1. Decide which legal entity will own the Apple Developer and Google accounts and the Supabase organization, and create the entity first if needed. (A Texas LLC was mentioned in the task brief but is not recorded anywhere in this repo; confirm whether that applies. This is a business/legal decision, not answered here.)
2. Apple Developer Program account (paid).
3. Google Cloud project for OAuth (and Google Play Console only if Android is wanted).

Supabase project
4. Create the Supabase project (region, plan). Put the URL and anon key only in `.env` (gitignored) and EAS env. Never the service-role key.
5. Apply `supabase/migrations/` in order.
6. Insert the `trainer_code_pepper` key by hand. (No `health_v1` key any more: health data uses KMS, see Phase 2b setup.)
7. Auth > Hooks: register `public.custom_access_token_hook` as the Custom Access Token hook.
8. Confirm the API exposed schemas are `public` only.
9. Schedule the daily `public.run_retention_purge()` (it also runs `recompute_minor_flags()`); see Phase 2b setup.
10. Create the first `platform_admin`: `select public.set_user_role('<user uuid>', 'platform_admin');` as service/owner.
11. Deploy the `health-record` and `ai-plan` functions (Phase 2b setup). Build the parent-invite function (not built). Both use the service role, which lives only in the function's environment.

Auth providers
12. Email OTP: enable email auth, set code length 6 and expiry, customize the email template to show the code (`{{ .Token }}`), configure SMTP.
13. Apple: create an App ID with Sign in with Apple, a Services ID and a key; enter them in Supabase Auth > Providers > Apple. For native iOS the bundle ID must be allowed as a client ID.
14. Google: create OAuth clients in Google Cloud (a Web client and an iOS client; an Android client only if wanted); put the Web and iOS client IDs in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; enter the Web client ID and secret in Supabase Auth > Providers > Google, and add the iOS ID as an authorized client ID. Client secrets stay in the Supabase dashboard, not in the repo.
15. Supabase Auth > URL configuration: set the site URL and the redirect URLs for the `fitnessapp://` scheme. Keep the list minimal.
16. Development build (`eas build --profile development`): Expo Go will not include Apple Sign In or SecureStore behavior you need to test.

Release
17. Counsel's draft consent text is in `src/legal/text.ts` with draft version ids; an attorney must approve it before launch, and the version ids then change.
18. Key custody is decided (external KMS, Phase 2b); set it up before real health data is stored.

## Open legal questions (not answered here; for Counsel)

- Is "parent/guardian as contracting party" for 16 to 17 year olds enough, and what must the parent consent flow and records contain?
- Can a minor grant `health_data`, `ai_vendor` or `coach_sharing` alone, or must the parent? (Current code lets either act; `parental` can only be recorded by the parent.)
- Under-13 handling: what must be deleted and when, and is a neutral age screen sufficient to avoid "actual knowledge"?
- Is it acceptable that coaches cannot be minors (`apply_for_coach` rejects them)? Is body-weight hiding for minor clients enough, and which other fields?
- Retention of consent records, audit rows and deletion requests after account deletion; what is the lawful basis and period?
- What happens to health ciphertext when `health_data` consent is revoked (kept encrypted today, only access is blocked): delete or retain?
- Does revoking `coach_sharing` or ending a relationship require deleting data the coach already viewed or exported?
- Are keys in the same database acceptable for health data, or is an external KMS required?
- Wording of consent text and policy versions is not drafted.

New in Job 3:

- The age screen lists the age thresholds (13, 16, 18) before asking for a birth date. Does showing the rules first undermine it as a neutral age screen?
- An under-13 or under-16 user is signed out, but the Auth user and its email persist until a server job runs `close_under_13_account` (and nothing deletes the 13 to 15 case at all). Is holding that email, even briefly, acceptable? What should happen to 13 to 15 sign-ups?
- Should accepting a parent link also require the parent to record the `parental` consent, and what must the parent see and confirm at that moment? Is verifying that the person accepting is really the minor's parent or guardian required, and how?
- Is the 16 to 17 account allowed to exist, store data or sign in at all before the parent link is active? Today the profile exists and the minor can sign in but sees only the parent-link screen, and the server blocks set-log and health-record writes (and coach sharing) until onboarded.
- Does a first-run consent prompt that shows all three choices off by default, with a Continue button, meet whatever standard applies to "explicit" opt-in?
- May a parent acting for a minor see the minor's consent history and training data, and may the minor see that the parent did?
- The sign-in notice after an ineligible age result: is a generic "you can't use this app" sufficient, or is specific wording required?

---

## Phase 2b: Counsel's legal answers

Source: `legal/phase2-legal-answers.md` (Counsel, Nov 15, 2026; outside this repo). Built locally on branch `phase-2b-counsel`. Every user-facing text is a Counsel draft marked [ATTORNEY before launch]. Nothing is deployed and no account was created.

### What changed

| # | Counsel item | Where |
|---|---|---|
| 1 | Health data encrypted outside the database with KMS envelope encryption | `20261115000300_phase2b_envelope_encryption.sql`, `supabase/functions/_shared/crypto/*`, `health-record` function |
| 2 | Date of birth asked **before** email, on a neutral screen; device flag after a rejection | `src/app/age.tsx`, `src/app/not-eligible.tsx`, `src/auth/ageGate.ts`, `AgeGateProvider.tsx`, root gate |
| 3 | Store age signal: the lower age wins, the raw response is never stored | `private.derive_age`, `src/age/storeAgeSignal.ts` (stub) |
| 4 | Keep `age_band` + `adult_on`, not the date of birth (existing rows converted, `birth_date` dropped) | `20261115000100_phase2b_age.sql` |
| 5 | Under 13 and 13-15 blocked; 16-17 need a linked parent | `screen_age`, `complete_signup` (deletes the auth user in the same request when not eligible) |
| 6 | No paywall or purchase for unlinked minors | `public.can_purchase()`, `purchases` trigger, `src/billing/paywall.ts` |
| 7 | 16-17: teen AND parent opt-ins; teen switch locked until the parent agrees | `20261115000200_phase2b_consents.sql`, `src/app/consent.tsx` |
| 8 | Pending minors: reminders on days 3 and 7, purge on day 14 | `claim_pending_minor_reminders()`, `purge_pending_minors()` |
| 9 | Retention table and purge jobs | `public.retention_policies`, `run_retention_purge()` |
| 10 | Coaches 18+ (attestation now, identity check before approval) | `apply_for_coach(p_attest_adult, ...)`, `set_coach_identity_check`, `user_roles` trigger |
| 11 | No progress photos for 16-17 (server and UI) | `progress_photos` trigger, `progress-photos` bucket policies, `src/features/progressPhotos.ts` |
| 12 | AI through Anthropic (section 13) | `20261115000600_phase2b_ai.sql`, `ai-plan` function, `src/ai/*`, `AiNotice` |

### Age gate flow

1. Signed out with no flag: the neutral `age` screen asks only for a date of birth (no thresholds, no hints). It calls `screen_age` (anon), which answers only `{eligible}` and counts the result per day (no personal data).
2. Not eligible: the device stores `age_gate_v1 = not_eligible` (SecureStore / AsyncStorage on web, nothing personal) and shows only Counsel's notice, "Sorry, you can't use Fitness App. Nothing you entered has been saved." There is no retry.
3. Eligible: the date of birth is held in memory only, and the user signs in. `complete_signup(dob, name, store_lower, store_upper, store_source)` runs the same rule again on the server, keeps `age_band` / `adult_on` and deletes the auth user if the answer is not eligible. The client then sets the flag and signs out.
4. "I already have an account" skips step 1. If that account has no profile, onboarding asks for the date of birth.
5. A purge job deletes auth users that still have no profile after 24 hours, as a backup.

`adult_on` = the latest 18th birthday implied by any signal (date of birth, or today + (18 − store lower bound)). `is_minor = adult_on > today`.

### Envelope encryption

- Each user has a 256-bit data key (DEK), generated by KMS `GenerateDataKey` with the encryption context `{app: fitness-app, purpose: health, user_id}`. Only the wrapped DEK is stored (`private.user_data_keys`).
- Fields are AES-256-GCM, format v1 = `0x01 | 12-byte IV | ciphertext+tag`. AAD = `fitness-app/health/v1/<user>/<field>`, so a ciphertext cannot be moved to another user or field.
- Plaintext exists only inside the `health-record` function, for the length of one request. The DEK is wiped after use. The database, its backups and the client never see plaintext or an unwrapped key.
- Crypto-shredding: `health_shred` deletes the wrapped key and ciphertext. `run_retention_purge` shreds 29 days after `health_data` consent is revoked.
- `KEY_PROVIDER=local-dev` exists for local testing only and refuses to start when `APP_ENV=production`.

### AI (section 13)

- Backend only: the `ai-plan` function calls the Anthropic **Messages API**. The client never holds a key. There are no Files, Batch, Skills or Code Execution calls, and no feedback is sent.
- The app can send only enum and integer fields (goal, experience, equipment, days, minutes). Extra keys reject the request. The server adds the age band and the injury category, decrypted only when `health_data` consent is on. No name, email, photos, location, free text or user id is sent: `metadata.user_id` is a random per-request id.
- Requires effective `ai_vendor` consent (teen + parent for 16-17), onboarding, and at most 20 requests per hour. 16-17 cannot pick `lose_fat`.
- The output filter rejects a whole plan if it has eating-disorder or compensatory-exercise content, body shaming or idealized body talk, or medical treatment or diagnosis. For 16-17 it also rejects any weight-loss or calorie content. It also rejects any plan that doesn't parse. A rejected plan returns a generic `plan_unavailable`.
- Consent wording is **Version B** (no ZDR). Switch to Version A only after Anthropic confirms ZDR in writing. Then set `ANTHROPIC_ZDR=true`, which also rejects models not covered by ZDR.
- Every plan screen shows the notice: "Made with AI. It can be wrong, so check that it fits you. It isn't medical advice. Stop and see a professional if anything hurts." (`src/ai/notice.ts`, `AiNotice`; Train shows it when `program.aiGenerated`).

### Tests

- SQL: `rls.sql` + `phase2b.sql`, **326 assertions** (was 180) at the end of Phase 2b; Phase 3 adds `phase3.sql` (733 total).
- Server functions: `cd supabase/functions && npm test`, **39 tests** at the end of Phase 2b (44 after Phase 3). KMS and Anthropic are mocked; there are no network calls. They cover redaction, the output filter, envelope round trips, AAD binding and provider rules. CI runs them in the `server-functions` job.
- `npx tsc --noEmit` (root) and `npx tsc -p supabase/functions/tsconfig.json` pass. `deno check` passes on both entry points.

### Kevin's Phase 2b setup steps (none done)

AWS KMS
1. Create an AWS account owned by the business entity, and one **symmetric** KMS key (`SYMMETRIC_DEFAULT`, encrypt/decrypt) in the same region as Supabase. Turn on automatic yearly rotation. Key deletion must use the maximum 30-day waiting period. Never schedule deletion while any user data key exists.
2. Create an IAM user (or role) used only by the functions, with only this policy (replace the ARN):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["kms:GenerateDataKey", "kms:Decrypt"],
       "Resource": "arn:aws:kms:<region>:<account>:key/<key-id>",
       "Condition": {
         "StringEquals": {
           "kms:EncryptionContext:app": "fitness-app",
           "kms:EncryptionContext:purpose": "health"
         }
       }
     }]
   }
   ```
   Add an explicit deny for `kms:ScheduleKeyDeletion`, `kms:DisableKey` and `kms:PutKeyPolicy` to everyone except an admin role protected by MFA. Turn on CloudTrail for KMS.
3. Put the secrets in Supabase only, never in the repo or `EXPO_PUBLIC_*`: `supabase secrets set KEY_PROVIDER=aws-kms AWS_KMS_KEY_ID=... AWS_REGION=... AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... APP_ENV=production`

Anthropic
4. Create the Anthropic account under the business entity, accept the Commercial Terms, and create an API key for production only.
5. `supabase secrets set ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=<model id>`. There is no default model on purpose.
6. Ask Anthropic for Zero Data Retention. Only after written confirmation: set `ANTHROPIC_ZDR=true`, switch the consent text to Version A (new version id), and update `retention_policies`. Ask whether Anthropic requires a minors safety system prompt for 16-17 users.

Deploy and schedule
7. Apply the migrations, then `supabase functions deploy health-record ai-plan`.
8. Schedule `run_retention_purge()` daily. It needs the service-role claim. Also schedule `purge_pending_minors()` hourly so a pending 16–17 account is deleted close to day 14 (from `profiles.created_at`), not held until the next daily run (~day 15). The Phase 3 migration `20261116000800_phase3_day14_hourly_purge.sql` creates the hourly pg_cron job when the extension is available; if it is not, attach both jobs in the operator runner:
   ```sql
   select cron.schedule('purge-pending-minors-hourly', '15 * * * *', $$
     select set_config('request.jwt.claims', '{"role":"service_role"}', true);
     select public.purge_pending_minors();
   $$);
   select cron.schedule('retention-purge', '17 9 * * *', $$
     select set_config('request.jwt.claims', '{"role":"service_role"}', true);
     select public.run_retention_purge();
   $$);
   ```
   Alternatively, use a scheduled function that calls the RPCs with the service role. Check the first run in `audit_log` (`retention_purge`). Days 3 and 7 parent reminders come from `claim_pending_minor_reminders()`, but no sender is built yet.
9. On hosted Supabase, check that `complete_signup` and the purge job can delete from `auth.users`. If they can't, move that delete into a function that uses the Auth admin API.
10. Edge Functions have no CORS headers yet, so the web app can't call them. Add CORS before you build a web AI or health screen.

### Not built / needs a decision

- ~~Store age-signal native module~~ Built in Phase 3 (`modules/store-age-signal`, see `docs/store-age-signal.md`); not compiled natively yet.
- Parent invite sender (Phase 3 records invites and issues tokens; the email sender is still not built), days 3/7 reminder sender, the notice to a minor when the parent changes a setting, and parent verification (Stripe Identity), plus the terms, attestation and verification records collected when a link is accepted.
- Coach identity check provider (`set_coach_identity_check` is the hook), coach-sharing consent text (needs the coach name and a per-item picker), and the "Settings › Privacy" screen that the texts refer to.
- AI plan wizard UI and progress-photo UI. (Phase 3 built the Privacy & safety and parent consent screens; `consent.tsx` stays as the later settings view.)
- Tables for minor safety records and NCMEC materials (retention rows say `no_table_yet`).
