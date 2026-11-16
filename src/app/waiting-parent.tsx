import { router } from 'expo-router';
import { useState } from 'react';
import { useAgeGate } from '../auth/AgeGateProvider';
import { useSession } from '../auth/SessionProvider';
import { createParentInvite } from '../onboarding/api';
import { isEmailShape } from '../onboarding/password';
import { inviteNeedsResend } from '../onboarding/routing';
import { WaitingParentScreen } from '../onboarding/screens/WaitingParent';

/**
 * Pending 16-17. Shows Counsel's copy, the invite status from my_onboarding_state(), and lets the teen fix/resend the
 * parent email (create_parent_invite again: the server answers the same neutral way every time; never a lookup).
 * Style / gym / units setup (steps 6-8) opens from here and is saved on the device only.
 */
export default function WaitingParentRoute() {
  const { onboarding, refreshRole, signOut } = useSession();
  const age = useAgeGate();
  const [email, setEmail] = useState(age.parentEmail);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const status = onboarding?.invite_status ?? null;
  return (
    <WaitingParentScreen
      inviteStatus={status}
      email={email}
      onEmail={setEmail}
      emailValid={isEmailShape(email)}
      showInvite={open || inviteNeedsResend(status)}
      onToggleInvite={() => setOpen(true)}
      busy={busy}
      resendNote={note}
      onResend={async () => {
        if (busy || !isEmailShape(email)) return;
        setBusy(true);
        await createParentInvite(email); // same neutral answer whatever the address is
        setEmail('');
        age.setParentEmail('');
        setNote('If that address can receive it, the new invite is on its way.');
        await refreshRole();
        setBusy(false);
      }}
      onSetupStyle={() => router.push('/setup/style')}
      onCheckAgain={async () => {
        setBusy(true);
        await refreshRole(); // when the link is active the root gate moves on
        setBusy(false);
      }}
      onSignOut={() => void signOut()}
    />
  );
}
