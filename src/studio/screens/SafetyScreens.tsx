import { View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  BackRow,
  Caption,
  CheckRow,
  EmptyState,
  EqualRow,
  Field,
  GlassCard,
  Phase6Shell,
  PrimaryButton,
  SheetOverlay,
  SwitchRow,
  TextLink,
} from '../chrome';
import { ClientAdultScreen, StudioClientsScreen } from './StudioScreens';
import { ClientViewCustomScreen } from './LibraryScreens';

const FIVE_TEN =
  'I have a good-faith belief that this use isn’t authorized by the copyright owner, its agent or the law. The information in this request is accurate, and under penalty of perjury, I’m the owner or authorized to act for the owner. My typed name is my electronic signature.';

const CERT_VERIFIED_BODY =
  'Certification verified means [Company] reviewed Alex’s application, checked the certification Alex submitted with the issuer’s lookup tool, and confirmed Alex’s identity check passed. It isn’t a medical or dietetics license or a background check.';

const PARENT_SEE_LINE =
  'Alex will see Sam’s workouts, history, PRs and charts, and form checks as skeleton and numbers only. Alex never sees Sam’s weight or other health info, and Sam has no progress photos.';

const ITEMS: { label: string; a: string; b: string }[] = [
  { label: 'Progress photos', a: 'Deleted', b: 'None' },
  { label: 'Weigh-ins and health info', a: 'Deleted', b: 'None' },
  { label: 'Messages', a: 'Deleted', b: 'None' },
  { label: 'Notes and files', a: 'Deleted', b: 'None' },
  { label: 'Downloads and screenshots', a: 'Deleted', b: 'None' },
  { label: 'Copies in other apps or tools (email, spreadsheets, cloud drives)', a: 'Deleted', b: 'None' },
  { label: 'Records the law requires me to keep, for example payment records', a: 'Kept only what’s required', b: 'None' },
];

function Muted({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text variant="small" color={colors.textMuted}>{children}</Text>;
}

function Sheet({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 16, backgroundColor: colors.surface, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderWidth: 1, borderColor: colors.glassBorder, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 24 }}>
      <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 14 }} />
      <Text variant="heading">{title}</Text>
      {body ? <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>{body}</Text> : null}
      {children}
    </View>
  );
}

function Chip({ label, on }: { label: string; on?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 32, borderRadius: 16, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: on ? colors.tabOn : colors.glass, borderWidth: 1, borderColor: on ? colors.tabOn : colors.glassBorder }}>
      <Text variant="label" color={on ? colors.tabOnText : colors.text} style={{ fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function ReportVideoScreen() {
  return (
    <Phase6Shell
      athleteTab={1}
      hideTab
      overlay={
        <SheetOverlay
          title="Report this video?"
          body="Tell us why. We review reports and may hide the video while we look. Reports made in bad faith can lead to limits on an account."
        >
          <EqualRow left="Cancel" right="Choose a reason" />
        </SheetOverlay>
      }
    >
      <ClientViewCustomScreen embedded />
    </Phase6Shell>
  );
}

export function ReportReasonsScreen() {
  const reasons = ['Nudity or sexual content', 'Violence or harm', 'Someone else is in the shot', 'Looks like spam or advertising', 'Copyright or legal concern', 'Something else'];
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={1} hideTab>
      <BackRow title="Report" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Why are you reporting this?</Text>
      <Muted>Pick the option that fits best. If this is about copyright, you can also use the copyright request form.</Muted>
      <GlassCard>
        {reasons.map((r, i) => (
          <View key={r} style={{ minHeight: 52, paddingHorizontal: 16, justifyContent: 'center', borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
            <Text variant="body">{r}</Text>
          </View>
        ))}
      </GlassCard>
      <EqualRow left="Cancel" right="Submit report" />
    </Phase6Shell>
  );
}

export function VideoRemovedNoticeScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Library" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Half-kneeling landmine press</Text>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">Demo hidden while we review a report</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>Your clients see the default demo, if there is one, until this is resolved. Repeat problems can pause your uploads.</Text>
        </View>
      </GlassCard>
      <PrimaryButton label="Got it" />
    </Phase6Shell>
  );
}

export function BlockUserScreen() {
  return (
    <Phase6Shell athleteTab={3} hideTab>
      <BackRow title="Alex Rivera" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Block Alex?</Text>
      <Muted>Alex won’t be able to message you or see your shared data. The coaching relationship ends right away. You can still report a safety concern.</Muted>
      <EqualRow left="Cancel" right="Block" danger />
    </Phase6Shell>
  );
}

export function BlockedListScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Privacy" />
      <Text variant="title" accessibilityRole="header">Blocked</Text>
      <Muted>People you’ve blocked can’t message you or see your shared data. Unblocking doesn’t restart coaching on its own.</Muted>
      <GlassCard>
        <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body">Alex Rivera</Text>
          <Text variant="small" color={colors.accentInk} style={{ fontWeight: '600' }}>Unblock</Text>
        </View>
      </GlassCard>
    </Phase6Shell>
  );
}

