# Security (Phase 0)

## What Phase 0 did

- **.gitignore**: env files (`.env.example` is the only one committed), keystores/keys/certs, service-account and Firebase files, Supabase local folders.
- **Role guard (client-side stopgap)**: `src/auth/session.ts` is the only place the app reads a role (`athlete` default, `coach_pending`, `coach_verified`). Studio is hidden from the tab bar and its route redirects to Train unless the role is `coach_verified`. The role is never persisted or settable in production. In `__DEV__` only, `EXPO_PUBLIC_DEV_ROLE` can preview Studio.
- **Secret scanning**: `.githooks/pre-commit` runs gitleaks on staged changes; CI scans full history.
- **CI**: `.github/workflows/ci.yml` runs typecheck and gitleaks (binary v8.28.0, `--redact`, no licensed action).
- **Logging**: `src/utils/log.ts` logs a message plus allowlisted primitive context only. Never log raw objects (weight, logs, photos, tokens, emails).
- **Deep links**: scheme `fitnessapp`. `src/app/+native-intent.tsx` + `src/utils/deepLinks.ts` allow only `/`, `/progress`, `/studio` (still role-guarded), `/age`, `/not-eligible`, `/sign-in`, `/onboarding`, `/parent-link`, `/consent`, and `/workout/<mon..sun>`. Anything else goes to Train; `+not-found.tsx` redirects unknown routes to Train.

**Hiding Studio in the app is a stopgap, not security.** Anyone can modify a client. Phase 2 will enforce roles on the server (signed claim / RLS).

## Phase 2 (server-side roles, auth, age gate, consent)

Roles now come from `public.user_roles` behind RLS, sessions live in SecureStore, health fields are encrypted in the database, and signup has an age gate with parent/guardian handling for 16 to 17 year olds and separate opt-in consents. Hiding Studio in the client is still only UI; RLS is the enforcement. Details, the key-management caveats, Kevin's setup checklist and the open legal questions are in [phase-2-backend.md](./phase-2-backend.md).

## Phase 2b (Counsel's legal answers)

- **Health data: KMS envelope encryption.** Per-user data keys from AWS KMS (encryption context bound to the user). Fields are AES-256-GCM with AAD bound to user and field. Plaintext and unwrapped keys exist only inside the `health-record` server function. The database and its backups hold only ciphertext and wrapped keys, so a stolen backup can't be decrypted without KMS. Revoking consent leads to crypto-shredding (deleting the wrapped key).
- **Server secrets** (`SUPABASE_SERVICE_ROLE_KEY`, AWS credentials, `ANTHROPIC_API_KEY`) are function secrets only. They never go in `EXPO_PUBLIC_*`, `app.json`, the repo or logs. The KMS IAM principal may only `GenerateDataKey` / `Decrypt` on one key with the app's encryption context.
- **No date of birth stored.** Only `age_band` / `adult_on`. Ineligible sign-ups are deleted in the same request, and the device keeps a non-personal flag.
- **AI:** Anthropic Messages API from the backend only. Enum-only input, no identifiers, a random request id, an output filter, a per-user rate limit, and nothing sent back to Anthropic.
- **New service-only functions** (`private.require_service()`): `health_*`, `ai_plan_context`, `run_retention_purge`, `purge_*`, `claim_pending_minor_reminders`, `set_coach_identity_check`, `set_litigation_hold`. RLS stays enabled and forced on every new table (`purchases`, `progress_photos`, `retention_policies`, `user_data_keys`, ...), with deny by default.
- Edge Functions return generic error codes only. They never return SQL, KMS or Anthropic errors.

Details and setup: [phase-2-backend.md › Phase 2b](./phase-2-backend.md#phase-2b-counsels-legal-answers).

## Install gitleaks and enable the hook

- macOS: `brew install gitleaks`
- Other: download a release from https://github.com/gitleaks/gitleaks/releases

`npm install` runs `prepare`, which sets `git config core.hooksPath .githooks` (skipped silently if git is absent). Manual: `git config core.hooksPath .githooks`.

## Follow-ups for the repo owner (GitHub settings)

- Enable secret scanning and push protection.
- Add branch protection on `main` (require the CI jobs).

## Known npm audit leftovers

3 moderate: minimatch DoS (GHSA-g3hv-75wg-m249) via `@expo/fingerprint` → `expo`. The only advertised fix (`npm audit fix --force`) installs expo@52, which breaks SDK 58. Left in place; revisit on the next Expo SDK upgrade. The safe patch bump expo 58.0.24 → 58.0.25 was applied.

## Rules

- No secrets in the repo, `app.json` `extra`, or logs. `EXPO_PUBLIC_*` values ship inside the app; treat them as public.
- Video URI allowlisting is Phase 6 (not done).
- Open legal/compliance questions (e.g. health-data handling) are not answered here; they need review by someone qualified.
- Never call real third-party APIs (KMS, Anthropic) from tests; mock them.
