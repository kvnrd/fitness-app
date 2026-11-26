# Testing on the iPhone Simulator, with a quick test sign-in

Dev only. Nothing here changes the app: sign-in is still a real emailed 6-digit code.

## One-time setup

1. Install **Xcode** from the Mac App Store (free, no paid Apple developer account needed).
2. Open Xcode once, accept the license, and let it install the **iOS** platform (Simulator).
3. In Terminal: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
4. Fill in `.env.dev-tools` in the repo root (git-ignored, never committed):
   - `SUPABASE_SERVICE_ROLE_KEY=` the **dev** project's service_role key
     (Supabase dashboard > dev project > Project Settings > API keys). Server-only: never put it in an
     `EXPO_PUBLIC_*` variable or anywhere in `src/`.
   - `DEV_TEST_EMAIL=` the address you sign in with on the Simulator. A plus-address of your own mailbox
     (for example `you+sim@gmail.com`) is best: it's a real inbox, so the codes Supabase still sends via
     Resend don't bounce.

## Run the app on the Simulator

```bash
npx expo start
```

Press `i`. Expo opens the Simulator and installs Expo Go the first time.

## Sign in without opening the email

1. In the app, type your `DEV_TEST_EMAIL` and tap send.
2. In a second Terminal tab: `npm run dev:code`
3. Type the 6-digit code it prints.

`scripts/dev-sign-in-code.mjs` asks Supabase's admin API for a fresh code (`generateLink`), which does not
send an email and replaces the code the app just asked for, so run it *after* tapping send. It refuses to
run unless the Supabase URL is the dev project (`wwefprkzgkmomjqtzgos`). The first time, use the
"create account" path so the account exists; after that, "I already have an account" works too.

Apple sign-in in the Simulator needs an Apple ID signed in under the Simulator's Settings.
