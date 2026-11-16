import type { ReactElement } from 'react';
import { CreateScreen } from '../screens/Create';
import { DobScreen } from '../screens/Dob';
import { InviteParentScreen } from '../screens/InviteParent';
import { InviteSentScreen } from '../screens/InviteSent';
import { MethodScreen } from '../screens/Method';
import { NotEligibleScreen } from '../screens/NotEligible';
import { ParentHelpScreen } from '../screens/ParentHelp';
import { SignInScreen } from '../screens/SignIn';
import { VerifyScreen } from '../screens/Verify';
import { WelcomeScreen } from '../screens/Welcome';

/**
 * Screen preview registry (dev only; used by app/dev-preview.tsx for screenshots). id → render function with
 * MOCK props. Job B: add your screens here (one entry per state worth a screenshot). Mock data only: never
 * read real state, never call the server.
 */
const noop = () => {};

export const PREVIEW_SCREENS: Record<string, () => ReactElement> = {
  welcome: () => <WelcomeScreen onCreate={noop} onSignIn={noop} onTerms={noop} onPrivacy={noop} />,
  method: () => <MethodScreen showApple showGoogle onApple={noop} onGoogle={noop} onEmail={noop} onBack={noop} onSignIn={noop} onTerms={noop} onPrivacy={noop} />,
  dob: () => <DobScreen value={{ month: '', day: '', year: '' }} onChange={noop} valid={false} onContinue={noop} onBack={noop} />,
  'dob-ready': () => <DobScreen value={{ month: '3', day: '14', year: '1994' }} onChange={noop} valid onContinue={noop} onBack={noop} />,
  'not-eligible': () => <NotEligibleScreen />,
  'parent-help': () => <ParentHelpScreen onInvite={noop} />,
  'invite-parent': () => <InviteParentScreen email="" onChange={noop} valid={false} onSend={noop} />,
  'invite-parent-ready': () => <InviteParentScreen email="parent@example.com" onChange={noop} valid onSend={noop} />,
  'invite-sent': () => (
    <InviteSentScreen email="parent@example.com" showApple showGoogle onApple={noop} onGoogle={noop} onEmail={noop} onBack={noop} onTerms={noop} onPrivacy={noop} />
  ),
  create: () => (
    <CreateScreen
      name="Kevin"
      email="kevin@example"
      password="correct horse stapler"
      showPassword
      terms={false}
      emailError="Enter a full email, like name@example.com"
      hint="Enter a valid email to continue"
      ready={false}
      onName={noop}
      onEmail={noop}
      onPassword={noop}
      onToggleShow={noop}
      onTerms={noop}
      onOpenTerms={noop}
      onOpenPrivacy={noop}
      onSubmit={noop}
      onBack={noop}
    />
  ),
  verify: () => <VerifyScreen email="kevin@example.com" code="482" onCode={noop} onVerify={noop} resendIn={42} onResend={noop} onChangeEmail={noop} onBack={noop} onOpenMail={noop} />,
  'sign-in': () => (
    <SignInScreen
      email="kevin@example.com"
      onEmail={noop}
      code=""
      onCode={noop}
      codeSent={false}
      showApple
      showGoogle
      onApple={noop}
      onGoogle={noop}
      onSendCode={noop}
      onVerify={noop}
      onUseDifferentEmail={noop}
      onBack={noop}
      onCreate={noop}
    />
  ),
};