export function DmcaRequestScreen({ signed = false }: { signed?: boolean }) {
  const { colors } = useTheme();
  return (
    <Phase6Shell hideTab>
      <BackRow title="Copyright" />
      <Text variant="title" accessibilityRole="header">Copyright request</Text>
      <Muted>Use this if you own a copyright and think something on [App] uses it without permission. We need enough detail to find the material. This isn’t a general report form.</Muted>
      <Field label="Your name" value={signed ? 'Jordan Hale' : undefined} placeholder="Full name" />
      <Field label="Email" value={signed ? 'jordan@email.com' : undefined} placeholder="Email" />
      <Field label="Phone" value={signed ? '(512) 555-0148' : undefined} placeholder="Phone" />
      <Field label="What to take down" value="Half-kneeling landmine press demo" />
      <CheckRow label={FIVE_TEN} on={signed} a11y={FIVE_TEN} />
      <EqualRow left="Cancel" right="Submit request" />
    </Phase6Shell>
  );
}

export function DmcaReceivedScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Library" />
      <Text variant="title" accessibilityRole="header">Copyright notice</Text>
      <Muted>We received a copyright request about your demo for Half-kneeling landmine press. We’ve hidden that video while we review it. Your clients see the default demo for now, if there is one.</Muted>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">What you can do</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>If you think this was a mistake, you can send a counter-notice from this page. We’ll email you the next steps. Don’t upload the same video again while this is open. Accounts with repeated copyright problems can be closed.</Text>
        </View>
      </GlassCard>
      <EqualRow left="Got it" right="Send a counter-notice" />
    </Phase6Shell>
  );
}

export function SafetyReportingScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Safety" />
      <Text variant="title" accessibilityRole="header">Report suspected abuse</Text>
      <Muted>If you believe a child is being abused or neglected, Texas law requires you to report it right away (Fam. Code §261.101). Telling [App] doesn’t meet that duty. This screen is a guide, not legal advice.</Muted>
      <GlassCard>
        <View style={{ padding: 16, gap: 10 }}>
          <Text variant="body">Call the Texas Abuse Hotline, 24/7, or report online if it isn’t urgent. DFPS asks for your name and phone number and keeps them confidential.</Text>
          <Text variant="body">If someone is in immediate danger, call 911.</Text>
          <Text variant="small" color={colors.textMuted}>After you report to DFPS or the police, you can also tell us so we can act on [App], like pausing an account. This doesn’t replace your report.</Text>
        </View>
      </GlassCard>
      <PrimaryButton label="Got it" />
    </Phase6Shell>
  );
}

export function NcmecPolicyScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Safety" />
      <Text variant="title" accessibilityRole="header">How we report illegal content</Text>
      <Muted>If we learn of apparent child sexual exploitation on [App], including child sexual abuse material, enticement or trafficking of a minor, we report it to NCMEC’s CyberTipline as US law requires (18 U.S.C. §2258A) and preserve the reported material as required.</Muted>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>If a photo or video doesn’t pass our safety check, we remove it. We don’t show the flagged content or the details of a report in the app.</Text>
      <PrimaryButton label="Got it" />
    </Phase6Shell>
  );
}

export function UploadsSuspendedScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header">Uploads paused</Text>
      <Muted>Your custom-video uploads are paused after repeated or serious violations of our upload rules. Existing demos that passed a check stay up unless we hid them. You can appeal from Support.</Muted>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">What you can still do</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>Use default demos, edit cues, and coach your clients. Recording or uploading a new demo is unavailable until this is lifted.</Text>
        </View>
      </GlassCard>
      <PrimaryButton label="Contact Support" />
    </Phase6Shell>
  );
}

export function AskCoachDeleteScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Privacy" />
      <Text variant="title" accessibilityRole="header">Ask Alex to delete your data</Text>
      <Muted>We’ll tell Alex to delete every copy of your data within 30 days, including anything saved outside [App], as our Coach Terms require. Coaching with Alex ends, and Alex loses access right away. We also remove anything of yours we kept for Alex.</Muted>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>Alex must confirm the deletion by Dec 17. We remove Alex’s access now, without waiting for Alex. Coaches don’t get a copy or export of your data from us. There is no parent export.</Text>
      <PrimaryButton label="Continue" />
      <EqualRow left="Not now" />
    </Phase6Shell>
  );
}

