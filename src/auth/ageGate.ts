import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StoreAgeSignal } from '../age/storeAgeSignal';
import { supabase } from './supabase';

/**
 * Neutral age screen helpers (Counsel C6, Q3, Q4).
 *
 * - The date of birth is asked BEFORE any email or auth account. It lives only in memory (the
 *   AgeGateProvider) until complete_signup runs, then it is dropped. It is never persisted or logged.
 * - After a "not eligible" answer the device gets a flag with NO personal data (no date, no age, no
 *   email), so going back and typing an older date does not work. Clearing app data removes it;
 *   that is accepted (Counsel asks for a device flag, not device fingerprinting).
 */
const FLAG_KEY = 'age_gate_v1';
const FLAG_VALUE = 'not_eligible';

export async function readIneligibleFlag(): Promise<boolean> {
  try {
    const v = Platform.OS === 'web' ? await AsyncStorage.getItem(FLAG_KEY) : await SecureStore.getItemAsync(FLAG_KEY);
    return v === FLAG_VALUE;
  } catch {
    return false;
  }
}

export async function writeIneligibleFlag(): Promise<void> {
  try {
    if (Platform.OS === 'web') await AsyncStorage.setItem(FLAG_KEY, FLAG_VALUE);
    else await SecureStore.setItemAsync(FLAG_KEY, FLAG_VALUE);
  } catch {
    // Best effort; the server still refuses the account.
  }
}

export type AgeBand = '16_17' | '18_plus';

/** Memory only. `band` comes from the server's screen_age answer (never computed on the client). */
export type PendingAge = { birthDateIso: string; store: StoreAgeSignal | null; band: AgeBand | null };

export type ScreenResult = { kind: 'eligible'; band: AgeBand } | { kind: 'ineligible' } | { kind: 'retry' };

/** Calls public.screen_age (anon). The server stores nothing about the person; only yes/no + band come back. */
export async function screenAge(p: Pick<PendingAge, 'birthDateIso' | 'store'>): Promise<ScreenResult> {
  if (!supabase) return { kind: 'retry' };
  try {
    const { data, error } = await supabase.rpc('screen_age', {
      p_birth_date: p.birthDateIso,
      p_store_lower: p.store?.lower ?? null,
      p_store_upper: p.store?.upper ?? null,
      p_store_source: p.store?.source ?? null,
    });
    if (error || !data || typeof data !== 'object') return { kind: 'retry' };
    const d = data as { eligible?: unknown; band?: unknown };
    if (d.eligible !== true) return { kind: 'ineligible' };
    // Fail closed: an eligible answer without a known band is not trusted.
    return d.band === '16_17' || d.band === '18_plus' ? { kind: 'eligible', band: d.band } : { kind: 'retry' };
  } catch {
    return { kind: 'retry' };
  }
}
