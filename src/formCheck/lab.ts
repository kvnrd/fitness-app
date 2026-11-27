/**
 * Form check lab: a dev-only camera screen for testing pose tracking and rep counting on a real
 * phone before the product screens exist (they wait for approved copy). Never in a store build:
 * on only when EXPO_PUBLIC_FORM_CHECK_LAB === '1' and EXPO_PUBLIC_ENV isn't 'production'.
 */
// Expo inlines EXPO_PUBLIC_* only on direct `process.env.NAME` reads, so read them here, not via process.env[...].
const BUILD_ENV = {
  EXPO_PUBLIC_FORM_CHECK_LAB: process.env.EXPO_PUBLIC_FORM_CHECK_LAB,
  EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
};

export function formCheckLabEnabled(env: Record<string, string | undefined> = BUILD_ENV): boolean {
  return env.EXPO_PUBLIC_FORM_CHECK_LAB === '1' && env.EXPO_PUBLIC_ENV !== 'production';
}
