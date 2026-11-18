import { Linking, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Avatar,
  BackRow,
  Caption,
  CheckRow,
  DemoFigure,
  EmptyState,
  EqualRow,
  Field,
  GlassCard,
  Phase6Shell,
  PrimaryButton,
  SettingsRow,
  SheetOverlay,
  SwitchRow,
  TextLink,
  Toast,
} from '../chrome';
import { ClientAdultBody, ClientAdultScreen, StudioClientsScreen } from './StudioScreens';
import { ClientViewCustomScreen } from './LibraryScreens';
import { DFPS_HOTLINE_URL, DFPS_ONLINE_URL, EMERGENCY_URL } from '../safetyLinks';

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

function Muted({ children, style }: { children: string; style?: object }) {
  const { colors } = useTheme();
  return <Text variant="small" color={colors.textMuted} style={style}>{children}</Text>;
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
    <Phase6Shell
      hideTab
      athleteTab={1}
      overlay={
        <SheetOverlay
          top={200}
          title="Why are you reporting this?"
          body="Pick the option that fits best. If this is about copyright, you can also use the copyright request form."
          bodyStyle={{ marginTop: 6 }}
        >
          <GlassCard style={{ marginTop: 12, borderRadius: 20 }}>
            {reasons.map((r, i) => (
              <View key={r} style={{ minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderTopWidth: i ? 1 : 0, borderTopColor: colors.glassBorder }}>
                <Text variant="body" style={{ flex: 1 }}>{r}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            ))}
          </GlassCard>
          <EqualRow left="Cancel" />
        </SheetOverlay>
      }
    >
      <ClientViewCustomScreen embedded />
    </Phase6Shell>
  );
}

export function VideoRemovedNoticeScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3} overlay={<Toast message="We hid this demo while we review a report." />}>
      <Muted>Library</Muted>
      <Text variant="title" accessibilityRole="header">Studio</Text>
      <GlassCard style={{ marginTop: 16, borderRadius: 24 }}>
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <DemoFigure w={56} h={56} />
            <View style={{ flex: 1 }}>
              <Text variant="body">Half-kneeling landmine press</Text>
              <Text variant="small" color={colors.textMuted}>Demo hidden while we review a report</Text>
            </View>
          </View>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 10 }}>Your clients see the default demo, if there is one, until this is resolved. Repeat problems can pause your uploads.</Text>
        </View>
      </GlassCard>
      <PrimaryButton label="Got it" />
    </Phase6Shell>
  );
}

export function BlockUserScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell
      athleteTab={3}
      hideTab
      overlay={
        <SheetOverlay title="Block Alex?" body="Alex won’t be able to message you or see your shared data. The coaching relationship ends right away. You can still report a safety concern.">
          <EqualRow left="Cancel" right="Block Alex" danger stacked />
        </SheetOverlay>
      }
    >
      <BackRow title="Alex Rivera" />
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 12, alignItems: 'center' }}>
        <Avatar initials="AR" size={56} />
        <View>
          <Text variant="title" accessibilityRole="header">Alex Rivera</Text>
          <Muted>Your 1:1 coach</Muted>
        </View>
      </View>
      <GlassCard style={{ marginTop: 16, borderRadius: 24 }}>
        <View style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="flag-outline" size={20} color={colors.textMuted} />
          <Text variant="body" style={{ flex: 1 }}>Report</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
        <View style={{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.glassBorder }}>
          <Ionicons name="ban-outline" size={20} color={colors.textMuted} />
          <Text variant="body" style={{ flex: 1 }}>Block</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </GlassCard>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10 }}>Blocking hides Alex’s content from you and ends the coaching relationship. You can unblock later in Settings › Privacy › Blocked.</Text>
    </Phase6Shell>
  );
}

