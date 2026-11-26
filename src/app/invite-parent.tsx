import { router } from 'expo-router';
import { useState } from 'react';
import { useAgeGate } from '../auth/AgeGateProvider';
import { isEmailShape } from '../onboarding/email';
import { InviteParentScreen } from '../onboarding/screens/InviteParent';

/**
 * Parent email: format check only (no account lookup). It is held in AgeGateProvider memory and sent with
 * create_parent_invite after the teen's account exists. Nothing is sent from here.
 */
export default function InviteParentRoute() {
  const { parentEmail, setParentEmail } = useAgeGate();
  const [email, setEmail] = useState(parentEmail);
  const valid = isEmailShape(email);
  return (
    <InviteParentScreen
      email={email}
      onChange={setEmail}
      valid={valid}
      onSend={() => {
        if (!valid) return;
        setParentEmail(email.trim());
        router.push('/invite-sent');
      }}
    />
  );
}
