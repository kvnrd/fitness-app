import { router } from 'expo-router';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { useAgeGate } from '../auth/AgeGateProvider';
import { signUpWithEmail } from '../auth/signIn';
import { goBackOr, useLegalLinks } from '../onboarding/flow';
import { isEmailShape, passwordStrength } from '../onboarding/password';
import { CreateScreen } from '../onboarding/screens/Create';

/**
 * Account · Step 2 of 8. Reached only after the DOB answer exists (locked). Back goes to Method for 18+ and
 * to Invite sent for 16-17 (plain history pop). The password lives in this component's state only.
 */
export default function CreateRoute() {
  const { hasPending, signupEmail, signupName, setSignupIdentity } = useAgeGate();
  const links = useLegalLinks();
  const [name, setName] = useState(signupName);
  const [email, setEmail] = useState(signupEmail);
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!hasPending) return <Redirect href="/welcome" />;

  const emailOk = isEmailShape(email);
  const s = passwordStrength(password);
  const pwOk = s.meetsLength && s.withinMax;
  const ready = emailOk && pwOk && terms;
  const hint = !emailOk ? 'Enter a valid email to continue' : !pwOk ? 'Use at least 12 characters for your password' : !terms ? 'Accept the terms to continue' : '';

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setMessage(null);
    const r = await signUpWithEmail(email, password);
    setBusy(false);
    if (!r.ok) {
      setMessage(r.message);
      return;
    }
    setPassword('');
    setSignupIdentity(email.trim(), name.trim());
    router.push('/verify');
  }

  return (
    <CreateScreen
      name={name}
      email={email}
      password={password}
      showPassword={show}
      terms={terms}
      emailError={emailTouched && email.trim() && !emailOk ? 'Enter a full email, like name@example.com' : null}
      hint={hint}
      ready={ready}
      busy={busy}
      message={message}
      onName={setName}
      onEmail={setEmail}
      onEmailBlur={() => setEmailTouched(true)}
      onPassword={setPassword}
      onToggleShow={() => setShow((v) => !v)}
      onTerms={setTerms}
      onOpenTerms={links.onTerms}
      onOpenPrivacy={links.onPrivacy}
      onSubmit={submit}
      onBack={() => goBackOr('/method')}
    />
  );
}
