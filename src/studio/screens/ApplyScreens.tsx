import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import {
  Avatar,
  BackRow,
  Caption,
  CheckRow,
  EmptyState,
  EqualRow,
  Field,
  GlassCard,
  InfoRows,
  Phase6Shell,
  PrimaryButton,
  SettingsRow,
  StatusList,
  SwitchRow,
  TextLink,
} from '../chrome';

const TERMS_EXCERPT = [
  'Independent contractor, not an employee. You set your methods and hours. These terms don’t set prices, and they aren’t an exclusivity or employment agreement.',
  'Verified means we checked your certification with the issuer’s lookup tool (NASM, ACE, ACSM or NSCA) and your identity check passed. It isn’t a medical or dietetics license or a background check. Don’t call yourself a dietitian.',
  'When coaching ends, or a client asks, you must delete every copy of their data within 30 days, including anything saved outside [App], and confirm each item in [App]. You don’t get an export. Ending coaching cuts off your access right away.',
  'Working with 16–17 year olds needs a separate approval, reporting training, and a national sex offender registry search we run. We don’t run criminal background checks.',
];

export function BecomeACoachScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <Text variant="small" color={colors.textMuted}>
        Account
      </Text>
      <Text variant="title" accessibilityRole="header">
        Profile
      </Text>
      <GlassCard>
        <SettingsRow first icon="options-outline" label="Units" sub="Pounds and miles" />
        <SettingsRow icon="color-palette-outline" label="Appearance" sub="Midnight · Aurora" />
        <SettingsRow icon="heart-outline" label="Privacy" sub="Health data, AI, coach sharing" />
      </GlassCard>
      <Text variant="bodyStrong" style={{ marginTop: 16, marginBottom: 8 }}>
        Coaching
      </Text>
      <GlassCard>
        <SettingsRow icon="clipboard-outline" label="Become a coach" sub="Apply with a certification. You must be 18 or older." accentChevron />
      </GlassCard>
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10, paddingHorizontal: 4 }}>
        Verified means we checked a certification you submitted with the issuer’s lookup tool, and your identity check passed. It isn’t a medical or dietetics license or a background check.
      </Text>
    </Phase6Shell>
  );
}

export function ApplyIntroScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Become a coach" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 12 }}>
        Coach on [App]
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 6 }}>
        You’re applying as an independent coach, not an employee. Don’t call yourself a dietitian.
      </Text>
      <InfoRows
        rows={[
          {
            icon: 'checkmark-circle-outline',
            title: 'What verified means',
            body: 'We check a certification you submit with the issuer’s lookup tool (NASM, ACE, ACSM or NSCA), and your identity check has to pass before approval.',
          },
          {
            icon: 'document-text-outline',
            title: 'Coach Terms',
            body: 'You’ll review and agree to the Coach Terms, including a duty to delete a client’s data within 30 days after coaching ends or the client asks.',
          },
          {
            icon: 'people-outline',
            title: 'Working with 16–17 year olds',
            body: 'Optional, and approved separately. It requires reporting training and a national sex offender registry search we run. We don’t run criminal background checks.',
          },
        ]}
      />
      <PrimaryButton label="Start application" />
      <TextLink label="Not now" />
    </Phase6Shell>
  );
}

export function AgeAttestScreen({ on = false }: { on?: boolean }) {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Become a coach" />
      <Caption style={{ marginTop: 8 }}>Step 1 of 4</Caption>
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 4 }}>
        Confirm you’re 18 or older
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        Coaches must be 18 or older. The identity check has to pass before approval. Your date of birth isn’t shown here; we already have your age band from sign-up.
      </Text>
      <SwitchRow
        label="I confirm I am 18 or older"
        hint="This starts off. Turn it on only if it’s true."
        on={on}
        a11y="I confirm I am 18 or older"
      />
      <EqualRow left="Not now" right="Continue" />
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10 }}>
        Continue saves whatever the switch says. You can only move forward if it’s on.
      </Text>
    </Phase6Shell>
  );
}

const ORGS = [
  { name: 'NASM', detail: 'National Academy of Sports Medicine', on: true },
  { name: 'ACE', detail: 'American Council on Exercise', on: false },
  { name: 'ACSM', detail: 'American College of Sports Medicine', on: false },
  { name: 'NSCA', detail: 'National Strength and Conditioning Association', on: false },
];

export function CertificationScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Become a coach" />
      <Caption style={{ marginTop: 8 }}>Step 2 of 4</Caption>
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 4 }}>
        Your certification
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        Pick the issuer and enter the credential number we should look up. We check it with that issuer’s tool.
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        [Company] reviews every application. We’ll email you when there’s an update.
      </Text>
      <GlassCard>
        <View style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
          {ORGS.map((o, i) => (
            <View
              key={o.name}
              style={{
                minHeight: 56,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 8,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="body">{o.name}</Text>
                <Text variant="label" color={colors.textMuted}>
                  {o.detail}
                </Text>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: o.on ? colors.accent : colors.borderStrong,
                  backgroundColor: o.on ? colors.accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {o.on ? <Ionicons name="checkmark" size={16} color={colors.accentText} /> : null}
              </View>
            </View>
          ))}
        </View>
      </GlassCard>
      <Field label="Credential number" value="NASM-1234567" />
      <PrimaryButton label="Continue" />
    </Phase6Shell>
  );
}

