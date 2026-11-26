# Hosted web preview (GitHub Pages)

A browser build of the app for Kevin and testers, hosted on GitHub Pages (Kevin, 2026-11-19).

- `.github/workflows/pages.yml` runs on pushes to `main` and `claude/**` branches (and by hand). It
  sets `experiments.baseUrl` to `/<repo>` for this build only (the site lives at
  `https://kvnrd.github.io/fitness-app/`), exports the web app, copies
  `index.html` to `404.html` so deep links like `/fitness-app/train` load the app, and deploys to Pages.
  It adds a `robots.txt` that disallows indexing.
- Sign-in is the same as every other build: an emailed 6-digit code (Supabase Auth, sent through the
  custom SMTP sender). The dev password sign-in and the `000000` sign-up code were removed. See
  `docs/runbooks/auth-email-and-apple.md`. Sign in with Apple shows on iOS only, so the web build offers
  email codes.
- Repository **variables** (Settings > Secrets and variables > Actions > Variables; public values only,
  from Supabase > Project Settings > API):
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  Without them the build runs as the in-memory prototype. Never add a service-role or secret key.
- One-time setup: Settings > Pages > Source: **GitHub Actions**. A private repository needs a paid
  GitHub plan for Pages, and the Pages site itself is public. Under Settings > Environments >
  github-pages, allow the branches that should deploy (by default only `main`).
- There is one site, so the last branch that deployed wins.
