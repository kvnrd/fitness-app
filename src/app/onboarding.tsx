import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { completeSignup, toIsoDate } from '../auth/onboarding';
import { useSession } from '../auth/SessionProvider';
import { Button, Text } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';

const INELIGIBLE_NOTICE = "Sorry, you can't use this app.";

/**
 * Age gate, shown when Supabase is configured, the user is signed in and has no profile yet.
 *
 * COPY: plain information, not legal advice. Wording is a draft for Counsel to review.
 * The age is computed ONLY on the server (complete_signup). The client never shows or stores it.
 */
export default function OnboardingScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshRole, signOut, setNotice } = useSession();
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const iso = toIsoDate({ year, month, day });

  async function submit() {
    if (!iso || busy) return;
    setBusy(true);
    setMessage(null);
    const r = await completeSignup(iso, name);
    if (r.ok) {
      await refreshRole(); // loads profile + onboarded; the root gate then moves us on
      setBusy(false);
      return;
    }
    if (r.kind === 'ineligible') {
      // under_13_not_permitted / under_minimum_age: generic message, no age, no reason, sign out.
      // The server keeps no profile in either case.
      // NOTE: signing out is NOT enough for under-13. The Auth user (and its email) still exists, and
      // the client cannot delete it. The server must then call public.close_under_13_account(user).
      // complete_signup's raise rolls the transaction back, so the DB itself has no record to trigger
      // on: this needs an Edge Function in front of the RPC. See docs/phase-2-backend.md.
      setNotice(INELIGIBLE_NOTICE);
      setBusy(false);
      await signOut();
      return;
    }
    setBusy(false);
    setMessage('Something went wrong. Please check your details and try again.');
  }

  const field = {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    textAlign: 'center',
  } as const;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: space.xl, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, gap: space.md }}
      >
        <Text variant="title">Before you start</Text>
        <Text color={colors.textMuted}>
          We ask for your date of birth to check that you can use this app. It is used for that check and for deciding whether a parent or guardian must be involved.
        </Text>

        <View style={{ gap: space.xs }}>
          <Text variant="small" color={colors.textMuted}>
            • You must be at least 16 to use this app.
          </Text>
          <Text variant="small" color={colors.textMuted}>
            • People under 13 cannot create an account (US children's privacy law, COPPA).
          </Text>
          <Text variant="small" color={colors.textMuted}>
            • If you are 16 or 17 you are a minor. A parent or guardian must be the contracting party before your account is fully active.
          </Text>
        </View>

        <Text variant="bodyStrong">Date of birth</Text>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <TextInput
            value={year}
            onChangeText={(v) => setYear(v.replace(/\D/g, '').slice(0, 4))}
            placeholder="YYYY"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            autoComplete="off"
            style={[field, { flex: 2 }]}
            accessibilityLabel="Birth year"
          />
          <TextInput
            value={month}
            onChangeText={(v) => setMonth(v.replace(/\D/g, '').slice(0, 2))}
            placeholder="MM"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
            autoComplete="off"
            style={[field, { flex: 1 }]}
            accessibilityLabel="Birth month"
          />
          <TextInput
            value={day}
            onChangeText={(v) => setDay(v.replace(/\D/g, '').slice(0, 2))}
            placeholder="DD"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
            autoComplete="off"
            style={[field, { flex: 1 }]}
            accessibilityLabel="Birth day"
          />
        </View>

        <Text variant="bodyStrong">Display name (optional)</Text>
        <TextInput
          value={name}
          onChangeText={(v) => setName(v.slice(0, 80))}
          placeholder="What should we call you?"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          style={[field, { textAlign: 'left' }]}
          accessibilityLabel="Display name, optional"
        />

        {message ? (
          <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
            {message}
          </Text>
        ) : null}

        <Button label="Continue" disabled={busy || !iso} onPress={submit} />
        <Button label="Sign out" variant="secondary" disabled={busy} onPress={() => void signOut()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
