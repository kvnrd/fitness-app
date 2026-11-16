import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStoreAgeSignal } from '../age/storeAgeSignal';
import { useAgeGate } from '../auth/AgeGateProvider';
import { completeSignup, DateParts, toIsoDate } from '../auth/onboarding';
import { useSession } from '../auth/SessionProvider';
import { Button, Text } from '../components/ui';
import { DobFields } from '../components/DobFields';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';

/**
 * Signed in, no profile yet. Normally the date of birth was already taken on the neutral age screen
 * before sign-in (held in memory), so this only asks for an optional display name. If the app was
 * restarted in between, or the person used "I already have an account" with Apple/Google and has no
 * profile, the same neutral date field is shown here.
 *
 * The server decides eligibility. Not eligible: the server deletes this auth user and its email in the
 * same request, the device gets the no-personal-data flag, and only the generic notice is shown.
 */
export default function OnboardingScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshRole, signOut } = useSession();
  const { getPending, setPending, markIneligible } = useAgeGate();
  const pending = getPending();
  const [dob, setDob] = useState<DateParts>({ year: '', month: '', day: '' });
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const iso = pending?.birthDateIso ?? toIsoDate(dob);

  async function submit() {
    if (!iso || busy) return;
    setBusy(true);
    setMessage(null);
    const store = pending ? pending.store : await getStoreAgeSignal();
    const r = await completeSignup(iso, name, store);
    if (r.ok) {
      setPending(null); // the date of birth is no longer needed anywhere
      await refreshRole(); // loads profile + onboarded; the root gate then moves us on
      setBusy(false);
      return;
    }
    if (r.kind === 'ineligible') {
      await markIneligible();
      await signOut();
      setBusy(false);
      return;
    }
    setBusy(false);
    setMessage('Something went wrong. Please check your details and try again.');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: space.xl, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, gap: space.md }}
      >
        <Text variant="title">Before you start</Text>

        {pending ? null : (
          <>
            <Text variant="bodyStrong">Date of birth</Text>
            <DobFields value={dob} onChange={setDob} />
          </>
        )}

        <Text variant="bodyStrong">Display name (optional)</Text>
        <TextInput
          value={name}
          onChangeText={(v) => setName(v.slice(0, 80))}
          placeholder="What should we call you?"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          style={{
            borderWidth: 1,
            borderColor: colors.borderStrong,
            borderRadius: radius.input,
            paddingHorizontal: space.md,
            paddingVertical: space.sm,
            color: colors.text,
            fontFamily: fonts.body,
            fontSize: 16,
          }}
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
