import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { useAgeGate } from '../auth/AgeGateProvider';
import { resendSignupCode, verifySignupCode } from '../auth/signIn';
import { goBackOr } from '../onboarding/flow';
import { VerifyScreen } from '../onboarding/screens/Verify';

const RESEND_SECONDS = 60;

/**
 * Account · Step 3 of 8. verifyOtp({type:'signup'}) creates the session; the root gate then runs
 * complete_signup. "Wrong email? Change" goes back to Create, never to the date of birth.
 */
export default function VerifyRoute() {
  const { signupEmail } = useAgeGate();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const inFlight = useRef(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function verify(c: string) {
    if (inFlight.current || c.length !== 6) return;
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    const r = await verifySignupCode(signupEmail, c);
    inFlight.current = false;
    setBusy(false);
    if (!r.ok) {
      setMessage(r.message);
      setCode('');
    }
  }

  if (!signupEmail) return <Redirect href="/create" />;

  return (
    <VerifyScreen
      email={signupEmail}
      code={code}
      onCode={(v) => {
        setCode(v);
        if (v.length === 6) void verify(v); // verifies as soon as all 6 digits are in (paste works)
      }}
      onVerify={() => void verify(code)}
      resendIn={resendIn}
      onResend={() => {
        setResendIn(RESEND_SECONDS);
        setMessage(null);
        void resendSignupCode(signupEmail);
      }}
      onChangeEmail={() => (router.canGoBack() ? router.back() : router.replace('/create'))}
      onBack={() => goBackOr('/create')}
      onOpenMail={Platform.OS === 'ios' ? () => void Linking.openURL('message://').catch(() => {}) : undefined}
      busy={busy}
      message={message}
    />
  );
}