export function IdentityScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Become a coach" />
      <Caption style={{ marginTop: 8 }}>Step 3 of 4</Caption>
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 4 }}>
        Identity check
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        Stripe checks your identity before we can approve you. We keep the method and a result ID, never your ID images.
      </Text>
      <GlassCard>
        <View style={{ padding: 18, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Ionicons name="ribbon-outline" size={22} color={colors.accentInk} />
          <View style={{ flex: 1 }}>
            <Text variant="body">Stripe Identity</Text>
            <Text variant="small" color={colors.textMuted} style={{ marginTop: 2 }}>
              You’ll finish this in Stripe’s flow. [App] doesn’t see your ID photos.
            </Text>
          </View>
        </View>
      </GlassCard>
      <PrimaryButton label="Start identity check" />
      <EqualRow left="Not now" />
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10 }}>
        You can pause here and come back. Your application isn’t submitted until you agree to the Coach Terms.
      </Text>
    </Phase6Shell>
  );
}

export function CoachTermsScreen({ on = false, nudge = false }: { on?: boolean; nudge?: boolean }) {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3} hideTab>
      <BackRow title="Become a coach" />
      <Caption style={{ marginTop: 8 }}>Step 4 of 4</Caption>
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 4 }}>
        Coach Terms
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 6 }}>
        Read the terms, then agree only if you accept them. This box starts off.
      </Text>
      <GlassCard>
        <View style={{ padding: 16 }}>
          {TERMS_EXCERPT.map((p, i) => (
            <Text key={i} variant="small" style={{ marginTop: i ? 6 : 0 }}>
              {p}
            </Text>
          ))}
          <Text variant="small" color={colors.accentInk} style={{ marginTop: 10, fontWeight: '600' }}>
            Read the full Coach Terms
          </Text>
        </View>
      </GlassCard>
      <GlassCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 56 }}>
          <CheckRow label="" on={on} a11y="I agree to the Coach Terms" />
          <Text variant="body" style={{ flex: 1 }}>
            I agree to the Coach Terms
          </Text>
        </View>
      </GlassCard>
      {nudge ? (
        <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: colors.surfaceRaised }}>
          <Text variant="small">Agree to the Coach Terms to apply. The box starts off.</Text>
        </View>
      ) : null}
      <EqualRow left="Not now" right="Agree and apply" />
    </Phase6Shell>
  );
}

export function ApplyPendingScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3} lockedStudio>
      <Text variant="small" color={colors.textMuted}>
        Coach workspace
      </Text>
      <Text variant="title" accessibilityRole="header">
        Studio
      </Text>
      <EmptyState
        title="Application in review"
        body="Thanks, Alex. We’ll email you when there’s an update. Studio stays locked until you’re a verified coach."
        cta="Got it"
      />
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 10, paddingHorizontal: 4 }}>
        [Company] reviews every application.
      </Text>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Caption>Submitted</Caption>
          <Text variant="body" style={{ marginTop: 6 }}>
            NASM · identity check passed
          </Text>
          <Text variant="small" color={colors.textMuted} style={{ marginTop: 2 }}>
            Coach Terms agreed · Nov 17, 2026
          </Text>
        </View>
      </GlassCard>
    </Phase6Shell>
  );
}

export function ApplyApprovedScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <Text variant="small" color={colors.textMuted}>
        Welcome to Studio
      </Text>
      <Text variant="title" accessibilityRole="header">
        You’re verified
      </Text>
      <GlassCard style={{ borderRadius: 32 }}>
        <View style={{ padding: 20, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <Ionicons name="checkmark-circle" size={32} color={colors.accentInk} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">Certification verified</Text>
            <Text variant="small" color={colors.textMuted} style={{ marginTop: 2 }}>
              We checked your NASM credential with the issuer’s lookup tool, and your identity check passed. Verified isn’t a medical or dietetics license or a background check.
            </Text>
          </View>
        </View>
      </GlassCard>
      <PrimaryButton label="Open Studio" />
      <TextLink label="Set up work with 16–17 year olds" />
    </Phase6Shell>
  );
}

export function ApplyNeedInfoScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell athleteTab={3}>
      <BackRow title="Become a coach" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>
        We need a bit more
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        We couldn’t finish the certification lookup with the number you entered. Check the issuer and credential number, then resubmit. If you think this is a mistake, contact us from Profile › Support.
      </Text>
      <GlassCard>
        <View style={{ padding: 16 }}>
          <Text variant="label" color={colors.textMuted}>
            You submitted
          </Text>
          <Text variant="body" style={{ marginTop: 4 }}>
            NASM · NASM-1234567
          </Text>
        </View>
      </GlassCard>
      <PrimaryButton label="Edit and resubmit" />
      <EqualRow left="Not now" />
    </Phase6Shell>
  );
}

