import { router } from 'expo-router';
import { useCallback } from 'react';
import { startOAuth } from '../auth/providers';
import type { AgeBand } from '../auth/ageGate';
import { SignupMethod, useAgeGate } from '../auth/AgeGateProvider';

/** Back that never dead-ends: pops when possible, otherwise goes to a fixed fallback route. */
export function goBackOr(fallback: '/welcome' | '/method' | '/create' | '/invite-parent') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

export function useLegalLinks() {
  return {
    onTerms: useCallback(() => router.push('/legal/terms'), []),
    onPrivacy: useCallback(() => router.push('/legal/privacy'), []),
  };
}

/**
 * Where to go once the date of birth has been accepted (it is then LOCKED: nothing navigates back to it).
 * 16-17 → Parent help. 18+: email → Create; Apple/Google → the OAuth sheet starts now, never earlier.
 * `how`: 'replace' from the DOB screen (it leaves the history), 'push' from Method.
 * Returns an error message only when an OAuth attempt failed or was cancelled (empty string = cancelled).
 */
export function useProceedAfterDob() {
  const { setMethod } = useAgeGate();
  return useCallback(
    async (band: AgeBand, method: SignupMethod, how: 'replace' | 'push'): Promise<string | null> => {
      setMethod(method);
      const go = how === 'replace' ? router.replace : router.push;
      if (band === '16_17') {
        go('/parent-help');
        return null;
      }
      if (method === 'email') {
        go('/create');
        return null;
      }
      const r = await startOAuth(method);
      return r.ok ? null : r.message;
    },
    [setMethod],
  );
}
