# Real sign-in: email codes (Resend SMTP) and Sign in with Apple

Kevin, 2026-11-26: replace the dev password sign-in and the `000000` sign-up code with real sign-in so
testers can use the app. The app code was already built for this in Phase 2/3 (`src/auth/signIn.ts`);
what was missing is project configuration.

## How sign-in works in the app

- **New account (email):** Create screen calls `supabase.auth.signUp` (email + 12+ character password),
  Supabase emails a 6-digit code (confirm-signup template), Verify screen calls
  `verifyOtp({ type: 'signup' })`.
- **Existing account (email):** Sign-in screen calls `signInWithOtp({ shouldCreateUser: false })`, Supabase
  emails a 6-digit code (magic-link template), then `verifyOtp({ type: 'email' })`. There is no password
  sign-in screen.
- **Apple (iOS only):** `expo-apple-authentication` returns an identity token, the app calls
  `signInWithIdToken({ provider: 'apple' })` with a raw nonce. Native sign-in needs only the app's bundle
  ID in Supabase's Apple client IDs. A Services ID and `.p8` key are needed only for Apple sign-in on the
  web, which the app does not offer.
- Every error is generic, so the screens can't be used to probe which emails have accounts.

## Supabase dev project (wwefprkzgkmomjqtzgos) state

Done by Claude via the Management API on 2026-11-26:

- Code expiry `mailer_otp_exp` = 600 (10 minutes), code length 6.
- `password_min_length` = 12 (matches `PASSWORD_MIN`).
- Apple provider enabled with client ID `host.exp.Exponent` (Expo Go's bundle ID), so Apple sign-in can
  be tested in Expo Go on an iPhone.

Blocked until custom SMTP is set (Supabase refuses template edits on the free tier's built-in mailer):

- Templates that show the code (`{{ .Token }}`) instead of a link, for confirm-signup and magic-link.
  Today's templates still contain only a link, which the app can't use.
- Turning **off** `mailer_autoconfirm`. While it is on, sign-up skips the code and signs straight in.

## Kevin's steps

1. **Resend:** create an account, add a domain on your Hostinger domain (a subdomain such as
   `mail.<domain>` keeps the root domain's reputation separate), and add the DNS records Resend shows
   (SPF/MX on `send.`, DKIM `resend._domainkey`, optional DMARC) in Hostinger's DNS zone. Wait for
   Resend to say **Verified**. Create an API key with **Sending access** only.
2. **Supabase SMTP:** Dashboard > Authentication > Emails > SMTP Settings. Host `smtp.resend.com`,
   port `465`, username `resend`, password = the Resend API key, sender email `no-reply@<your domain>`,
   sender name as you like. Enter the key there yourself; it never goes in the repo or the chat.
3. Tell Claude when step 2 is saved. Claude then applies the code templates and turns autoconfirm off,
   and tests a real code end to end.
4. **Apple, for TestFlight/store builds later:** choose the bundle ID (`ios.bundleIdentifier` in
   `app.json`, not set yet because the app name isn't decided), enable **Sign in with Apple** on that App
   ID in the Apple Developer portal (needs the paid Apple Developer Program), and add the bundle ID to
   Supabase's Apple client IDs next to `host.exp.Exponent`.

## Template wording (applied in step 3)

Subjects: `{{ .Token }} is your confirmation code` / `{{ .Token }} is your sign-in code`. Body: a heading,
"Enter this code in the app to finish signing up:" (or "to sign in:"), the code in large type, and "The
code expires in 10 minutes. If you didn’t ask for it, you can ignore this email." This is placeholder
wording pending Kevin's OK.
