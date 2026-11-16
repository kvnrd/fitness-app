import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  googleClientIds,
  isAppleSignInAvailable,
  isGoogleConfigured,
  requestEmailCode,
  signInWithApple,
  signInWithGoogleIdToken,
  verifyEmailCode,
} from '../auth/signIn';
import { useAgeGate } from '../auth/AgeGateProvider';
import { useSession } from '../auth/SessionProvider';
import { Button, Text } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { isConfigured, isSignedIn, notice, setNotice } = useSession();
  const { hasPending, setPending, setExistingAccount } = useAgeGate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [appleOk, setAppleOk] = useState(false);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAppleOk);
  }, []);

  // Signed in (or nothing to sign in to): leave. The root gate also handles this.
  useEffect(() => {
    if (isSignedIn || !isConfigured) router.replace('/');
  }, [isSignedIn, isConfigured]);

  async function run(fn: () => Promise<{ ok: boolean; message?: string }>, onOk?: () => void) {
    setBusy(true);
    setMessage(null);
    setNotice(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) onOk?.();
    else if (r.message) setMessage(r.message);
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
  } as const;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: space.xl, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, gap: space.md }}
      >
        <Text variant="title">Sign in</Text>
        <Text color={colors.textMuted}>
          {codeSent ? 'Enter the 6-digit code we emailed you.' : 'We will email you a 6-digit code. No password needed.'}
        </Text>

        {!codeSent ? (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              style={inputStyle}
              accessibilityLabel="Email"
            />
            <Button
              label="Email me a code"
              disabled={busy || !email.trim()}
              onPress={() => run(() => requestEmailCode(email, hasPending), () => setCodeSent(true))}
            />
            <Button
              label="Back"
              variant="secondary"
              disabled={busy}
              onPress={() => {
                setPending(null); // drop the in-memory date of birth
                setExistingAccount(false);
              }}
            />
          </>
        ) : (
          <>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={6}
              style={[inputStyle, { letterSpacing: 6, textAlign: 'center' }]}
              accessibilityLabel="6-digit code"
            />
            <Button label="Verify" disabled={busy || code.length !== 6} onPress={() => run(() => verifyEmailCode(email, code))} />
            <Button
              label="Use a different email"
              variant="secondary"
              disabled={busy}
              onPress={() => {
                setCodeSent(false);
                setCode('');
                setMessage(null);
              }}
            />
          </>
        )}

        {notice ? (
          <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
            {notice}
          </Text>
        ) : null}
        {message ? (
          <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
            {message}
          </Text>
        ) : null}

        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: space.xs }} />

        {appleOk ? (
          <Button
            label="Continue with Apple"
            variant="secondary"
            icon={<Ionicons name="logo-apple" size={18} color={colors.text} />}
            disabled={busy}
            onPress={() => run(signInWithApple)}
          />
        ) : null}

        {isGoogleConfigured ? (
          <GoogleButton busy={busy} run={run} />
        ) : Platform.OS === 'ios' ? (
          <Text variant="small" color={colors.textMuted}>
            Google sign-in is not configured.
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Separate component: the Google auth hook throws without client IDs, so it only mounts when configured. */
function GoogleButton({ busy, run }: { busy: boolean; run: (fn: () => Promise<{ ok: boolean; message?: string }>) => Promise<void> }) {
  const { colors } = useTheme();
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: googleClientIds.web,
    iosClientId: googleClientIds.ios,
  });
  return (
    <Button
      label="Continue with Google"
      variant="secondary"
      icon={<Ionicons name="logo-google" size={18} color={colors.text} />}
      disabled={busy || !request}
      onPress={() =>
        run(async () => {
          const res = await promptAsync();
          if (res.type !== 'success') return { ok: false, message: res.type === 'error' ? 'Could not sign in. Please try again.' : '' };
          const idToken = res.params?.id_token;
          if (!idToken) return { ok: false, message: 'Could not sign in. Please try again.' };
          return signInWithGoogleIdToken(idToken, request?.nonce);
        })
      }
    />
  );
}
