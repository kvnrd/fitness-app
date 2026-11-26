import { View } from 'react-native';
import { Text } from '../../components/ui';
import { TERMS_CHECKBOX_TEXT } from '../../legal/text';
import { useTheme } from '../../theme/ThemeProvider';
import { Checkbox } from '../ui/Checkbox';
import { TextField } from '../ui/Field';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { InlineLink, OnbSub, OnbTitle } from '../ui/OnbText';
import { PrimaryCta } from '../ui/PrimaryCta';
import { StepHeader } from '../ui/StepHeader';

export type CreateProps = {
  name: string;
  email: string;
  terms: boolean;
  emailError?: string | null;
  /** Why the CTA is off, shown under it. Empty when ready. */
  hint: string;
  ready: boolean;
  busy?: boolean;
  message?: string | null;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onEmailBlur?: () => void;
  onTerms: (v: boolean) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onSubmit: () => void;
  onBack: () => void;
};

/**
 * Screen 6 (Account · Step 2 of 8). The ONLY checkbox is the Terms one, never pre-checked, no age clause.
 * No password (codes only, Kevin 2026-11-26): Verify takes the emailed 6-digit code. Errors are generic.
 */
export function CreateScreen(p: CreateProps) {
  const { colors, fonts } = useTheme();
  return (
    <OnbScreen
      onBack={p.onBack}
      footer={
        <>
          <PrimaryCta label="Create account" disabled={!p.ready} busy={p.busy} onPress={p.onSubmit} />
          {p.hint ? <FooterHint>{p.hint}</FooterHint> : null}
        </>
      }
    >
      <StepHeader eyebrow="Account" current={2} />
      <View style={{ gap: 10 }}>
        <OnbTitle>Create account</OnbTitle>
        <OnbSub>Use the email your coach invited, if you have one.</OnbSub>
      </View>
      <TextField label="Name" placeholder="What should we call you?" value={p.name} onChangeText={(v) => p.onName(v.slice(0, 80))} autoCapitalize="words" autoComplete="name" textContentType="name" maxLength={80} />
      <TextField
        label="Email"
        placeholder="name@example.com"
        value={p.email}
        onChangeText={p.onEmail}
        onBlur={p.onEmailBlur}
        error={p.emailError}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        maxLength={254}
      />
      <Checkbox checked={p.terms} onChange={p.onTerms} label={TERMS_CHECKBOX_TEXT}>
        <Text variant="small" color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium }}>
          {'I agree to the '}
          <InlineLink onPress={p.onOpenTerms}>Terms of Service</InlineLink>
          {", and I've read the "}
          <InlineLink onPress={p.onOpenPrivacy}>Privacy Policy</InlineLink>
          {'.'}
        </Text>
      </Checkbox>
      {p.message ? (
        <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {p.message}
        </Text>
      ) : null}
    </OnbScreen>
  );
}

