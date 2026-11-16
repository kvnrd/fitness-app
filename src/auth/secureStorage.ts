import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage adapter for the Supabase auth session (access + refresh tokens).
 *
 * Native: expo-secure-store (Keychain / Keystore), never AsyncStorage. SecureStore values are
 * limited to ~2048 bytes and a Supabase session JSON often exceeds that, so values are split
 * into chunks: "<key>.n" holds the chunk count, "<key>.0", "<key>.1"... hold the pieces.
 * Chunks are 600 chars (<= 1800 bytes even at 3 bytes/char).
 *
 * Web: SecureStore does not exist. We use an in-memory Map: tokens are NOT written to
 * localStorage (readable by any script on the page). Tradeoff: web sessions do not survive a
 * reload; users sign in again. Acceptable for a mobile-first app.
 */
const CHUNK = 600;
const OPTIONS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };
// SecureStore keys allow only [A-Za-z0-9._-]
const safe = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, '_');

const memory = new Map<string, string>();

async function readCount(key: string): Promise<number> {
  const n = Number(await SecureStore.getItemAsync(key + '.n', OPTIONS));
  return Number.isInteger(n) && n > 0 ? n : 0;
}

const nativeStorage = {
  async getItem(rawKey: string): Promise<string | null> {
    const key = safe(rawKey);
    const count = await readCount(key);
    if (count === 0) return null;
    let out = '';
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(key + '.' + i, OPTIONS);
      if (part == null) return null; // torn write: treat as signed out
      out += part;
    }
    return out;
  },
  async setItem(rawKey: string, value: string): Promise<void> {
    const key = safe(rawKey);
    const parts: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK) parts.push(value.slice(i, i + CHUNK));
    const oldCount = await readCount(key);
    for (let i = 0; i < parts.length; i++) await SecureStore.setItemAsync(key + '.' + i, parts[i], OPTIONS);
    await SecureStore.setItemAsync(key + '.n', String(parts.length), OPTIONS);
    for (let i = parts.length; i < oldCount; i++) await SecureStore.deleteItemAsync(key + '.' + i, OPTIONS);
  },
  async removeItem(rawKey: string): Promise<void> {
    const key = safe(rawKey);
    const count = await readCount(key);
    await SecureStore.deleteItemAsync(key + '.n', OPTIONS);
    for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(key + '.' + i, OPTIONS);
  },
};

const memoryStorage = {
  async getItem(key: string): Promise<string | null> {
    return memory.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memory.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    memory.delete(key);
  },
};

export const authStorage = Platform.OS === 'web' ? memoryStorage : nativeStorage;
