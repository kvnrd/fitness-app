import type { ReactElement } from 'react';
import {
  AbuseAttestScreen,
  AbuseTrainingScreen,
  AgeAttestScreen,
  ApplyApprovedScreen,
  ApplyIntroScreen,
  ApplyNeedInfoScreen,
  ApplyPendingScreen,
  BecomeACoachScreen,
  CertificationScreen,
  CoachTermsScreen,
  IdentityScreen,
  MinorsApprovedScreen,
  MinorsIntroScreen,
  MinorsNameMatchScreen,
  MinorsNotApprovedScreen,
  MinorsPendingScreen,
} from './ApplyScreens';
import {
  ActivityScreen,
  ClientAdultScreen,
  ClientTeenScreen,
  CoachPicksScreen,
  EndRelationshipScreen,
  PlanDayScreen,
  PlanWeekScreen,
  StudioClientsScreen,
  StudioLockedScreen,
  TempoEditorScreen,
} from './StudioScreens';
import {
  ClientViewCustomScreen,
  CreateBasicsScreen,
  CreateDemoScreen,
  CreateTrackingScreen,
  DemoPendingScreen,
  EditCuesScreen,
  LibraryBrowseScreen,
  LibraryDetailScreen,
  RecordDemoScreen,
  TrimDemoScreen,
} from './LibraryScreens';
import {
  AccessEndedScreen,
  AccountSuspendedScreen,
  AskCoachDeleteConfirmScreen,
  AskCoachDeleteScreen,
  AskCoachDeleteSentScreen,
  BlockedListScreen,
  BlockUserScreen,
  CertVerifiedParentScreen,
  CertVerifiedTeenScreen,
  CoachDeletionConfirmScreen,
  CoachDeletionDoneScreen,
  CoachDeletionRequestScreen,
  CoachSettingsNoExportScreen,
  DeletionOverdueScreen,
  DeletionReminderPushScreen,
  DeletionReminderScreen,
  DmcaReceivedScreen,
  DmcaRequestScreen,
  NcmecPolicyScreen,
  ParentApprovalPendingScreen,
  ParentCoachingEndedScreen,
  ParentRegistryDisclosureScreen,
  ReportReasonsScreen,
  ReportVideoScreen,
  SafetyReportingScreen,
  SuspensionPushScreen,
  TeenRegistryDisclosureScreen,
  UploadsSuspendedScreen,
  VideoRemovedNoticeScreen,
} from './SafetyScreens';

/** SPEC rev 3 screen suffixes, in build order. */
export const PHASE6_SCREEN_IDS = [
  '01-become-a-coach',
  '02-apply-intro',
  '03-age-attestation',
  '03b-age-attestation-on',
  '04-certification',
  '05-identity-check',
  '06-coach-terms',
  '06b-coach-terms-on',
  '06c-coach-terms-nudge',
  '07-apply-pending',
  '08-apply-approved',
  '09-apply-need-info',
  '10-minors-intro',
  '11-abuse-training',
  '12-abuse-training-attest',
  '12b-abuse-training-attest-on',
  '13-minors-pending',
  '14-minors-approved',
  '15-minors-not-approved',
  '15b-minors-name-match',
  '16-studio-locked',
  '17-studio-clients',
  '17b-studio-clients-deletion-banner',
  '18-studio-clients-empty',
  '19-client-adult',
  '20-client-adult-photos',
  '21-client-teen',
  '22-end-relationship',
  '23-plan-week',
  '24-plan-day',
  '25-plan-add-exercise',
  '26-plan-empty',
  '27-tempo-editor',
  '28-tempo-per-set',
  '29-activity',
  '30-activity-tempo-hidden',
  '31-activity-empty',
  '32-coach-picks',
  '33-coach-picks-add',
  '34-coach-picks-full',
  '35-coach-picks-empty',
  '36-library-browse',
  '37-library-my-exercises',
  '38-library-empty',
  '39-library-detail',
  '40-library-edit-cues',
  '41-create-basics',
  '42-create-tracking',
  '43-create-demo',
  '44-record-demo',
  '45-trim-demo',
  '46-demo-pending',
  '47-client-view-custom',
  '48-report-video',
  '49-report-reasons',
  '50-video-removed-notice',
  '51-block-user',
  '52-blocked-list',
  '53-dmca-request',
  '53b-dmca-request-signed',
  '54-dmca-received',
  '55-safety-reporting',
  '56-ncmec-policy',
  '57-uploads-suspended',
  '58-ask-coach-delete',
  '59-ask-coach-delete-confirm',
  '60-ask-coach-delete-sent',
  '61-coach-deletion-request',
  '62-coach-deletion-confirm',
  '62b-coach-deletion-confirm-filled',
  '62c-coach-deletion-confirm-ready',
  '63-coach-deletion-done',
  '64-access-ended',
  '65-coach-settings-no-export',
  '66-deletion-reminder',
  '66b-deletion-reminder-push',
  '67-deletion-overdue',
  '68-account-suspended',
  '68b-suspension-push',
  '69-parent-coaching-ended',
  '70-teen-registry-disclosure',
  '70b-parent-registry-disclosure',
  '70c-cert-verified-teen',
  '70d-cert-verified-parent',
  '70e-parent-approval-pending',
] as const;

