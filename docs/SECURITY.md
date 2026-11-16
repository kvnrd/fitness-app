# Security (Phase 0)

## What Phase 0 did

- **.gitignore**: env files (`.env.example` is the only one committed), keystores/keys/certs, service-account and Firebase files, Supabase local folders.
- **Role guard (client-side stopgap)**: `src/auth/session.ts` is the only place the app reads a role (`athlete` default, `coach_pending`, `coach_verified`). Studio is hidden from the tab bar and its route redirects to Train unless the role is `coach_verified`. The role is never persisted or settable in production. In `__DEV__` only, `EXPO_PUBLIC_DEV_ROLE` can preview Studio.
- **Secret scanning**: `.githooks/pre-commit` runs gitleaks on staged changes; CI scans full history.
- **CI**: `.github/workflows/ci.yml` runs typecheck and gitleaks (binary v8.28.0, `--redact`, no licensed action).
- **Logging**: `src/utils/log.ts` logs a message plus allowlisted primitive context only. Never log raw objects (weight, logs, photos, tokens, emails).
- **Deep links**: scheme `fitnessapp`. `src/app/+native-intent.tsx` + `src/utils/deepLinks.ts` allow only `/`, `/progress`, `/studio` (still role-guarded), `/sign-in`, `/onboarding`, `/parent-link`, `/consent`, and `/workout/<mon..sun>`. Anything else goes to Train; `+not-found.tsx` redirects unknown routes to Train.

**Hiding Studio in the app is a stopgap, not security.** Anyone can modify a client. Phase 2 will enforce roles on the server (signed claim / RLS).

## Phase 2 (server-side roles, auth, age gate, consent)

Roles now come from `public.user_roles` behind RLS, sessions live in SecureStore, health fields are encrypted in the database, and signup has an age gate with parent/guardian handling for 16 to 17 year olds and separate opt-in consents. Hiding Studio in the client is still only UI; RLS is the enforcement. Details, the key-management caveats, Kevin's setup checklist and the open legal questions are in [phase-2-backend.md](./phase-2-backend.md).

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
