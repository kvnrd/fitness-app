import type { ReactElement } from 'react';
import { View } from 'react-native';
import { AiNotice } from '../../components/AiNotice';
import { PolicyScreen } from '../../components/PolicyScreen';
import { HEALTH_POLICY_DOC } from '../../legal/policies/policies.generated';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { presetGym, toggleItem } from '../equipment';
import { initPc, setAi as pcSetAi, setAttest, setCoach, setHealth as pcSetHealth, setRisk as pcSetRisk } from '../parentConsent';
import { initPs, setAi as psSetAi, setHealth as psSetHealth, setRisk as psSetRisk } from '../privacySafety';
import { ParentConsentScreen } from '../screens/ParentConsent';
import { PrivacySafetyScreen } from '../screens/PrivacySafety';
import { EquipmentScreen } from '../screens/SetupEquipment';
import { GoalAdultScreen, GoalMinorScreen } from '../screens/SetupGoal';
import { PrefsScreen } from '../screens/SetupPrefs';
import { RoleScreen, type RoleProps } from '../screens/SetupRole';
import { FollowupsScreen, StyleScreen } from '../screens/SetupStyle';
import { WaitingParentScreen } from '../screens/WaitingParent';
import { defaultPrefs } from '../prefs';
import { defaultFollowups, toggleStyle, EMPTY_SELECTION } from '../styles';
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

const role = (o: Partial<RoleProps> = {}): ReactElement => (
  <RoleScreen role="athlete" onRole={noop} coachInvite="" onCoachInvite={noop} codeOpen={false} onToggleCode={noop} trainerCode="" onTrainerCode={noop} onApplyCode={noop} onContinue={noop} onRequestCoach={noop} onSkip={noop} onBack={noop} attestGeneral={false} onAttestGeneral={noop} attestMinors={false} onAttestMinors={noop} {...o} />
);
const picked = toggleStyle(toggleStyle(toggleStyle(EMPTY_SELECTION, 'hybrid'), 'hyrox'), 'bodybuilding');
const editedGym = toggleItem(toggleItem(toggleItem(presetGym('full'), 'smith_machine'), 'pec_deck'), 'trx');
const teenGrants = { health: true, ai: true };
const PLAN_MOCK = { aiGenerated: true };

/** Plan screen with the always-visible AI notice (Paper board 27). Mock content only. */
function PlanNoticePreview() {
  const { colors, fonts } = useTheme();
  return (
    <ScreenBackground>
      <View style={{ flex: 1, padding: 24, paddingTop: 72, gap: 16 }}>
        <Text variant="label" color={colors.textMuted} style={{ textTransform: 'uppercase', letterSpacing: 0.96, fontFamily: fonts.bodyBold }}>
          Your plan · Hybrid athlete
        </Text>
        <Text style={{ fontFamily: fonts.displayHeavy, fontSize: 48, lineHeight: 46, textTransform: 'uppercase' }}>Week 3 of 8</Text>
        <Text color={colors.textSecondary}>With Alex Rivera</Text>
        {PLAN_MOCK.aiGenerated ? <AiNotice /> : null}
      </View>
    </ScreenBackground>
  );
}

