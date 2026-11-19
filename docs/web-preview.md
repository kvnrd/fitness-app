# Hosted web preview (GitHub Pages)

A browser build of the app for Kevin and testers, hosted on GitHub Pages (Kevin, 2026-11-19).

- `.github/workflows/pages.yml` runs on pushes to `main` and `claude/**` branches (and by hand). It
  sets `experiments.baseUrl` to `/<repo>` for this build only (the site lives at
  `https://kvnrd.github.io/fitness-app/`), exports the web app with `EXPO_PUBLIC_WEB_PREVIEW=1`, copies
  `index.html` to `404.html` so deep links like `/fitness-app/train` load the app, and deploys to Pages.
  It adds a `robots.txt` that disallows indexing.
- `EXPO_PUBLIC_WEB_PREVIEW=1` turns on the dev password sign-in and the `000000` sign-up code
  (`DEV_PASSWORD_SIGN_IN` in `src/auth/signIn.ts`) **on web only**. Native store builds can't enable it,
  and `EXPO_PUBLIC_ENV=production` turns it off everywhere. Remove both once Supabase SMTP is set up.
- Repository **variables** (Settings > Secrets and variables > Actions > Variables; public values only,
  from Supabase > Project Settings > API):
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  Without them the build runs as the in-memory prototype. Never add a service-role or secret key.
- One-time setup: Settings > Pages > Source: **GitHub Actions**. A private repository needs a paid
  GitHub plan for Pages, and the Pages site itself is public. Under Settings > Environments >
  github-pages, allow the branches that should deploy (by default only `main`).
- There is one site, so the last branch that deployed wins.
