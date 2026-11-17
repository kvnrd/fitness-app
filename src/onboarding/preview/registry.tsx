import type { ReactElement, ReactNode } from 'react';
import { AuroraProgressPreview, AuroraTrainPreview, AuroraWorkoutPreview } from './auroraPreview';
import { AppearanceSettingsScreen } from '../../settings/screens/AppearanceSettings';
import { View } from 'react-native';
import { AiNotice } from '../../components/AiNotice';
import { PolicyScreen } from '../../components/PolicyScreen';
import { HEALTH_POLICY_DOC } from '../../legal/policies/policies.generated';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { presetGym, toggleItem } from '../equipment';
import { initPc, setAi as pcSetAi, setAttest, setCoach, setHealth as pcSetHealth, setRisk as pcSetRisk, setTerms } from '../parentConsent';
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
import { ReacceptTermsScreen, TermsDocumentScreen } from '../../legal/screens/ReacceptTerms';
import { PrivacySettingsScreen } from '../../settings/screens/PrivacySettings';
import { NotificationsSettingsScreen } from '../../settings/screens/NotificationsSettings';
import { HealthReaskScreen } from '../../settings/screens/HealthReask';
import { emptyHealthAnswers, setHealthAnswer, type HealthAnswers } from '../../ai/healthScreen';
import type { QuizState } from '../../ai/quiz';
import { SAMPLE_PLAN, SAMPLE_QUIZ, SAMPLE_REST, SAMPLE_SWAP_NOTE } from '../../ai/screens/samplePlan';
import { HealthScreen } from '../../ai/screens/HealthScreen';
import { HealthClearanceScreen } from '../../ai/screens/HealthClearance';
import { HealthSwitchScreen } from '../../ai/screens/HealthSwitch';
import { AiQuizScreen } from '../../ai/screens/AiQuiz';
import { AiGeneratingScreen } from '../../ai/screens/AiGenerating';
import { AiPreviewScreen } from '../../ai/screens/AiPreview';
import { AiBlockedScreen } from '../../ai/screens/AiBlocked';
import { HomeAiScreen } from '../../ai/screens/HomeAi';
import { TrainAiScreen } from '../../ai/screens/TrainAi';
import { ProfileScreen } from '../../ai/screens/ProfileScreen';
import { AddPhotosChooser } from '../../progress/screens/AddPhotosChooser';
import { ImportConsentSheet } from '../../progress/screens/ImportConsentSheet';
import { PhotoOptInSheet } from '../../progress/screens/PhotoOptInSheet';
import { PrToast } from '../../progress/screens/PrToast';
import { WorkoutRecapScreen } from '../../progress/screens/WorkoutRecap';
import { Turned18Card } from '../../progress/screens/Turned18Card';
import { PhotoPrivacySettingsScreen } from '../../progress/screens/PhotoPrivacySettings';
import { CoachShareSheet } from '../../progress/screens/CoachShareSheet';
import { CoachClientListPreview, CoachTeenClientPage } from '../../progress/screens/CoachTeenClient';
import { DataExportSheet } from '../../progress/screens/DataExportSheet';
import { HealthPills } from '../../progress/screens/HealthPills';
import { HomeWeightCard } from '../../progress/screens/HomeWeightCard';
import { PhotoGalleryScreen } from '../../progress/screens/PhotoGallery';
import { ProfileBodySection } from '../../progress/screens/ProfileBody';
import { ProgressChips } from '../../progress/screens/ProgressChips';
import { ProgressWeightScreen } from '../../progress/screens/ProgressWeight';
import { WeightGoalSheet } from '../../progress/screens/WeightGoalSheet';
import { weightSurfaceState } from '../../progress/weightGate.ts';

/**
 * Screen preview registry (dev only; used by app/dev-preview.tsx for screenshots). id → render function with
 * MOCK props. Job B: add your screens here (one entry per state worth a screenshot). Mock data only: never
 * read real state, never call the server.
 */
const noop = () => {};

function PreviewPad({ children }: { children: ReactNode }) {
  return (
    <ScreenBackground>
      <View style={{ padding: 24, gap: 16, minHeight: 844 }}>{children}</View>
    </ScreenBackground>
  );
}

