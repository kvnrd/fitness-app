# Phase 2: backend, auth, age gate and consent (record)

Status: code and SQL are written and tested locally. **No hosted Supabase, Apple or Google project exists.** Everything below that needs an account is on Kevin's checklist. Nothing here is legal advice; legal questions are listed at the end for Counsel and are not answered.

## Layout

- `supabase/migrations/*.sql` target real Supabase / Postgres 17 with `pgcrypto`.
- `supabase/tests/` holds the test-only pieces: `auth_stub.sql` (roles, `auth.uid()`, `tests.login()`), `pgcrypto_stub.sql` (PGlite only, **not encryption**), `rls.sql`, `run.mjs`.
- `supabase/config.toml` has no secrets.
- Client: `src/auth/` (`supabase.ts`, `secureStorage.ts`, `signIn.ts`, `SessionProvider.tsx`, `session.ts`, `onboarding.ts`, `consents.ts`, `parentLinks.ts`, `accountRequests.ts`). Screens: `src/app/sign-in.tsx`, `onboarding.tsx`, `parent-link.tsx`, `consent.tsx`.
- `AppStore` (training data) is still on in-memory mocks. Moving it to Supabase is a later phase.

## Run the tests

```bash
cd supabase/tests && npm install && node run.mjs         # PGlite (in-memory), pgcrypto stub
DATABASE_URL=postgres://postgres:postgres@localhost:5432/fitness_test node supabase/tests/run.mjs   # real psql + pgcrypto
```

With `DATABASE_URL` the runner **drops and recreates** the `public`, `private`, `app`, `auth`, `tests`, `extensions` schemas, so the database name must end in `_test`. CI uses a `postgres:17` service container with the throwaway password `postgres`; it is a test-only value for a disposable container.

PGlite cannot run pgcrypto, so the encryption tests there only prove plumbing and access control. CI runs them against real `pgp_sym_encrypt`.

The client screens have no automated tests yet; `npx tsc --noEmit` is the only check on them and it passes.

## Schema summary

| Table | Purpose | Client access |
|---|---|---|
| `private.encryption_keys` | Keys / pepper | none (zero grants, no policies) |
| `profiles` | id, display_name, birth_date, derived `is_minor` | read own (no `birth_date` column grant); update `display_name` only; coaches read consented clients |
| `user_roles` | `athlete`, `coach_pending`, `coach_verified`, `gym_admin`, `platform_admin` | read own row; no writes |
| `consents`, `consent_events` | `health_data`, `ai_vendor`, `coach_sharing`, `parental`; default not granted | read own (or as active parent); writes only via `record_consent` / `revoke_consent` |
| `parent_links` | minor to parent/guardian, `is_contracting_party` | read if party; writes via functions |
| `coach_relationships` | coach to client, `pending/active/ended` | read if party; writes via functions |
| `gyms`, `plans`, `plan_days`, `exercises`, `set_logs` | training data, aligned with `src/data/types.ts` | owner/assigned client; coach writes only while relationship is active; coach reads logs only with `coach_sharing` |
| `health_records` | field-level encrypted injury notes and health screen | none; only `write_health_record` / `read_health_record` |
| `coach_applications`, `trainer_codes` | coach onboarding stubs | read own (codes: no hash column) |
| `audit_log` | actions, no health values/emails/tokens | read own actions; platform admin reads all; insert only via definer |
| `data_export_requests`, `account_deletion_requests` | stubs | insert own, read own |

Every table has RLS enabled **and forced**, with all default Supabase grants revoked and explicit grants only. The `app` schema (policy helpers) and `private` schema must never be listed in the API's exposed schemas.

### Roles are server-side

RLS and the functions look up `user_roles` (through `SECURITY DEFINER` helpers). The `app_role` JWT claim added by `public.custom_access_token_hook` is only a client-side cache. A test forges that claim and confirms it grants nothing. Only `service_role` or a `platform_admin` can call `set_user_role`. The client reads its role with `SELECT ... FROM user_roles` (own row) and treats a missing row or an error as `athlete`.

### Age rules (as implemented; legal sufficiency is for Counsel)

`complete_signup(p_birth_date, p_display_name)`: under 13 raises `under_13_not_permitted` and keeps nothing; 13 to 15 raises `under_minimum_age` (product minimum is 16) and keeps nothing; 16 to 17 creates a minor profile that is not onboarded until an active, contracting-party `parent_links` row exists (`app.is_minor_onboarded`); 18+ is not a minor. A daily job should call `recompute_minor_flags()` so 17-year-olds flip at 18.

No column or JSON stores an Apple Declared Age Range or Google Play Age Signals payload, and the client never reads one. Only `birth_date` is kept.

## Encryption and key management

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
| signed out | `sign-in` |
| signed in, no `profiles` row | `onboarding` (age gate) |
| signed in, minor, no active contracting-party `parent_links` row | `parent-link` |
| otherwise | `(tabs)`, `workout/[day]`, plus `consent` and (adults) `parent-link` |

