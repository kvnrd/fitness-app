import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoCrypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createDeviceFlags } from './deviceFlags.ts';
import { createDeviceSetupStore, type KeyValueAdapter } from './deviceSetupStore.ts';

/**
 * React Native adapters for deviceSetupStore.
 *  - Draft (units, accent, gym, styles): non-secret preferences -> AsyncStorage on every platform.
 *  - Weight goal: health data -> SecureStore on native. On web there is no safe, simple encryption
 *    (any script on the page could read localStorage or a key in JS), so the value is kept in memory
 *    only and is lost on refresh. Never use AsyncStorage/localStorage for it on web.
 * Values stay small (< 2 KB) so SecureStore's size limit is never hit. Never store tokens here.
 */
const safe = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, '_');

const asyncAdapter: KeyValueAdapter = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

/** In-memory only. Used for the weight goal on web so it never lands in localStorage. */
const memoryAdapter: KeyValueAdapter = (() => {
  const m = new Map<string, string>();
  return {
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => {
      m.set(k, v);
    },
    removeItem: async (k) => {
      m.delete(k);
    },
  };
})();

const secureAdapter: KeyValueAdapter = {
  getItem: (k) => SecureStore.getItemAsync(safe(k)),
  setItem: (k, v) => SecureStore.setItemAsync(safe(k), v, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }),
  removeItem: (k) => SecureStore.deleteItemAsync(safe(k)),
};

export const deviceSetupStore = createDeviceSetupStore({
  draftStorage: asyncAdapter,
  weightStorage: Platform.OS === 'web' ? memoryAdapter : secureAdapter,
});


/** Goal-done marker + per-install rate-limit id (AsyncStorage; neither is secret). */
export const deviceFlags = createDeviceFlags(asyncAdapter, () => ExpoCrypto.randomUUID());
