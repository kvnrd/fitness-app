import { router } from 'expo-router';
import { useState } from 'react';
import { acceptTerms } from '../../legal/termsApi';
import { ReacceptTermsScreen } from '../../legal/screens/ReacceptTerms';
import { GENERIC_FAILURE } from '../../onboarding/copy';
import { useSession } from '../../auth/SessionProvider';

export default function ReacceptTermsRoute() {
  const { refreshRole } = useSession();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onAccept() {
    if (!checked) return;
    setBusy(true);
    setMessage(null);
    const ok = await acceptTerms();
    setBusy(false);
    if (!ok) {
      setMessage(GENERIC_FAILURE);
      return;
    }
    await refreshRole();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  return (
    <ReacceptTermsScreen
      checked={checked}
      onChecked={setChecked}
      onOpenTerms={() => router.push('/legal/terms')}
      onAccept={() => void onAccept()}
      busy={busy}
      message={message}
    />
  );
}