export function BlockedListScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Privacy" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Blocked</Text>
      <Muted style={{ marginTop: 6 }}>People you’ve blocked can’t message you or see your shared data. Unblocking doesn’t restart coaching on its own.</Muted>
      <GlassCard style={{ marginTop: 16, borderRadius: 24 }}>
        <View style={{ minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Avatar initials="AR" size={44} />
          <View style={{ flex: 1 }}>
            <Text variant="body">Alex Rivera</Text>
            <Text variant="label" color={colors.textMuted}>Blocked Nov 17, 2026</Text>
          </View>
          <Text variant="small" color={colors.accentInk} style={{ fontWeight: '600' }}>Unblock</Text>
        </View>
      </GlassCard>
    </Phase6Shell>
  );
}

export function DmcaRequestScreen({ signed = false }: { signed?: boolean }) {
  const { colors } = useTheme();
  return (
    <Phase6Shell
      hideTab
      overlay={
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: 24, zIndex: 4 }}>
          <Text variant="label" color={colors.textMuted}>Knowingly false claims can make you liable for damages.</Text>
          <EqualRow left="Cancel" right="Submit request" />
        </View>
      }
    >
      <View style={{ paddingBottom: 160 }}>
        <BackRow title="Legal" />
        <Text variant="title" accessibilityRole="header">Copyright request</Text>
        <Muted style={{ marginTop: 2 }}>Use this if you own a copyright and think something on [App] uses it without permission. We need enough detail to find the material. This isn’t a general report form.</Muted>
        <Field tight label="Your name and email" value="Jordan Hale · jordan@email.com" />
        <Field tight label="Phone number or mailing address" value="(512) 555-0148" />
        <Field tight label="The work you own" value={'Instructional video, “Landmine press — side view”'} />
        <Field tight mutedValue label="Where it appears in [App]" value="Coach demo on Half-kneeling landmine press" />
        <Field tight label="Type your full name to sign" value={signed ? 'Jordan Hale' : undefined} placeholder="Type your full name" />
        <GlassCard style={{ marginTop: 6, borderRadius: 20 }}>
          <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <CheckRow label={FIVE_TEN} on={signed} a11y={FIVE_TEN} />
          </View>
        </GlassCard>
      </View>
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

/** Opens a phone or web link for a safety action. A failure must never crash the screen. */
function openSafetyUrl(url: string) {
  void Linking.openURL(url).catch(() => {});
}

export function SafetyReportingScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Safety" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Report suspected abuse</Text>
      <Muted style={{ marginTop: 8 }}>If you believe a child is being abused or neglected, Texas law requires you to report it right away (Fam. Code §261.101). Telling [App] doesn’t meet that duty. This screen is a guide, not legal advice.</Muted>
      <Text variant="bodyStrong" style={{ marginTop: 10, marginBottom: 4 }}>Report to Texas DFPS</Text>
      <Muted>Call the Texas Abuse Hotline, 24/7, or report online if it isn’t urgent. DFPS asks for your name and phone number and keeps them confidential.</Muted>
      <PrimaryButton label="Call 1-800-252-5400" onPress={() => openSafetyUrl(DFPS_HOTLINE_URL)} style={{ marginTop: 8 }} />
      <PrimaryButton label="Report online at txabusehotline.org" onPress={() => openSafetyUrl(DFPS_ONLINE_URL)} style={{ marginTop: 6 }} />
      <Muted style={{ marginTop: 8 }}>If someone is in immediate danger, call 911.</Muted>
      <PrimaryButton label="Call 911" onPress={() => openSafetyUrl(EMERGENCY_URL)} style={{ marginTop: 6 }} />
      <TextLink label="View reporting training" style={{ marginTop: 8 }} />
      <GlassCard style={{ marginTop: 10, borderRadius: 24 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text variant="body">Tell [App] too</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>After you report to DFPS or the police, you can also tell us so we can act on [App], like pausing an account. This doesn’t replace your report.</Text>
        </View>
      </GlassCard>
      <EqualRow left="Tell [App] too" />
    </Phase6Shell>
  );
}

