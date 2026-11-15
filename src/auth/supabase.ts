import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { authStorage } from './secureStorage';

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

function build(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  try {
    return createClient(URL_ENV!.trim(), ANON_ENV!.trim(), {
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