export type Phase6ScreenId = (typeof PHASE6_SCREEN_IDS)[number];

export function Phase6Screen({ id }: { id: Phase6ScreenId | string }): ReactElement {
  switch (id) {
    case '01-become-a-coach':
      return <BecomeACoachScreen />;
    case '02-apply-intro':
      return <ApplyIntroScreen />;
    case '03-age-attestation':
      return <AgeAttestScreen />;
    case '03b-age-attestation-on':
      return <AgeAttestScreen on />;
    case '04-certification':
      return <CertificationScreen />;
    case '05-identity-check':
      return <IdentityScreen />;
    case '06-coach-terms':
      return <CoachTermsScreen />;
    case '06b-coach-terms-on':
      return <CoachTermsScreen on />;
    case '06c-coach-terms-nudge':
      return <CoachTermsScreen nudge />;
    case '07-apply-pending':
      return <ApplyPendingScreen />;
    case '08-apply-approved':
      return <ApplyApprovedScreen />;
    case '09-apply-need-info':
      return <ApplyNeedInfoScreen />;
    case '10-minors-intro':
      return <MinorsIntroScreen />;
    case '11-abuse-training':
      return <AbuseTrainingScreen />;
    case '12-abuse-training-attest':
      return <AbuseAttestScreen />;
    case '12b-abuse-training-attest-on':
      return <AbuseAttestScreen on />;
    case '13-minors-pending':
      return <MinorsPendingScreen />;
    case '14-minors-approved':
      return <MinorsApprovedScreen />;
    case '15-minors-not-approved':
      return <MinorsNotApprovedScreen />;
    case '15b-minors-name-match':
      return <MinorsNameMatchScreen />;
    case '16-studio-locked':
      return <StudioLockedScreen />;
    case '17-studio-clients':
      return <StudioClientsScreen />;
    case '17b-studio-clients-deletion-banner':
      return <StudioClientsScreen banner />;
    case '18-studio-clients-empty':
      return <StudioClientsScreen empty />;
    case '19-client-adult':
      return <ClientAdultScreen />;
    case '20-client-adult-photos':
      return <ClientAdultScreen photos />;
    case '21-client-teen':
      return <ClientTeenScreen />;
    case '22-end-relationship':
      return <EndRelationshipScreen />;
    case '23-plan-week':
      return <PlanWeekScreen />;
    case '24-plan-day':
      return <PlanDayScreen />;
    case '25-plan-add-exercise':
      return <PlanDayScreen add />;
    case '26-plan-empty':
      return <PlanWeekScreen empty />;
    case '27-tempo-editor':
      return <TempoEditorScreen />;
    case '28-tempo-per-set':
      return <TempoEditorScreen perSet />;
    case '29-activity':
      return <ActivityScreen />;
    case '30-activity-tempo-hidden':
      return <ActivityScreen hidden />;
    case '31-activity-empty':
      return <ActivityScreen empty />;
    case '32-coach-picks':
      return <CoachPicksScreen />;
    case '33-coach-picks-add':
      return <CoachPicksScreen add />;
    case '34-coach-picks-full':
      return <CoachPicksScreen full />;
    case '35-coach-picks-empty':
      return <CoachPicksScreen empty />;
    case '36-library-browse':
      return <LibraryBrowseScreen />;
    case '37-library-my-exercises':
      return <LibraryBrowseScreen mine />;
    case '38-library-empty':
      return <LibraryBrowseScreen empty />;
    case '39-library-detail':
      return <LibraryDetailScreen />;
    case '40-library-edit-cues':
      return <EditCuesScreen />;
    case '41-create-basics':
      return <CreateBasicsScreen />;
    case '42-create-tracking':
      return <CreateTrackingScreen />;
    case '43-create-demo':
      return <CreateDemoScreen />;
    case '44-record-demo':
      return <RecordDemoScreen />;
    case '45-trim-demo':
      return <TrimDemoScreen />;
    case '46-demo-pending':
      return <DemoPendingScreen />;
    case '47-client-view-custom':
      return <ClientViewCustomScreen />;
    case '48-report-video':
      return <ReportVideoScreen />;
    case '49-report-reasons':
      return <ReportReasonsScreen />;
    case '50-video-removed-notice':
      return <VideoRemovedNoticeScreen />;
    case '51-block-user':
      return <BlockUserScreen />;
    case '52-blocked-list':
      return <BlockedListScreen />;
    case '53-dmca-request':
      return <DmcaRequestScreen />;
    case '53b-dmca-request-signed':
      return <DmcaRequestScreen signed />;
    case '54-dmca-received':
      return <DmcaReceivedScreen />;
    case '55-safety-reporting':
      return <SafetyReportingScreen />;
    case '56-ncmec-policy':
      return <NcmecPolicyScreen />;
    case '57-uploads-suspended':
      return <UploadsSuspendedScreen />;
    case '58-ask-coach-delete':
      return <AskCoachDeleteScreen />;
    case '59-ask-coach-delete-confirm':
      return <AskCoachDeleteConfirmScreen />;
    case '60-ask-coach-delete-sent':
      return <AskCoachDeleteSentScreen />;
    case '61-coach-deletion-request':
      return <CoachDeletionRequestScreen />;
    case '62-coach-deletion-confirm':
      return <CoachDeletionConfirmScreen />;
    case '62b-coach-deletion-confirm-filled':
      return <CoachDeletionConfirmScreen filled />;
    case '62c-coach-deletion-confirm-ready':
      return <CoachDeletionConfirmScreen filled ready />;
    case '63-coach-deletion-done':
      return <CoachDeletionDoneScreen />;
    case '64-access-ended':
      return <AccessEndedScreen />;
    case '65-coach-settings-no-export':
      return <CoachSettingsNoExportScreen />;
    case '66-deletion-reminder':
      return <DeletionReminderScreen />;
    case '66b-deletion-reminder-push':
      return <DeletionReminderPushScreen />;
    case '67-deletion-overdue':
      return <DeletionOverdueScreen />;
    case '68-account-suspended':
      return <AccountSuspendedScreen />;
    case '68b-suspension-push':
      return <SuspensionPushScreen />;
    case '69-parent-coaching-ended':
      return <ParentCoachingEndedScreen />;
    case '70-teen-registry-disclosure':
      return <TeenRegistryDisclosureScreen />;
    case '70b-parent-registry-disclosure':
      return <ParentRegistryDisclosureScreen />;
    case '70c-cert-verified-teen':
      return <CertVerifiedTeenScreen />;
    case '70d-cert-verified-parent':
      return <CertVerifiedParentScreen />;
    case '70e-parent-approval-pending':
      return <ParentApprovalPendingScreen />;
    default:
      return <StudioLockedScreen />;
  }
}