export function NcmecPolicyScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={4}>
      <BackRow title="Safety" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>How we report illegal content</Text>
      <Muted style={{ marginTop: 8 }}>If we learn of apparent child sexual exploitation on [App], including child sexual abuse material, enticement or trafficking of a minor, we report it to NCMEC’s CyberTipline as US law requires (18 U.S.C. §2258A) and preserve the reported material for 1 year.</Muted>
      <GlassCard style={{ marginTop: 14, borderRadius: 24 }}>
        <View style={{ padding: 16 }}>
          <Text variant="body">What you’ll see</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>If a photo or video doesn’t pass our safety check, we remove it. We don’t show the flagged content or the details of a report in the app.</Text>
        </View>
      </GlassCard>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 12 }}>16–17 year olds can’t upload progress photos.</Text>
      <EqualRow left="Got it" />
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
      <EqualRow left="Back to library" right="Contact support" />
    </Phase6Shell>
  );
}

function AskCoachDeleteBody() {
  const { colors } = useTheme();
  return (
    <>
      <BackRow title="Privacy" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Ask Alex to delete your data</Text>
      <Muted style={{ marginTop: 8 }}>We’ll tell Alex to delete every copy of your data within 30 days, including anything saved outside [App], as our Coach Terms require. Coaching with Alex ends, and Alex loses access right away. We also remove anything of yours we kept for Alex in [App]. Your own account and history stay unless you delete them in Your privacy rights.</Muted>
      <GlassCard style={{ borderRadius: 24 }}>
        <View style={{ padding: 16 }}>
          <Text variant="body">What happens next</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>Alex must confirm the deletion by Dec 17. We remove Alex’s access now, without waiting for Alex. Coaches don’t get a copy or export of your data from us. There is no parent export.</Text>
        </View>
      </GlassCard>
      <EqualRow left="Not now" right="Continue" />
    </>
  );
}

export function AskCoachDeleteScreen() {
  return (
    <Phase6Shell athleteTab={3}>
      <AskCoachDeleteBody />
    </Phase6Shell>
  );
}

export function AskCoachDeleteConfirmScreen() {
  return (
    <Phase6Shell
      athleteTab={3}
      hideTab
      overlay={
        <SheetOverlay
          title="Send this request?"
          body="This ends coaching with Alex right away and asks Alex to delete every copy. You can still use [App] and download your own data from Download my data first if you want a copy."
        >
          <EqualRow left="Not now" right="Send request" danger stacked />
        </SheetOverlay>
      }
    >
      <AskCoachDeleteBody />
    </Phase6Shell>
  );
}

export function AskCoachDeleteSentScreen() {
  return (
    <Phase6Shell athleteTab={3} overlay={<Toast message="Alex can’t see your data anymore. We asked Alex to delete every copy." />}>
      <BackRow title="Privacy" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Request sent</Text>
      <Muted style={{ marginTop: 8 }}>Alex can no longer see your shared data. We’ve asked Alex to delete every copy by Dec 17 and to confirm. We’ll tell you when Alex confirms.</Muted>
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
  const attest = 'I confirm I’ve deleted every copy of Kevin’s data I had, in and outside [App], and kept none except records the law requires.';
  return (
    <Phase6Shell
      tab={3}
      hideTab
      overlay={
        <SheetOverlay
          top={70}
          title="Confirm you’ve deleted Kevin’s data"
          body="Under the Coach Terms, you must delete every copy of Kevin’s data by Dec 17, including anything saved outside [App]. Your access has already ended. Mark each item, then confirm."
          bodyStyle={{ marginTop: 4 }}
        >
          <GlassCard style={{ borderRadius: 20, marginTop: 8, backgroundColor: colors.photo, borderWidth: 1.5, borderColor: colors.faint }}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 2 }}>
              {ITEMS.map((it, i) => (
                <View key={it.label} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 7, borderTopWidth: i ? 1 : 0, borderTopColor: colors.glassBorder }}>
                  <Text variant="small" style={{ flex: 1 }}>{it.label}</Text>
                  <Chip label={it.a} on={picks[it.label] === it.a} />
                  <Chip label={it.b} on={picks[it.label] === it.b} />
                </View>
              ))}
            </View>
          </GlassCard>
          <GlassCard style={{ borderRadius: 20, marginTop: 8, backgroundColor: colors.photo, borderWidth: 1.5, borderColor: colors.faint }}>
            <View style={{ paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Text variant="small" style={{ flex: 1 }}>{attest}</Text>
              <Switch
                value={ready}
                onValueChange={() => undefined}
                accessibilityLabel={attest}
                trackColor={{ false: colors.borderStrong, true: colors.accent }}
                thumbColor={ready ? colors.accentText : colors.surfaceRaised}
              />
            </View>
          </GlassCard>
          {ready && !filled ? (
            <View style={{ marginTop: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.surfaceRaised }}>
              <Text variant="small">Mark each item, then turn on the confirmation. Confirm deletion saves whatever the switch says. You can only submit when every row is answered and the switch is on.</Text>
            </View>
          ) : null}
          {filled && !ready ? (
            <Text variant="label" color={colors.textMuted} style={{ marginTop: 8 }}>Confirm deletion works when every row is answered and the switch is on. The switch starts off.</Text>
          ) : null}
          <EqualRow left="I’ll do this later" right="Confirm deletion" />
        </SheetOverlay>
      }
    >
      <ClientAdultBody deleteAsk />
    </Phase6Shell>
  );
}

