import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { AuthProviderButtons } from '../ui/AuthProviderButtons';
import { CodeBoxes } from '../ui/CodeBoxes';
import { TextField } from '../ui/Field';
import { OnbScreen } from '../ui/OnbScreen';
import { InlineLink, OnbSub, OnbTitle } from '../ui/OnbText';
import { PrimaryCta } from '../ui/PrimaryCta';
import { Wordmark } from '../ui/Wordmark';

/**
 * Screen 8: existing accounts. Same behaviour as before the restyle: email one-time code, Apple, Google.
 * (The Paper render also shows passkey and password rows; those methods do not exist in this app.)
 */
export function SignInScreen(p: {
  email: string;
  onEmail: (v: string) => void;
  code: string;
  onCode: (v: string) => void;
  codeSent: boolean;
  busy?: boolean;
  message?: string | null;
  notice?: string | null;
  showApple: boolean;
  showGoogle: boolean;
  onApple: () => void;
  onGoogle: () => void;
  onSendCode: () => void;
  onVerify: () => void;
  onUseDifferentEmail: () => void;
  onBack: () => void;
  onCreate: () => void;
  /** DEV ONLY: password sign-in for testing before SMTP. Rendered only when these are passed. */
}) {
  const { colors } = useTheme();
  return (
    <OnbScreen
      onBack={p.onBack}
      footer={
        <Text variant="small" color={colors.textSecondary} style={{ textAlign: 'center' }}>
          {'New here? '}
          <InlineLink onPress={p.onCreate}>Create account</InlineLink>
        </Text>
      }
    >
      <Wordmark />
      <View style={{ gap: 10 }}>
        <OnbTitle>Welcome back</OnbTitle>
        <OnbSub>{p.codeSent ? 'Enter the 6-digit code we emailed you.' : 'We’ll email you a 6-digit code. No password needed.'}</OnbSub>
      </View>
      {!p.codeSent ? (
        <>
          <TextField label="Email" placeholder="name@example.com" value={p.email} onChangeText={p.onEmail} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" textContentType="emailAddress" maxLength={254} />
          <PrimaryCta label="Email me a code" disabled={!p.email.trim()} busy={p.busy} onPress={p.onSendCode} />
        </>
      ) : (
        <>
          <CodeBoxes value={p.code} onChange={p.onCode} autoFocus />
          <PrimaryCta label="Verify" disabled={p.code.length !== 6} busy={p.busy} onPress={p.onVerify} />
          <Text variant="small" color={colors.textSecondary} style={{ textAlign: 'center' }}>
            <InlineLink onPress={p.onUseDifferentEmail}>Use a different email</InlineLink>
          </Text>
        </>
      )}
      {p.notice ? (
        <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {p.notice}
        </Text>
      ) : null}
      {p.message ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
          <Text variant="small" color={colors.danger} style={{ flex: 1 }}>
            {p.message}
          </Text>
        </View>
      ) : null}
      {p.showApple || p.showGoogle ? <AuthProviderButtons layout="row" showApple={p.showApple} showGoogle={p.showGoogle} onApple={p.onApple} onGoogle={p.onGoogle} disabled={p.busy} /> : null}
    </OnbScreen>
  );
}