export function MinorsIntroScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>
        Work with 16–17 year olds
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        This is a separate approval. Until it’s done, 16–17 year olds can’t be your clients. Coaches never see a 16–17 year old’s body weight or other health info, and they have no progress photos.
      </Text>
      <InfoRows
        rows={[
          {
            icon: 'school-outline',
            title: 'Required reporting training',
            body: 'Complete [App]’s training on Texas abuse-reporting duties (Fam. Code 261.101) before you’re approved.',
          },
          {
            icon: 'shield-checkmark-outline',
            title: 'Registry search we run',
            body: 'We’ll search the national sex offender public registry (NSOPW) before approval and at least once a year after. You don’t run this search yourself, and we don’t show results in the app.',
          },
          {
            icon: 'information-circle-outline',
            title: 'What we don’t do',
            body: 'We don’t run criminal background checks. That’s a known limit of this process.',
          },
        ]}
      />
      <PrimaryButton label="Start training" />
      <EqualRow left="Not now" />
    </Phase6Shell>
  );
}

export function AbuseTrainingScreen() {
  const { colors } = useTheme();
  const mods = [
    { n: '1', title: 'What you must report', mins: '~8 min', state: 'done' as const },
    { n: '2', title: 'How to report in Texas', mins: '~10 min', state: 'part' as const },
    { n: '3', title: 'What [App] does next', mins: '~6 min', state: 'open' as const },
  ];
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Training" />
      <Caption style={{ marginTop: 8 }}>Reporting training</Caption>
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 4 }}>
        Texas reporting duties
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        Required before you’re approved to work with 16–17 year olds. This is general information, not legal advice. Finish every module, then attest.
      </Text>
      <GlassCard>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          {mods.map((m, i) => (
            <View
              key={m.n}
              style={{
                minHeight: 56,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 8,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.border,
              }}
            >
              <Text variant="heading" color={colors.accentInk} style={{ width: 24 }}>
                {m.n}
              </Text>
              <View style={{ flex: 1 }}>
                <Text variant="body">{m.title}</Text>
                <Text variant="label" color={colors.textMuted}>
                  {m.mins}
                </Text>
              </View>
              {m.state === 'done' ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.accentInk} />
              ) : (
                <Text variant="label" color={m.state === 'part' ? colors.accentInk : colors.textMuted} style={m.state === 'part' ? { fontWeight: '600' } : undefined}>
                  {m.state === 'part' ? 'In progress' : 'Not started'}
                </Text>
              )}
            </View>
          ))}
        </View>
      </GlassCard>
      <PrimaryButton label="Continue module 2" />
    </Phase6Shell>
  );
}

export function AbuseAttestScreen({ on = false }: { on?: boolean }) {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Training" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>
        Confirm your training
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        Turn this on only after you’ve finished every module. It starts off.
      </Text>
      <SwitchRow
        label="I completed [App]’s required reporting training for coaches who work with 16–17 year olds"
        on={on}
        a11y="I completed required reporting training"
      />
      <EqualRow left="Not now" right="Continue" />
      <Text variant="label" color={colors.textMuted} style={{ marginTop: 10 }}>
        Continue saves whatever the switch says. You can only be submitted for this approval if it’s on.
      </Text>
    </Phase6Shell>
  );
}

export function MinorsPendingScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>
        Approval in review
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        Thanks. We’ll email you when this approval is decided. Until then, 16–17 year olds can’t be your clients.
      </Text>
      <StatusList
        rows={[
          { label: 'Reporting training', value: 'Done' },
          { label: 'Registry search', value: 'In progress' },
        ]}
      />
      <PrimaryButton label="Back to Studio" />
    </Phase6Shell>
  );
}

export function MinorsApprovedScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>
        Approved for 16–17
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        You may take on 16–17 year old clients. Their parent is the contracting party. You never see their body weight or other health info, and they have no progress photos. Chat and live sessions have extra rules, designed in a later phase.
      </Text>
      <GlassCard>
        <View style={{ padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={22} color={colors.accentInk} />
          <Text variant="body">Minors approval is on</Text>
        </View>
      </GlassCard>
      <PrimaryButton label="Back to Studio" />
    </Phase6Shell>
  );
}

export function MinorsNotApprovedScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>
        Not approved for 16–17
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        You aren’t approved to work with 16–17 year olds, so you can’t start coaching them. If you think this is a mistake, contact us from Profile › Support. We don’t show search details in the app.
      </Text>
      <EqualRow left="Back to Studio" />
    </Phase6Shell>
  );
}

export function MinorsNameMatchScreen() {
  const { colors } = useTheme();
  return (
    <Phase6Shell tab={3}>
      <BackRow title="Studio" />
      <Text variant="title" accessibilityRole="header" style={{ marginTop: 8 }}>
        We need to confirm something
      </Text>
      <Text variant="small" color={colors.textMuted} style={{ marginTop: 8 }}>
        Before we can finish this approval, we need to confirm a detail with you. Check your email for next steps. Nothing has been decided yet.
      </Text>
      <PrimaryButton label="Back to Studio" />
    </Phase6Shell>
  );
}

// Keep Avatar imported usage if lint complains — used by later studio screens.
void Avatar;