export function CoachDeletionDoneScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3} overlay={<Toast message="You confirmed Kevin’s data was deleted." />}>
      <Muted>Coach workspace</Muted>
      <Text variant="title" accessibilityRole="header">Studio</Text>
      <Muted style={{ marginTop: 4 }}>3 clients</Muted>
      <GlassCard style={{ marginTop: 14, borderRadius: 24 }}>
        <View style={{ padding: 16 }}>
          <Text variant="body">You confirmed deletion for Kevin</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>Thanks. Your confirmation was saved on Nov 17. If you find another copy later, delete it right away.</Text>
        </View>
      </GlassCard>
      <PrimaryButton label="Back to clients" />
    </Phase6Shell>
  );
}

export function AccessEndedScreen() {
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Access ended</Text>
      <Muted style={{ marginTop: 8 }}>Your coaching relationship with Kevin has ended. You can’t see Kevin’s plans, logs, photos, favorites or messages anymore. Delete every copy you have outside [App] by Dec 17, and confirm.</Muted>
      <EqualRow left="Back to Studio" />
    </Phase6Shell>
  );
}

export function CoachSettingsNoExportScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={4}>
      <BackRow title="" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Coaching</Text>
      <Muted style={{ marginTop: 4 }}>Your verification, minors approval, and duties under the Coach Terms.</Muted>
      <GlassCard style={{ marginTop: 14, borderRadius: 24 }}>
        <SettingsRow first icon="shield-checkmark-outline" label="Certification verified" sub="NASM checked · identity passed" />
        <SettingsRow icon="people-outline" label="Work with 16–17 year olds" sub="Approved" />
        <SettingsRow icon="school-outline" label="Reporting training" sub="Completed" />
        <SettingsRow icon="flag-outline" label="Report suspected abuse" sub="Texas DFPS hotline and guide" />
      </GlassCard>
      <Text variant="bodyStrong" style={{ marginTop: 16, marginBottom: 8 }}>Client data</Text>
      <GlassCard style={{ borderRadius: 24, marginTop: 0 }}>
        <SettingsRow first highlight icon="trash-outline" label="Deletion requests" sub="Delete client data within 30 days after coaching ends or a client asks" />
      </GlassCard>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10, paddingHorizontal: 4 }}>You can’t download a copy of a client’s data from [App]. When coaching ends, or a client or we ask, you must delete every copy within 30 days, including anything saved outside [App], and confirm. Ending a relationship cuts off access right away.</Text>
    </Phase6Shell>
  );
}

