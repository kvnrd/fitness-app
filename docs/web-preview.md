# Hosted web preview (Vercel)

A browser build of the app for Kevin and testers, hosted on Vercel (Kevin, 2026-11-19).

- `vercel.json` builds a static web export with `EXPO_PUBLIC_WEB_PREVIEW=1` into `dist/` and sends every
  app route to `index.html` (Expo Router single-page output). Pages are served with `noindex`.
- `EXPO_PUBLIC_WEB_PREVIEW=1` turns on the dev password sign-in and the `000000` sign-up code
  (`DEV_PASSWORD_SIGN_IN` in `src/auth/signIn.ts`) **on web only**. Native store builds can't enable it,
  and `EXPO_PUBLIC_ENV=production` turns it off everywhere. Remove both once Supabase SMTP is set up.
- Vercel project environment variables (public values only, from Supabase > Project Settings > API):
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  Never add a service-role or secret key.
- Every pushed branch gets a preview URL; the production URL follows `main`.
