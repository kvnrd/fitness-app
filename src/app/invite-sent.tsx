import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useAgeGate } from '../auth/AgeGateProvider';
import { startOAuth, useProviderAvailability } from '../auth/providers';
import { goBackOr, useLegalLinks } from '../onboarding/flow';
import { InviteSentScreen } from '../onboarding/screens/InviteSent';

export default function InviteSentRoute() {
  const { parentEmail, setMethod, hasPending } = useAgeGate();
  const avail = useProviderAvailability();
  const links = useLegalLinks();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Nothing to show without the in-memory parent email or the locked DOB answer (e.g. after an app restart).
  if (!parentEmail || !hasPending) return <Redirect href="/welcome" />;

  async function oauth(m: 'apple' | 'google') {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    setMethod(m);
    const r = await startOAuth(m);
    setBusy(false);
    if (!r.ok && r.message) setMessage(r.message);
  }

  return (
    <InviteSentScreen
      email={parentEmail}
      showApple={avail.apple}
      showGoogle={avail.google}
      onApple={() => void oauth('apple')}
      onGoogle={() => void oauth('google')}
      onEmail={() => {
        setMethod('email');
        router.push('/create');
      }}
      onBack={() => goBackOr('/invite-parent')}
      busy={busy}
      message={message}
      {...links}
    />
  );
}