export function DeletionReminderScreen() {
  return (
    <Phase6Shell tab={3} overlay={<Toast message="Reminder: delete Kevin’s data by Dec 17 and confirm in Studio." />}>
      <ClientAdultBody deleteAsk />
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
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <Muted>Coach workspace</Muted>
      <Text variant="title" accessibilityRole="header">Studio</Text>
      <GlassCard style={{ marginTop: 16, borderRadius: 24, backgroundColor: colors.surfaceRaised, borderWidth: 2, borderColor: colors.accent }}>
        <View style={{ padding: 16 }}>
          <Text variant="heading">Deletion for Kevin is overdue</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 6 }}>Confirm now. Our trust and safety team has been told, and you can’t add new clients until you confirm.</Text>
        </View>
      </GlassCard>
      <PrimaryButton label="Confirm deletion" />
    </Phase6Shell>
  );
}

export function AccountSuspendedScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <Muted>Coach workspace</Muted>
      <Text variant="title" accessibilityRole="header">Studio</Text>
      <GlassCard style={{ marginTop: 16, borderRadius: 24 }}>
        <View style={{ padding: 16 }}>
          <Text variant="heading">Your coach account is suspended</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 6 }}>You didn’t confirm deleting Kevin’s data by Dec 17, 30 days after coaching ended. Confirm now to ask us to review your account. Your clients have been told coaching has ended.</Text>
        </View>
      </GlassCard>
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
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Coaching ended</Text>
      <PrimaryButton label="Got it" />
    </Phase6Shell>
  );
}

function TeenRegistryBody() {
  const { colors } = useTheme();
  return (
    <>
      <BackRow title="Alex Rivera" />
      <View style={{ flexDirection: 'row', gap: 14, marginTop: 12, alignItems: 'center' }}>
        <Avatar initials="AR" size={56} />
        <View style={{ flex: 1 }}>
          <Text variant="title" accessibilityRole="header">Alex Rivera</Text>
          <Muted>1:1 coach · Certification verified</Muted>
        </View>
      </View>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">How we check coaches who work with teens</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>We check coaches who work with teens against the national sex offender registry. We don’t run criminal background checks.</Text>
        </View>
      </GlassCard>
      <TextLink label="What certification verified means" />
    </>
  );
}

export function TeenRegistryDisclosureScreen() {
  return (
    <Phase6Shell athleteTab={3}>
      <TeenRegistryBody />
    </Phase6Shell>
  );
}

function ParentRegistryBody() {
  const { colors } = useTheme();
  return (
    <>
      <BackRow title="Parent consent" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>Approve 1:1 coaching</Text>
      <Muted style={{ marginTop: 8 }}>You’re approving 1:1 coaching for Sam with Alex Rivera.</Muted>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>{PARENT_SEE_LINE}</Text>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="body">How we check coaches who work with teens</Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 4 }}>We check coaches who work with teens against the national sex offender registry. We don’t run criminal background checks.</Text>
        </View>
      </GlassCard>
      <TextLink label="What certification verified means" />
      <EqualRow left="Not now" right="Approve coaching" />
    </>
  );
}

export function ParentRegistryDisclosureScreen() {
  return (
    <Phase6Shell athleteTab={3}>
      <ParentRegistryBody />
    </Phase6Shell>
  );
}

const certSheet = (
  <SheetOverlay title="What certification verified means" body={CERT_VERIFIED_BODY}>
    <PrimaryButton label="Got it" />
  </SheetOverlay>
);

export function CertVerifiedTeenScreen() {
  return (
    <Phase6Shell athleteTab={3} hideTab overlay={certSheet}>
      <TeenRegistryBody />
    </Phase6Shell>
  );
}

export function CertVerifiedParentScreen() {
  return (
    <Phase6Shell athleteTab={3} hideTab overlay={certSheet}>
      <ParentRegistryBody />
    </Phase6Shell>
  );
}

export function ParentApprovalPendingScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Parent consent" />
      <Caption style={{ marginTop: 8 }}>Waiting for Sam to agree</Caption>
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 4 }}>Approve 1:1 coaching</Text>
      <Muted style={{ marginTop: 8 }}>You’ve approved 1:1 coaching for Sam with Alex Rivera. Sharing with Alex turns on only after Sam also agrees.</Muted>
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
