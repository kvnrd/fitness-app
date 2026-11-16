import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { CodeBoxes } from '../ui/CodeBoxes';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { InlineLink, OnbTitle } from '../ui/OnbText';
import { PrimaryCta } from '../ui/PrimaryCta';
import { SecondaryButton } from '../ui/SecondaryButton';
import { StepHeader } from '../ui/StepHeader';

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Screen 7 (Account · Step 3 of 8). "Wrong email? Change" returns to Create, never to the date of birth. */
export function VerifyScreen(p: {
  email: string;
  code: string;
  onCode: (v: string) => void;
  onVerify: () => void;
  /** Seconds until the next resend is allowed; 0 = allowed. */
  resendIn: number;
  onResend: () => void;
  onChangeEmail: () => void;
  onBack: () => void;
  onOpenMail?: () => void;
  busy?: boolean;
  message?: string | null;
}) {
  const { colors, fonts } = useTheme();
  const full = p.code.length === 6;
  return (
    <OnbScreen
      onBack={p.onBack}
      footer={
        <>
          <PrimaryCta label="Verify" disabled={!full} busy={p.busy} onPress={p.onVerify} />
          {!full ? <FooterHint>Paste works too · we’ll verify as soon as all 6 digits are in</FooterHint> : null}
        </>
      }
      contentGap={28}
    >
      <StepHeader eyebrow="Account" current={3} />
      <View style={{ width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } }}>
        <Ionicons name="mail-outline" size={32} color={colors.accentInk} />
      </View>
      <View style={{ gap: 10 }}>
        <OnbTitle>Check your email</OnbTitle>
        <Text color={colors.textSecondary}>
          {'If an account can be created, we sent a 6-digit code to '}
          <Text color={colors.text} style={{ fontFamily: fonts.bodyBold }}>
            {p.email}
          </Text>
          {'. It expires in 10 minutes.'}
        </Text>
      </View>
      <CodeBoxes value={p.code} onChange={p.onCode} autoFocus />
      {p.message ? (
        <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {p.message}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {p.resendIn > 0 ? (
          <Text variant="small" color={colors.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
            {'Resend code in '}
            <Text variant="small" style={{ fontFamily: fonts.bodyBold }}>
              {mmss(p.resendIn)}
            </Text>
          </Text>
        ) : (
          <Text variant="small">
            <InlineLink onPress={p.onResend}>Resend code</InlineLink>
          </Text>
        )}
        <Text variant="small" color={colors.textSecondary}>
          {'Wrong email? '}
          <InlineLink onPress={p.onChangeEmail}>Change</InlineLink>
        </Text>
      </View>
      {p.onOpenMail ? <SecondaryButton label="Open mail app" onPress={p.onOpenMail} icon={<Ionicons name="mail-outline" size={18} color={colors.text} />} /> : null}
    </OnbScreen>
  );
}
