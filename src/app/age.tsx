import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStoreAgeSignal } from '../age/storeAgeSignal';
import { screenAge } from '../auth/ageGate';
import { useAgeGate } from '../auth/AgeGateProvider';
import { DateParts, toIsoDate } from '../auth/onboarding';
import { Button, Text } from '../components/ui';
import { DobFields } from '../components/DobFields';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';

/**
 * First screen for a signed-out device (Counsel C6 + Q3): date of birth BEFORE any email or account.
 * Neutral: no default date, no minimum age, no thresholds, no hint of which answer works.
 * Nothing is stored on the server; on "not eligible" the device gets a flag with no personal data.
 */
export default function AgeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { setPending, setExistingAccount, markIneligible } = useAgeGate();
  const [dob, setDob] = useState<DateParts>({ year: '', month: '', day: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const iso = toIsoDate(dob);

  async function submit() {
    if (!iso || busy) return;
    setBusy(true);
    setMessage(null);
    const store = await getStoreAgeSignal();
    const pending = { birthDateIso: iso, store };
    const r = await screenAge(pending);
    setBusy(false);
    if (r === 'eligible') setPending(pending); // the root gate moves on to sign-in
    else if (r === 'ineligible') await markIneligible();
    else setMessage('Something went wrong. Please try again.');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: space.xl, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, gap: space.md }}
      >
        <Text variant="title">Date of birth</Text>
        <Text color={colors.textMuted}>Enter your date of birth to get started.</Text>
        <DobFields value={dob} onChange={setDob} />
        {message ? (
          <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
            {message}
          </Text>
        ) : null}
        <Button label="Continue" disabled={busy || !iso} onPress={submit} />
        <Button label="I already have an account" variant="secondary" disabled={busy} onPress={() => setExistingAccount(true)} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
