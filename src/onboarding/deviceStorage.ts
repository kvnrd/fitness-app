import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoCrypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createDeviceFlags } from './deviceFlags.ts';
import { createDeviceSetupStore, type KeyValueAdapter } from './deviceSetupStore.ts';

/**
 * React Native adapters for deviceSetupStore.
 *  - Draft (units, accent, gym, styles): non-secret preferences -> AsyncStorage on every platform.
 *  - Weight goal: health data -> SecureStore on native.
 *    TODO: web has no secure store; it falls back to AsyncStorage (localStorage), readable by any script on
 *    the page. Acceptable only because the value is tiny and never leaves the device; revisit before a web launch.
 * Values stay small (< 2 KB) so SecureStore's size limit is never hit. Never store tokens here.
 */
const safe = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, '_');

const asyncAdapter: KeyValueAdapter = {
  getItem: (k) => AsyncStorage.getItem(k),
  setItem: (k, v) => AsyncStorage.setItem(k, v),
  removeItem: (k) => AsyncStorage.removeItem(k),
};

const secureAdapter: KeyValueAdapter = {
  getItem: (k) => SecureStore.getItemAsync(safe(k)),
  setItem: (k, v) => SecureStore.setItemAsync(safe(k), v, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }),
  removeItem: (k) => SecureStore.deleteItemAsync(safe(k)),
};

export const deviceSetupStore = createDeviceSetupStore({
  draftStorage: asyncAdapter,
  weightStorage: Platform.OS === 'web' ? asyncAdapter : secureAdapter,
});


/** Goal-done marker + per-install rate-limit id (AsyncStorage; neither is secret). */
export const deviceFlags = createDeviceFlags(asyncAdapter, () => ExpoCrypto.randomUUID());
