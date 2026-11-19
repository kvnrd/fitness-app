import { router } from 'expo-router';
import { useState } from 'react';
import { startOAuth, useProviderAvailability } from '../auth/providers';
import { useSession } from '../auth/SessionProvider';
import { DEV_PASSWORD_SIGN_IN, devSignInWithPassword, requestEmailCode, verifyEmailCode } from '../auth/signIn';
import { goBackOr } from '../onboarding/flow';
import { SignInScreen } from '../onboarding/screens/SignIn';

/**
 * Existing accounts: email one-time code, Apple, Google. `shouldCreateUser` is false: an unknown email
 * creates nothing (new accounts go through Method → date of birth). Every error is generic.
 */
export default function SignInRoute() {
  const { notice, setNotice } = useSession();
  const avail = useProviderAvailability();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; message?: string }>, onOk?: () => void) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    setNotice(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) onOk?.();
    else if (r.message) setMessage(r.message);
  }

  return (
    <SignInScreen
      email={email}
      onEmail={setEmail}
      code={code}
      onCode={(v) => setCode(v)}
      codeSent={codeSent}
      busy={busy}
      message={message}
      notice={notice}
      showApple={avail.apple}
      showGoogle={avail.google}
      onApple={() => void run(() => startOAuth('apple'))}
      onGoogle={() => void run(() => startOAuth('google'))}
      onSendCode={() => void run(() => requestEmailCode(email, false), () => setCodeSent(true))}
      onVerify={() => void run(() => verifyEmailCode(email, code))}
      onUseDifferentEmail={() => {
        setCodeSent(false);
        setCode('');
        setMessage(null);
      }}
      onBack={() => goBackOr('/welcome')}
      onCreate={() => router.push('/method')}
      devPassword={
        DEV_PASSWORD_SIGN_IN
          ? { value: devPassword, onChange: setDevPassword, onSubmit: () => void run(() => devSignInWithPassword(email, devPassword)) }
          : undefined
      }
    />
  );
}
