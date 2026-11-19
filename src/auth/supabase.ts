import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { authStorage } from './secureStorage';
import { deviceFlags } from '../onboarding/deviceStorage';

/**
 * Supabase client. Public URL + anon key ONLY. Never put a service-role key (or any encryption
 * key) in the app: EXPO_PUBLIC_* values are bundled and readable by anyone with the app.
 *
 * Env vars must be referenced statically so Expo can inline them at build time.
 */
const URL_ENV = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_ENV = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const PLACEHOLDER_RE = /^(your[-_ ]|<|changeme|change-me|todo|xxx)|example\.(com|org|net)|placeholder|your-(url|anon|project)/i;

function usable(value: string | undefined): value is string {
  const v = value?.trim();
  return !!v && !PLACEHOLDER_RE.test(v);
}

function validUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  return usable(URL_ENV) && usable(ANON_ENV) && validUrl(URL_ENV.trim());
}


/** App version and a per-install id, sent as request headers so consent_events can record a peppered device hash and the app version. The server hashes the device id; we never send a raw IP (the platform sets that). */
function appVersionHeader(): string {
  const v = Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? 'dev';
  return String(v).slice(0, 32);
}

let cachedDeviceId: string | null = null;
void deviceFlags
  .installId()
  .then((id) => {
    cachedDeviceId = id;
  })
  .catch(() => {});

function withConsentHeaders(headers: HeadersInit | undefined): Headers {
  const h = new Headers(headers);
  if (!h.has('x-app-version')) h.set('x-app-version', appVersionHeader());
  if (cachedDeviceId && !h.has('x-device-id')) h.set('x-device-id', cachedDeviceId);
  return h;
}

function build(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient(URL_ENV!.trim(), ANON_ENV!.trim(), {
      global: {
        headers: { 'x-app-version': appVersionHeader() },
        fetch: (input, init) => fetch(input, { ...init, headers: withConsentHeaders(init?.headers) }),
      },
      auth: {
        storage: authStorage,
        storageKey: 'sb-fitness-auth',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // no OAuth redirect parsing: native has no URL, web uses no redirect flow
        flowType: 'pkce', // keep PKCE on
      },
    });
  } catch {
    return null; // never crash at import
  }
}

/** Null when Supabase is unconfigured: the prototype runs on the in-memory fallback. */
export const supabase: SupabaseClient | null = build();

/**
 * DEV ONLY: a client that never stores or broadcasts its session, for the mocked sign-up code
 * (src/auth/signIn.ts). With auto-confirm on, signUp returns a session; doing it here keeps that session
 * out of the app's client so the flow still stops at the Verify screen.
 */
export function devThrowawayClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient(URL_ENV!.trim(), ANON_ENV!.trim(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'sb-fitness-dev-mock' },
    });
  } catch {
    return null;
  }
}
