import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { submitHealthScreen } from '../../ai/api';
import { anyYes, emptyHealthAnswers, serializeHealthScreen, setHealthAnswer } from '../../ai/healthScreen';
import { HealthScreen } from '../../ai/screens/HealthScreen';
import { useSession } from '../../auth/SessionProvider';
import { GENERIC_FAILURE } from '../../onboarding/copy';

export default function HealthRoute() {
  const { profile } = useSession();
  const params = useLocalSearchParams<{ for?: string; name?: string }>();
  const forUser = typeof params.for === 'string' && params.for ? params.for : undefined;
  const teenName = typeof params.name === 'string' && params.name ? params.name : undefined;
  const selfTeen = !!profile?.is_minor && !forUser;
  const [answers, setAnswers] = useState(emptyHealthAnswers);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onContinue() {
    setBusy(true);
    setMessage(null);
    const yes = anyYes(answers);
    const r = await submitHealthScreen({ payload: serializeHealthScreen(answers), anyYes: yes, forUser });
    setBusy(false);
    if (!r.ok) {
      setMessage(r.reason === 'parent_required' || selfTeen ? 'Please complete this together with a parent.' : GENERIC_FAILURE);
      return;
    }
    if (yes) {
      router.replace({ pathname: '/ai/clearance', params: { ...(forUser ? { for: forUser } : {}), ...(teenName ? { name: teenName } : {}) } });
    } else {
      router.replace('/ai/quiz');
    }
  }

  return (
    <HealthScreen
      answers={answers}
      onAnswer={(i, v) => setAnswers((a) => setHealthAnswer(a, i, v))}
      teenName={teenName}
      onBack={() => router.back()}
      onContinue={() => void onContinue()}
      busy={busy}
      message={message}
    />
  );
}