export const PREVIEW_SCREENS: Record<string, () => ReactElement> = {
  'policy-health': () => <PolicyScreen doc={HEALTH_POLICY_DOC} />,
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

  // ───── Job B: Setup 4-8 ─────
  'role': () => role(),
  'role-code': () => role({ codeOpen: true, trainerCode: 'K7Q2-9XM4-', codeMessage: { kind: 'error', text: "That code didn't work. Check it and try again." } }),
  'role-code-limited': () => role({ codeOpen: true, trainerCode: 'K7Q2-9XM4-T3PD-8WNA', codeMessage: { kind: 'error', text: 'Too many tries. Try again later.' } }),
  'role-coach': () => role({ role: 'coach', coachInvite: 'FA-7Q2K-' }),
  'goal-adult': () => (
    <GoalAdultScreen goal="lose" onGoal={noop} units="lb" currentText="186.4" onCurrentText={noop} target={178} onTargetStep={noop} pace="steady" onPace={noop} storedOnDevice onDeleteWeight={noop} onContinue={noop} onSkip={noop} onBack={noop} />
  ),
  'goal-adult-empty': () => <GoalAdultScreen goal={null} onGoal={noop} units="lb" currentText="" onCurrentText={noop} target={null} onTargetStep={noop} pace="moderate" onPace={noop} storedOnDevice={false} onDeleteWeight={noop} onContinue={noop} onSkip={noop} onBack={noop} />,
  'goal-minor': () => <GoalMinorScreen picked={null} onPick={noop} onContinue={noop} onSkip={noop} onBack={noop} />,
  'goal-minor-picked': () => <GoalMinorScreen picked="build_strength" onPick={noop} onContinue={noop} onSkip={noop} onBack={noop} />,
  'style-empty': () => <StyleScreen selection={EMPTY_SELECTION} onToggle={noop} onSetMain={noop} onContinue={noop} onSkip={noop} onBack={noop} />,
  'style-picked': () => <StyleScreen selection={picked} onToggle={noop} onSetMain={noop} onContinue={noop} onSkip={noop} onBack={noop} />,
  'followups': () => <FollowupsScreen selection={picked} followups={defaultFollowups()} units="lb" onChange={noop} onContinue={noop} onSkip={noop} onBack={noop} />,
  'equipment': () => (
    <EquipmentScreen gym={editedGym} units="lb" startedFrom="full" onName={noop} onPreset={noop} onToggleItem={noop} onToggleGroup={noop} onMax={noop} onContinue={noop} onSkip={noop} onBack={noop} />
  ),
  'prefs': () => <PrefsScreen prefs={defaultPrefs()} onChange={noop} onFinish={noop} onSkip={noop} onBack={noop} />,
  // ───── Waiting for a parent ─────
  'waiting-parent': () => <WaitingParentScreen inviteStatus="sent" email="" onEmail={noop} emailValid={false} showInvite={false} onToggleInvite={noop} onResend={noop} onSetupStyle={noop} onCheckAgain={noop} onSignOut={noop} />,
  'waiting-parent-resend': () => (
    <WaitingParentScreen inviteStatus="expired" email="parent@example.com" onEmail={noop} emailValid showInvite onToggleInvite={noop} onResend={noop} resendNote="If that address can receive it, the new invite is on its way." onSetupStyle={noop} onCheckAgain={noop} onSignOut={noop} />
  ),
  // ───── Privacy & safety ─────
  'privacy-adult': () => <PrivacySafetyScreen state={initPs('adult')} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-adult-ready': () => <PrivacySafetyScreen state={psSetRisk(initPs('adult'), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-adult-on': () => <PrivacySafetyScreen state={psSetRisk(psSetAi(psSetHealth(initPs('adult'), true), true), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-adult-needs-health': () => <PrivacySafetyScreen state={psSetAi(initPs('adult'), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-teen': () => <PrivacySafetyScreen state={initPs('teen')} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-teen-ready': () => <PrivacySafetyScreen state={psSetRisk(initPs('teen'), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-teen-granted': () => <PrivacySafetyScreen state={psSetRisk(initPs('teen', teenGrants), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  // ───── Parent consent ─────
  'parent-consent': () => <ParentConsentScreen names={{ teenName: 'Alex', teenFullName: 'Alex Rivera', parentName: 'Sam Rivera' }} state={initPc()} onChange={noop} onConfirm={noop} />,
  'parent-consent-ready': () => (
    <ParentConsentScreen names={{ teenName: 'Alex', teenFullName: 'Alex Rivera', parentName: 'Sam Rivera' }} state={pcSetRisk(setAttest(initPc(), true), true)} onChange={noop} onConfirm={noop} />
  ),
  'parent-consent-options': () => (
    <ParentConsentScreen names={{ teenName: 'Alex', teenFullName: 'Alex Rivera', parentName: 'Sam Rivera' }} state={pcSetRisk(setAttest(setCoach(pcSetAi(pcSetHealth(initPc(), true), true), true), true), true)} onChange={noop} onConfirm={noop} />
  ),
  'parent-consent-needs-health': () => <ParentConsentScreen names={{ teenName: 'Alex', teenFullName: 'Alex Rivera', parentName: 'Sam Rivera' }} state={pcSetAi(initPc(), true)} onChange={noop} onConfirm={noop} />,
  // ───── Plan notice ─────
  'plan-notice': () => <PlanNoticePreview />,
};