`isOnboarded` (SessionProvider): adults true; minors true only with an active contracting-party link; no profile or any query error is false (fail closed). It is UI gating only; RLS and `app.is_minor_onboarded` enforce the same rule on the server. While the first server read for a user is in flight the app shows the splash view, so onboarding does not flash.

Deep links `/onboarding`, `/parent-link`, `/consent` are on the allowlist only so the router can resolve them. Each mounts only in its own state and otherwise falls through to Train. They take no params and do nothing on open.

## How each Counsel item was handled

- **Consents.** `src/app/consent.tsx` shows three separate switches (`health_data`, `ai_vendor`, `coach_sharing`), off unless the server says granted, no "accept all". Each calls `record_consent(p_kind, p_policy_version[, p_for_user])` or `revoke_consent(p_kind[, p_for_user])`. State is read from `consents` and the screen shows what the server returns (an error shows "not granted"). None is required to continue. The server still refuses health writes and coach sharing without consent. The screen opens once per app session for a user with no consent rows, and is also reachable from Train → Account → Your choices (adults also get Link requests there). **Labels and `POLICY_VERSION = 'placeholder-v1'` are placeholders; Counsel supplies the real text and version.** The `parental` consent kind exists in SQL but is not shown.
- **Age / COPPA.** `onboarding.tsx` collects birth date (year/month/day) and an optional display name and calls `complete_signup`. The server computes the age; the client never computes, shows or stores one. Under 13 and under 16 both give the same generic message ("Sorry, you can't use this app."), no age or reason is echoed, the user is signed out, and the message is shown on the sign-in screen. Other errors give a generic retry message and never say whether an account exists. The screen states, as information and not legal advice: under 13 cannot create an account (COPPA), minimum age is 16, 16 to 17 are minors and a parent or guardian must be the contracting party before the account is fully active.
- **Parent as contracting party.** `parent_links.is_contracting_party` defaults true. A 16 to 17 account is not usable (`app.is_minor_onboarded`, enforced in RLS and functions) until one active contracting-party link exists. `parent-link.tsx` explains this. The email invite is a **stub**: it sends nothing, looks nothing up and stores nothing, because a client-side email lookup would be an account oracle. A "test path" that takes a typed parent user id and calls `link_parent` exists in `__DEV__` builds only (even a generic success/failure answer lets a caller test whether a user id exists). A signed-in adult sees pending requests on the same screen and can call `accept_parent_link`. The linked parent can switch consent toggles to act for the minor (`p_for_user`).
- **No raw store-age data.** No Apple Declared Age Range or Google Play Age Signals value is read, sent or stored; no column exists for it.

## Gaps and server work still needed

- **Under-13 account closure has no trigger.** `complete_signup` raises, which rolls back everything, so the database holds no record that an under-13 attempt happened. The client signs out but cannot delete the Auth user, and the Auth user (with its email) remains. `close_under_13_account(user_id)` is service-only. To use it, put an Edge Function in front of the signup call (the client calls the function with its JWT, the function calls `complete_signup` as that user and, on `under_13_not_permitted`, calls `close_under_13_account` with the service role). Not built.
- **Parent email invite** needs a server function that sends the same neutral response whether or not the email has an account. Not built.
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
6. Insert `health_v1` and `trainer_code_pepper` keys by hand (see Encryption).
7. Auth > Hooks: register `public.custom_access_token_hook` as the Custom Access Token hook.
8. Confirm the API exposed schemas are `public` only.
9. Schedule a daily `public.recompute_minor_flags()` (pg_cron or a scheduled function with the service role).
10. Create the first `platform_admin`: `select public.set_user_role('<user uuid>', 'platform_admin');` as service/owner.
11. Build and deploy the server-side `close_under_13_account` caller (Edge Function in front of `complete_signup`, see Gaps) and the parent-invite function. Both use the service role, which lives only in the function's environment.

Auth providers
12. Email OTP: enable email auth, set code length 6 and expiry, customize the email template to show the code (`{{ .Token }}`), configure SMTP.
13. Apple: create an App ID with Sign in with Apple, a Services ID and a key; enter them in Supabase Auth > Providers > Apple. For native iOS the bundle ID must be allowed as a client ID.
14. Google: create OAuth clients in Google Cloud (a Web client and an iOS client; an Android client only if wanted); put the Web and iOS client IDs in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; enter the Web client ID and secret in Supabase Auth > Providers > Google, and add the iOS ID as an authorized client ID. Client secrets stay in the Supabase dashboard, not in the repo.
15. Supabase Auth > URL configuration: set the site URL and the redirect URLs for the `fitnessapp://` scheme. Keep the list minimal.
16. Development build (`eas build --profile development`): Expo Go will not include Apple Sign In or SecureStore behavior you need to test.

Release
17. Counsel supplies consent text, privacy policy and a policy version; replace `POLICY_VERSION` in `src/auth/consents.ts` and the labels in `consent.tsx`.
18. Decide key custody (same database, Vault, or external KMS) before real health data is stored.

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