export function AskCoachDeleteConfirmScreen() {
  return (
    <Phase6Shell athleteTab={3} hideTab>
      <BackRow title="Privacy" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>End coaching and ask Alex to delete?</Text>
      <Muted>This ends coaching with Alex right away and asks Alex to delete every copy. You can still use [App] and download your own data from Download my data first if you want a copy.</Muted>
      <EqualRow left="Keep coaching" right="End and ask Alex to delete" danger stacked />
    </Phase6Shell>
  );
}

export function AskCoachDeleteSentScreen() {
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Privacy" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Request sent</Text>
      <Muted>Alex can no longer see your shared data. We’ve asked Alex to delete every copy by Dec 17 and to confirm. We’ll tell you when Alex confirms.</Muted>
      <PrimaryButton label="Done" />
      <TextLink label="Download my data" />
    </Phase6Shell>
  );
}

export function CoachDeletionRequestScreen() {
  return <ClientAdultScreen deleteAsk />;
}

export function CoachDeletionConfirmScreen({ filled = false, ready = false }: { filled?: boolean; ready?: boolean }) {
  const { colors } = useTheme();
  const picks: Record<string, string> = filled || ready ? {
    'Progress photos': 'Deleted',
    'Weigh-ins and health info': 'Deleted',
    'Messages': 'Deleted',
    'Notes and files': 'None',
    'Downloads and screenshots': 'Deleted',
    'Copies in other apps or tools (email, spreadsheets, cloud drives)': 'Deleted',
    'Records the law requires me to keep, for example payment records': 'Kept only what’s required',
  } : {};
  return (
    <Phase6Shell tab={3} hideTab>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Confirm deletion</Text>
      <Muted>Under the Coach Terms, you must delete every copy of Kevin’s data by Dec 17, including anything saved outside [App]. Your access has already ended. Mark each item, then confirm.</Muted>
      <GlassCard>
        <View style={{ padding: 12 }}>
          {ITEMS.map((it, i) => (
            <View key={it.label} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 7, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
              <Text variant="small" style={{ flex: 1 }}>{it.label}</Text>
              <Chip label={it.a} on={picks[it.label] === it.a} />
              <Chip label={it.b} on={picks[it.label] === it.b} />
            </View>
          ))}
        </View>
      </GlassCard>
      <SwitchRow
        label="I confirm I’ve deleted every copy of Kevin’s data I had, in and outside [App], and kept none except records the law requires."
        on={ready}
        a11y="I confirm I’ve deleted every copy of Kevin’s data I had, in and outside [App], and kept none except records the law requires."
      />
      {!filled && !ready ? (
        <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: colors.surfaceRaised }}>
          <Text variant="small">Mark each item, then turn on the confirmation. Confirm deletion saves whatever the switch says. You can only submit when every row is answered and the switch is on.</Text>
        </View>
      ) : null}
      {filled && !ready ? (
        <Text variant="label" color={colors.textMuted} style={{ marginTop: 8 }}>Confirm deletion works when every row is answered and the switch is on. The switch starts off.</Text>
      ) : null}
      <EqualRow left="Not now" right="Confirm deletion" />
    </Phase6Shell>
  );
}

export function CoachDeletionDoneScreen() {
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>You confirmed deletion for Kevin</Text>
      <Muted>Thanks. Your confirmation was saved on Nov 17. If you find another copy later, delete it right away.</Muted>
      <PrimaryButton label="Back to Studio" />
    </Phase6Shell>
  );
}

export function AccessEndedScreen() {
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Access ended</Text>
      <Muted>Your coaching relationship with Kevin has ended. You can’t see Kevin’s plans, logs, photos, favorites or messages anymore. Delete every copy you have outside [App] by Dec 17, and confirm.</Muted>
      <PrimaryButton label="Confirm deletion" />
    </Phase6Shell>
  );
}

export function CoachSettingsNoExportScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={4}>
      <BackRow title="Profile" />
      <Muted>Coach</Muted>
      <Text variant="title" accessibilityRole="header">Coaching</Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>Your verification, minors approval, and duties under the Coach Terms.</Text>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">Download client data</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>You don’t get an export of a client’s data from us. When coaching ends, delete every copy you have.</Text>
        </View>
      </GlassCard>
    </Phase6Shell>
  );
}

