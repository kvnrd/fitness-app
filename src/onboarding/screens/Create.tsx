import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { TERMS_CHECKBOX_TEXT } from '../../legal/text';
import { useTheme } from '../../theme/ThemeProvider';
import { PASSWORD_MAX_LENGTH, passwordStrength } from '../password';
import { Checkbox } from '../ui/Checkbox';
import { TextField } from '../ui/Field';
import { FooterHint, OnbScreen } from '../ui/OnbScreen';
import { InlineLink, OnbSub, OnbTitle } from '../ui/OnbText';
import { PrimaryCta } from '../ui/PrimaryCta';
import { StepHeader } from '../ui/StepHeader';

export type CreateProps = {
  name: string;
  email: string;
  password: string;
  showPassword: boolean;
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
  onPassword: (v: string) => void;
  onToggleShow: () => void;
  onTerms: (v: boolean) => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
  onSubmit: () => void;
  onBack: () => void;
};

/**
 * Screen 6 (Account · Step 2 of 8). The ONLY checkbox is the Terms one, never pre-checked, no age clause.
 * Password: min 12 / max 128, strength is guidance only (no composition rules). Errors are generic.
 */
export function CreateScreen(p: CreateProps) {
  const { colors, fonts } = useTheme();
  const s = passwordStrength(p.password);
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
      <View style={{ gap: 10 }}>
        <TextField
          label="Password"
          placeholder="At least 12 characters"
          value={p.password}
          onChangeText={p.onPassword}
          secureTextEntry={!p.showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={PASSWORD_MAX_LENGTH}
          right={
            <Pressable onPress={p.onToggleShow} accessibilityRole="button" accessibilityLabel={p.showPassword ? 'Hide password' : 'Show password'} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={p.showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
              <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {p.showPassword ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          }
        />
        {p.password ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accessible accessibilityLabel={`Password strength: ${s.label || 'too short'}`}>
            <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= s.level ? colors.accentLine : colors.border }} />
              ))}
            </View>
            <Text variant="label" color={colors.accentInk} style={{ textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 48, textAlign: 'right' }}>
              {s.label}
            </Text>
          </View>
        ) : null}
        <View style={{ gap: 8 }}>
          <Guidance ok={s.meetsLength} text="At least 12 characters" />
          <Guidance ok={false} text="Tip: a few random words beats symbols" muted />
        </View>
      </View>
      <Checkbox checked={p.terms} onChange={p.onTerms} label={TERMS_CHECKBOX_TEXT}>
        <Text variant="small" color={colors.textSecondary} style={{ fontFamily: fonts.bodyMedium }}>
          {'I agree to the '}
          <InlineLink onPress={p.onOpenTerms}>Terms</InlineLink>
          {' and '}
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

function Guidance({ ok, text, muted }: { ok: boolean; text: string; muted?: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={[{ width: 18, height: 18, borderRadius: 9, marginTop: 1, alignItems: 'center', justifyContent: 'center' }, ok ? { backgroundColor: colors.accent } : { borderWidth: 1.5, borderColor: colors.borderStrong }]}>
        {ok ? <Ionicons name="checkmark" size={12} color={colors.accentText} /> : null}
      </View>
      <Text variant="small" color={ok ? colors.text : muted ? colors.textMuted : colors.textSecondary} style={{ flex: 1, fontFamily: fonts.bodyMedium }}>
        {text}
      </Text>
    </View>
  );
}