const openWeight = weightSurfaceState({ isMinor: true, healthSelf: true, healthParent: true });
const teenOff = weightSurfaceState({ isMinor: true, healthSelf: false, healthParent: true });
const parentOff = weightSurfaceState({ isMinor: true, healthSelf: true, healthParent: false });
const sampleWeight = {
  trendLabel: '142.6',
  unit: 'lb',
  changeLabel: '3.4 lb in 3 months',
  goalLabel: 'Goal · 138 lb',
  goalSub: 'About 17 weeks at your current rate',
  accessibilityLabel: 'Trend weight 142.6 lb, down 3.4 lb over 3 months.',
};


const allNo = (): HealthAnswers => {
  let a = emptyHealthAnswers();
  for (let i = 0; i < a.length; i++) a = setHealthAnswer(a, i, false);
  return a;
};
const yesAt = (i: number): HealthAnswers => setHealthAnswer(allNo(), i, true);
const adultQuiz: QuizState = { ...SAMPLE_QUIZ, goals: ['build_strength', 'lose_fat'] };
const teenQuiz: QuizState = { ...SAMPLE_QUIZ, goals: ['build_strength', 'build_muscle'] };


const role = (o: Partial<RoleProps> = {}): ReactElement => (
  <RoleScreen role="athlete" onRole={noop} codeOpen={false} onToggleCode={noop} trainerCode="" onTrainerCode={noop} onApplyCode={noop} onContinue={noop} onRequestCoach={noop} onSkip={noop} onBack={noop} attestGeneral={false} onAttestGeneral={noop} attestMinors={false} onAttestMinors={noop} {...o} />
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
  'role-coach': () => role({ role: 'coach' }),
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
  'waiting-parent': () => <WaitingParentScreen inviteStatus="sent" deadlineText="Your parent has until November 16, 2026 to approve." email="" onEmail={noop} emailValid={false} showInvite={false} onToggleInvite={noop} onResend={noop} onSetupStyle={noop} onCheckAgain={noop} onSignOut={noop} />,
  'waiting-parent-resend': () => (
    <WaitingParentScreen inviteStatus="expired" deadlineText="Your parent has until November 16, 2026 to approve." email="parent@example.com" onEmail={noop} emailValid showInvite onToggleInvite={noop} onResend={noop} resendNote="If that address can receive it, the new invite is on its way." onSetupStyle={noop} onCheckAgain={noop} onSignOut={noop} />
  ),
  // ───── Privacy & safety ─────
  'privacy-adult': () => <PrivacySafetyScreen state={initPs('adult')} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-adult-ready': () => <PrivacySafetyScreen state={psSetRisk(initPs('adult'), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-adult-on': () => <PrivacySafetyScreen state={psSetRisk(psSetAi(psSetHealth(initPs('adult'), true), true), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-adult-needs-health': () => <PrivacySafetyScreen state={psSetAi(initPs('adult'), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-teen': () => <PrivacySafetyScreen state={initPs('teen')} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-teen-ready': () => <PrivacySafetyScreen state={psSetRisk(initPs('teen'), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-teen-granted': () => <PrivacySafetyScreen state={psSetRisk(initPs('teen', teenGrants), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  'privacy-teen-needs-health': () => <PrivacySafetyScreen state={psSetAi(initPs('teen', teenGrants), true)} onChange={noop} onOpenHealthPolicy={noop} onContinue={noop} />,
  // ───── Parent consent ─────
  'parent-consent': () => <ParentConsentScreen names={{ teenName: 'Alex', teenFullName: 'Alex Rivera', parentName: 'Sam Rivera' }} state={initPc()} onChange={noop} onConfirm={noop} />,
  'parent-consent-ready': () => (
    <ParentConsentScreen names={{ teenName: 'Alex', teenFullName: 'Alex Rivera', parentName: 'Sam Rivera' }} state={pcSetRisk(setTerms(setAttest(initPc(), true), true), true)} onChange={noop} onConfirm={noop} />
  ),
  'parent-consent-options': () => (
    <ParentConsentScreen names={{ teenName: 'Alex', teenFullName: 'Alex Rivera', parentName: 'Sam Rivera' }} state={pcSetRisk(setTerms(setAttest(setCoach(pcSetAi(pcSetHealth(initPc(), true), true), true), true), true), true)} onChange={noop} onConfirm={noop} />
  ),
  'parent-consent-needs-health': () => <ParentConsentScreen names={{ teenName: 'Alex', teenFullName: 'Alex Rivera', parentName: 'Sam Rivera' }} state={pcSetAi(initPc(), true)} onChange={noop} onConfirm={noop} />,
  // ───── Phase 4: health screen, quiz, plan (ids keep historical Paper stems; the UI never says PAR-Q+) ─────
  parq: () => <HealthScreen answers={allNo()} onAnswer={noop} onContinue={noop} onBack={noop} />,
  'parq-yes': () => <HealthScreen answers={yesAt(5)} onAnswer={noop} onContinue={noop} onBack={noop} />,
  'parq-clearance': () => <HealthClearanceScreen confirmed={false} onConfirmed={noop} onContinue={noop} onBack={noop} />,
  'parq-parent': () => <HealthScreen answers={allNo()} teenName="Alex" onAnswer={noop} onContinue={noop} onBack={noop} />,
  'parq-parent-clearance': () => <HealthClearanceScreen confirmed={false} teenName="Alex" onConfirmed={noop} onContinue={noop} onBack={noop} />,
  'health-switch': () => <HealthSwitchScreen onReview={noop} onNotNow={noop} onBack={noop} />,
  'health-switch-teen': () => <HealthSwitchScreen teenName="Alex" onReview={noop} onNotNow={noop} onBack={noop} />,
  quiz: () => <AiQuizScreen state={{ ...adultQuiz }} teen={false} onChange={noop} onGenerate={noop} onBack={noop} />,
  'quiz-teen': () => <AiQuizScreen state={{ ...teenQuiz }} teen onChange={noop} onGenerate={noop} onBack={noop} />,
  generating: () => <AiGeneratingScreen injuryLabel="Knee" onCancel={noop} />,
  preview: () => <AiPreviewScreen title="Hybrid Strength" plan={SAMPLE_PLAN} injuryLabel="Knee" swapNote={SAMPLE_SWAP_NOTE} restNote={SAMPLE_REST} onStart={noop} onBack={noop} />,
  blocked: () => <AiBlockedScreen onGenerateAgain={noop} onChangeGoal={noop} />,
  'home-ai': () => <HomeAiScreen hasPlan notice="footer" />,
  'home-ai-teen': () => <HomeAiScreen teen hasPlan showWeight={false} notice="footer" />,
  'home-ai-paused': () => <HomeAiScreen hasPlan notice="footer" healthScreenPaused />,
  'home-ai-paused-teen': () => <HomeAiScreen teen hasPlan showWeight={false} notice="footer" healthScreenPaused />,
  'train-ai': () => <TrainAiScreen notice="footer" />,
  'train-ai-paused': () => <TrainAiScreen notice="footer" healthScreenPaused />,
  'profile': () => <ProfileScreen name="Jordan" roleLabel="Athlete" notice="footer" />,
  'profile-teen': () => <ProfileScreen teen name="Alex" roleLabel="Athlete" showWeight weightLabel="142 lb" notice="footer" />,
  // ───── Legal: Terms v0.4-draft ─────
  terms: () => <TermsDocumentScreen />,
  'terms-reaccept': () => <ReacceptTermsScreen checked={false} onChecked={noop} onOpenTerms={noop} onAccept={noop} />,
  'terms-reaccept-ready': () => <ReacceptTermsScreen checked onChecked={noop} onOpenTerms={noop} onAccept={noop} />,
  'terms-reaccept-waiting': () => <ReacceptTermsScreen checked={false} onChecked={noop} onOpenTerms={noop} onAccept={noop} waitingForParent />,
  // ───── Settings › Privacy, Notifications, 12-month health re-ask ─────
  'settings-privacy': () => (
    <PrivacySettingsScreen
      healthOn
      aiOn
      coachOn={false}
      onManageChoices={noop}
      onPrivacyPolicy={noop}
      onHealthPolicy={noop}
      onTerms={noop}
      onExport={noop}
      onDeleteAccount={noop}
    />
  ),
  'settings-privacy-reask': () => (
    <PrivacySettingsScreen
      healthOn
      aiOn
      coachOn={false}
      reaskDue
      onManageChoices={noop}
      onReask={noop}
      onPrivacyPolicy={noop}
      onHealthPolicy={noop}
      onTerms={noop}
      onExport={noop}
      onDeleteAccount={noop}
    />
  ),
  'settings-notifications': () => (
    <NotificationsSettingsScreen prefs={{ workoutReminders: true, planReady: true, messages: false }} onChange={noop} />
  ),
  'settings-notifications-teen': () => (
    <NotificationsSettingsScreen prefs={{ workoutReminders: true, planReady: true, messages: true }} onChange={noop} isMinor />
  ),
  'health-reask': () => <HealthReaskScreen onConfirm={noop} onTurnOff={noop} onBack={noop} />,
  'health-reask-teen': () => <HealthReaskScreen variant="teen" onConfirm={noop} onTurnOff={noop} onBack={noop} />,
  'health-reask-waiting': () => <HealthReaskScreen variant="waiting_parent" onConfirm={noop} onTurnOff={noop} onBack={noop} />,
  // ───── Plan notice ─────
  'plan-notice': () => <PlanNoticePreview />,
  // ───── Aurora theme (family/preset come from dev-preview query params) ─────
  'train-aurora': () => <AuroraTrainPreview />,
  'progress-aurora': () => <AuroraProgressPreview />,
  'workout-aurora': () => <AuroraWorkoutPreview />,
  'workout-aurora-empty': () => <AuroraWorkoutPreview empty />,
  'appearance-aurora': () => <AppearanceSettingsScreen onBack={() => {}} />,
  // ───── Phase 5b (SPEC rev 5) ─────
  'add-photos-chooser': () => <AddPhotosChooser onTakePhoto={noop} onChooseFromLibrary={noop} onCancel={noop} />,
  'import-consent': () => <ImportConsentSheet onAgree={noop} onCancel={noop} />,
  'photo-opt-in': () => <PhotoOptInSheet switchOn={false} onSwitchChange={noop} onContinue={noop} onNotNow={noop} />,
  'pr-toast': () => (
    <PrToast
      model={{
        kind: 'heaviest_lift',
        exercise: 'Bench press',
        load: '185',
        unit: 'lb',
        reps: 5,
        delta: '5',
        prevLoad: '180',
        prevReps: 5,
      }}
    />
  ),
  'workout-recap': () => (
    <WorkoutRecapScreen
      dateLine="Tue, Nov 17"
      complete
      volume="12,400"
      unit="lb"
      lastWorkout="Upper"
      lastVolume="11,200"
      setsDone={16}
      setsTotal={16}
      exercisesDone={5}
      exercisesTotal={5}
      minutes={48}
      prs={[{ exercise: 'Bench press', detail: '185 × 5' }]}
      streakLine={{ title: '2-week streak', body: 'You’ve hit your planned workouts 2 weeks in a row.' }}
      onDone={noop}
    />
  ),
  'turned-18': () => <Turned18Card onNotNow={noop} onLearnMore={noop} />,
  'photo-privacy': () => <PhotoPrivacySettingsScreen optedIn={false} onBack={noop} onOpenOptIn={noop} />,
  'settings-privacy-teen-photos': () => (
    <PrivacySettingsScreen
      healthOn
      aiOn
      coachOn={false}
      isMinor
      photoOptedIn={false}
      onManageChoices={noop}
      onPrivacyPolicy={noop}
      onHealthPolicy={noop}
      onTerms={noop}
      onExport={noop}
      onDeleteAccount={noop}
    />
  ),
  'coach-share': () => (
    <PreviewPad>
      <CoachShareSheet coachFirst="Alex" onNotNow={noop} onContinue={noop} />
    </PreviewPad>
  ),
  'photo-gallery': () => (
    <PreviewPad>
      <PhotoGalleryScreen items={[{ id: '1', dateLabel: 'Nov 14' }, { id: '2', dateLabel: 'Oct 29' }]} onAdd={noop} />
    </PreviewPad>
  ),
  'photo-gallery-empty': () => (
    <PreviewPad>
      <PhotoGalleryScreen items={[]} onAdd={noop} />
    </PreviewPad>
  ),
  'home-turned-18': () => (
    <PreviewPad>
      <Text variant="hero" accessibilityRole="header">Home</Text>
      <Turned18Card onNotNow={noop} onLearnMore={noop} />
    </PreviewPad>
  ),
  'progress-weight': () => (
    <PreviewPad>
      <Text variant="title" accessibilityRole="header">Progress</Text>
      <ProgressChips isMinor selected="Weight" onSelect={noop} />
      <ProgressWeightScreen surface={openWeight} healthSelf healthParent model={sampleWeight} onOpenGoal={noop} />
    </PreviewPad>
  ),
  'progress-weight-empty': () => (
    <PreviewPad>
      <Text variant="title" accessibilityRole="header">Progress</Text>
      <ProgressChips isMinor selected="Weight" onSelect={noop} />
      <ProgressWeightScreen surface={openWeight} healthSelf healthParent model={null} onLog={noop} onConnectHealth={noop} />
    </PreviewPad>
  ),
  'progress-weight-teen-off': () => (
    <PreviewPad>
      <Text variant="title" accessibilityRole="header">Progress</Text>
      <ProgressChips isMinor selected="Weight" onSelect={noop} />
      <ProgressWeightScreen surface={teenOff} healthSelf={false} healthParent />
    </PreviewPad>
  ),
  'progress-weight-parent-off': () => (
    <PreviewPad>
      <Text variant="title" accessibilityRole="header">Progress</Text>
      <ProgressChips isMinor selected="Weight" onSelect={noop} />
      <ProgressWeightScreen surface={parentOff} healthSelf healthParent={false} />
    </PreviewPad>
  ),
  'weight-goal-sheet': () => (
    <PreviewPad>
      <ProgressWeightScreen surface={openWeight} healthSelf healthParent model={sampleWeight} />
      <WeightGoalSheet direction="Lose" targetLabel="138.0 lb" paceLabel="0.5 lb/week" dateLabel="Jan 16" onDirection={noop} onCancel={noop} onSave={noop} />
    </PreviewPad>
  ),
  'home-weight': () => (
    <PreviewPad>
      <Text variant="hero" accessibilityRole="header">Home</Text>
      <HomeWeightCard
        surface={openWeight}
        healthSelf
        healthParent
        trendLabel="142.6"
        unit="lb"
        goalLabel="Goal · 138 lb"
        accessibilityLabel="Trend weight 142.6 lb, down 3.4 lb over 3 months."
        onOpenProgress={noop}
      />
    </PreviewPad>
  ),
  'home-weight-gated': () => (
    <PreviewPad>
      <Text variant="hero" accessibilityRole="header">Home</Text>
      <HomeWeightCard surface={parentOff} healthSelf healthParent={false} />
    </PreviewPad>
  ),
  'profile-weight-on': () => (
    <PreviewPad>
      <Text variant="hero" accessibilityRole="header">Profile</Text>
      <HealthPills selfOn parentOn />
      <ProfileBodySection
        surface={openWeight}
        trendLabel="142.6"
        unit="lb"
        goalLabel="Goal · 138 lb"
        accessibilityLabel="Trend weight 142.6 lb, down 3.4 lb over 3 months."
      />
    </PreviewPad>
  ),
  'profile-teen-off': () => (
    <PreviewPad>
      <Text variant="hero" accessibilityRole="header">Profile</Text>
      <HealthPills selfOn={false} parentOn />
      <ProfileBodySection surface={teenOff} />
    </PreviewPad>
  ),
  'profile-parent-off': () => (
    <PreviewPad>
      <Text variant="hero" accessibilityRole="header">Profile</Text>
      <HealthPills selfOn parentOn={false} />
      <ProfileBodySection surface={parentOff} />
    </PreviewPad>
  ),
  'export-with-weight': () => (
    <PreviewPad>
      <DataExportSheet isMinor hasConnectedApps hasCoach photoCount={0} hasHealthInfo onBack={noop} onSave={noop} />
    </PreviewPad>
  ),
  'export-no-weight': () => (
    <PreviewPad>
      <DataExportSheet isMinor hasConnectedApps={false} hasCoach={false} photoCount={0} hasHealthInfo={false} onBack={noop} onSave={noop} />
    </PreviewPad>
  ),
  'studio-clients-sam': () => (
    <PreviewPad>
      <CoachClientListPreview name="Sam M." highlighted />
    </PreviewPad>
  ),
  'client-teen-sam': () => (
    <PreviewPad>
      <CoachTeenClientPage name="Sam M." planGoal="Build muscle" />
    </PreviewPad>
  ),
};