export function DeletionReminderScreen() {
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Delete by Dec 17</Text>
      <Muted>Reminder: delete Kevin’s data by Dec 17 and confirm in Studio.</Muted>
      <PrimaryButton label="Confirm deletion" />
    </Phase6Shell>
  );
}

export function DeletionReminderPushScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell hideTab>
      <Caption>Lock screen · annotation, not product copy</Caption>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="label" color={colors.textMuted}>[App]</Text>
          <Text variant="bodyStrong">Delete by Dec 17</Text>
          <Text variant="small" color={colors.textMuted}>Reminder: delete Kevin’s data by Dec 17 and confirm in Studio.</Text>
        </View>
      </GlassCard>
    </Phase6Shell>
  );
}

export function DeletionOverdueScreen() {
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Deletion for Kevin is overdue</Text>
      <Muted>Confirm now. Our trust and safety team has been told, and you can’t add new clients until you confirm.</Muted>
      <PrimaryButton label="Confirm deletion" />
    </Phase6Shell>
  );
}

export function AccountSuspendedScreen() {
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Your coach account is suspended</Text>
      <Muted>You didn’t confirm deleting Kevin’s data by Dec 17, 30 days after coaching ended. Confirm now to ask us to review your account. Your clients have been told coaching has ended.</Muted>
      <PrimaryButton label="Confirm deletion" />
    </Phase6Shell>
  );
}

export function SuspensionPushScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell hideTab>
      <Caption>Lock screen · annotation, not product copy</Caption>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="label" color={colors.textMuted}>[App]</Text>
          <Text variant="bodyStrong">Your coach account is suspended</Text>
          <Text variant="small" color={colors.textMuted}>You didn’t confirm deleting Kevin’s data by Dec 17, 30 days after coaching ended. Confirm now to ask us to review your account. Your clients have been told coaching has ended.</Text>
        </View>
      </GlassCard>
    </Phase6Shell>
  );
}

export function ParentCoachingEndedScreen() {
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Parent settings" />
      <Text variant="title" accessibilityRole="header">Coaching ended</Text>
      <PrimaryButton label="Got it" />
    </Phase6Shell>
  );
}

export function TeenRegistryDisclosureScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Coach" />
      <Muted>1:1 coach · Certification verified</Muted>
      <Text variant="title" accessibilityRole="header">Alex Rivera</Text>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">How we check coaches who work with teens</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>We check coaches who work with teens against the national sex offender registry. We don’t run criminal background checks.</Text>
        </View>
      </GlassCard>
      <TextLink label="What certification verified means" />
    </Phase6Shell>
  );
}

export function ParentRegistryDisclosureScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Parent consent" />
      <Text variant="title" accessibilityRole="header">Approve 1:1 coaching</Text>
      <Muted>You’re approving 1:1 coaching for Sam with Alex Rivera.</Muted>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>{PARENT_SEE_LINE}</Text>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">How we check coaches who work with teens</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>We check coaches who work with teens against the national sex offender registry. We don’t run criminal background checks.</Text>
        </View>
      </GlassCard>
      <TextLink label="What certification verified means" />
      <PrimaryButton label="Approve" />
      <EqualRow left="Not now" />
    </Phase6Shell>
  );
}

export function CertVerifiedTeenScreen() {
  return (
    <Phase6Shell athleteTab={3} hideTab>
      <BackRow title="Alex Rivera" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>What certification verified means</Text>
      <Muted>{CERT_VERIFIED_BODY}</Muted>
      <PrimaryButton label="Got it" />
    </Phase6Shell>
  );
}

export function CertVerifiedParentScreen() {
  return (
    <Phase6Shell athleteTab={3} hideTab>
      <BackRow title="Parent consent" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>What certification verified means</Text>
      <Muted>{CERT_VERIFIED_BODY}</Muted>
      <PrimaryButton label="Got it" />
    </Phase6Shell>
  );
}

export function ParentApprovalPendingScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Parent consent" />
      <Caption>Waiting for Sam to agree</Caption>
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 4 }}>Approve 1:1 coaching</Text>
      <Muted>You’ve approved 1:1 coaching for Sam with Alex Rivera. Sharing with Alex turns on only after Sam also agrees.</Muted>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>{PARENT_SEE_LINE}</Text>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">How we check coaches who work with teens</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>We check coaches who work with teens against the national sex offender registry. We don’t run criminal background checks.</Text>
        </View>
      </GlassCard>
      <TextLink label="What certification verified means" />
      <PrimaryButton label="Got it" />
    </Phase6Shell>
  );
}

void EmptyState;
void StudioClientsScreen;
