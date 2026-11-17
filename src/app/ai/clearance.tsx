import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { attestHealthClearance } from '../../ai/api';
import { CLEARANCE_ACK, parentClearanceAck } from '../../ai/healthScreen';
import { HealthClearanceScreen } from '../../ai/screens/HealthClearance';
import { GENERIC_FAILURE } from '../../onboarding/copy';

export default function ClearanceRoute() {
  const params = useLocalSearchParams<{ for?: string; name?: string }>();
  const forUser = typeof params.for === 'string' && params.for ? params.for : undefined;
  const teenName = typeof params.name === 'string' && params.name ? params.name : undefined;
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onContinue() {
    if (!confirmed) return;
    setBusy(true);
    setMessage(null);
    const r = await attestHealthClearance(teenName ? parentClearanceAck(teenName) : CLEARANCE_ACK, forUser);
    setBusy(false);
    if (!r.ok) {
      setMessage(r.reason === 'parent_required' ? 'Please complete this together with a parent.' : GENERIC_FAILURE);
      return;
    }
    router.replace('/ai/quiz');
  }

  return (
    <HealthClearanceScreen
      confirmed={confirmed}
      onConfirmed={setConfirmed}
      teenName={teenName}
      onBack={() => router.back()}
      onContinue={() => void onContinue()}
      busy={busy}
      message={message}
    />
  );
}
