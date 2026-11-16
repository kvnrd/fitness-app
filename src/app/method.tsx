import { router } from 'expo-router';
import { useState } from 'react';
import { useAgeGate } from '../auth/AgeGateProvider';
import { useProviderAvailability } from '../auth/providers';
import { goBackOr, useLegalLinks, useProceedAfterDob } from '../onboarding/flow';
import { MethodScreen } from '../onboarding/screens/Method';
import { SignupMethod } from '../auth/AgeGateProvider';

/**
 * Picking a method only remembers the choice (memory) and goes to the date of birth. OAuth never starts
 * before the DOB. If the DOB was already accepted (e.g. Android back from a later screen), it is locked:
 * go straight on with the new choice instead of asking again.
 */
export default function MethodRoute() {
  const { getPending, setMethod } = useAgeGate();
  const avail = useProviderAvailability();
  const links = useLegalLinks();
  const proceed = useProceedAfterDob();
  const [busy, setBusy] = useState(false);

  async function pick(m: SignupMethod) {
    if (busy) return;
    const pending = getPending();
    if (pending?.band) {
      setBusy(true);
      await proceed(pending.band, m, 'push');
      setBusy(false);
      return;
    }
    setMethod(m);
    router.push('/age');
  }

  return (
    <MethodScreen
      showApple={avail.apple}
      showGoogle={avail.google}
      onApple={() => void pick('apple')}
      onGoogle={() => void pick('google')}
      onEmail={() => void pick('email')}
      onBack={() => goBackOr('/welcome')}
      onSignIn={() => router.push('/sign-in')}
      {...links}
    />
  );
}
