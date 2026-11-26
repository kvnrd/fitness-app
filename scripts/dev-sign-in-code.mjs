/**
 * DEV ONLY. Prints a fresh 6-digit sign-in code for an account on the DEV Supabase project, so you can
 * sign in on the Simulator without opening the email. Nothing here ships in the app: the app is unchanged
 * and still uses real emailed codes.
 *
 *   npm run dev:code                 (uses DEV_TEST_EMAIL from .env.dev-tools)
 *   npm run dev:code -- you@example.com
 *
 * How to use: in the app, type the email and tap send. Then run this and type the code it prints.
 * (Run it after tapping send: a new code replaces the older one, and this does not send an email.)
 *
 * Needs `.env.dev-tools` (git-ignored) with:
 *   SUPABASE_SERVICE_ROLE_KEY=...   (dev project only; never in EXPO_PUBLIC_*, never committed)
 *   DEV_TEST_EMAIL=...              (optional default address)
 * Refuses to run against any project except the dev project.
 */
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const DEV_PROJECT_HOST = 'wwefprkzgkmomjqtzgos.supabase.co';

for (const f of ['.env.local', '.env.dev-tools']) if (existsSync(f)) process.loadEnvFile(f);

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.argv[2] ?? process.env.DEV_TEST_EMAIL ?? '').trim().toLowerCase();

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!url || new URL(url).host !== DEV_PROJECT_HOST) fail(`Refusing: this only works on the dev project (${DEV_PROJECT_HOST}).`);
if (process.env.EXPO_PUBLIC_ENV === 'production') fail('Refusing: EXPO_PUBLIC_ENV is production.');
if (!key || key.includes('paste')) fail('Add SUPABASE_SERVICE_ROLE_KEY to .env.dev-tools (Supabase dashboard > Project Settings > API keys).');
if (!/^[^\s@]+@[^\s@]+$/.test(email)) fail('usage: npm run dev:code -- <email>   (or set DEV_TEST_EMAIL in .env.dev-tools)');

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
if (error || !data?.properties?.email_otp) {
  fail('No code. In the app, type this email and tap send first (that creates the account if it is new).');
}
console.log(`\nCode for ${email}:  ${data.properties.email_otp}\n`);
