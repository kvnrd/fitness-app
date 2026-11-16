import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getStoreAgeSignal } from '../age/storeAgeSignal';
import { useAgeGate } from '../auth/AgeGateProvider';
import { finishSignup, SignupResult } from '../auth/onboarding';
import { useSession } from '../auth/SessionProvider';
import { Text } from '../components/ui';
import { DateParts, toIsoDate } from '../onboarding/dob';
import { DobScreen } from '../onboarding/screens/Dob';
import { OnbScreen } from '../onboarding/ui/OnbScreen';
import { OnbSub, OnbTitle } from '../onboarding/ui/OnbText';
import { PrimaryCta } from '../onboarding/ui/PrimaryCta';
import { SecondaryButton } from '../onboarding/ui/SecondaryButton';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Signed in but not (yet) a complete account. Mounted by the root gate when there is no profile, or when a
 * profile exists but my_onboarding_state() failed (fails closed: never the app).
 *
 * - Normal path: the DOB answer is already in memory (Method → DOB), so complete_signup runs automatically
 *   (terms + privacy versions/hashes, display name, store bounds); for 16-17 create_parent_invite follows with
 *   the parent email from memory; then DOB + parent email are dropped from memory.
 * - "I already have an account" with Apple/Google but no profile, or an app restart mid-flow: no DOB in
 *   memory, so the same neutral date entry is shown here.
 * - Ineligible answer: the server deleted the auth user; device flag + sign out (Phase 2b behaviour).
 */
export default function OnboardingRoute() {
  const { profile, refreshRole, signOut } = useSession();
  const age = useAgeGate();
  const { colors } = useTheme();
  const [dob, setDob] = useState<DateParts>({ year: '', month: '', day: '' });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  async function run(birthDateIso: string, store: Awaited<ReturnType<typeof getStoreAgeSignal>>) {
    setBusy(true);
    setFailed(false);
    const r: SignupResult = await finishSignup({ birthDateIso, displayName: age.signupName, store, parentEmail: age.parentEmail });
    if (r.ok) {
      age.clearSignupMemory(); // the date of birth and the parent email are no longer needed anywhere
      await refreshRole(); // loads profile + onboarding state; the root gate then moves on
    } else if (r.kind === 'ineligible') {
      await age.markIneligible();
      await signOut();
    } else {
      setFailed(true);
    }
    setBusy(false);
  }

  const pending = age.getPending();
  useEffect(() => {
    if (profile || !pending || started.current) return;
    started.current = true;
    void run(pending.birthDateIso, pending.store);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, pending]);

  // A profile exists but its onboarding state could not be read: fail closed with a retry.
  if (profile) {
    return (
      <OnbScreen centerContent>
        <OnbTitle>We couldn’t load your account</OnbTitle>
        <OnbSub>Check your connection and try again.</OnbSub>
        <PrimaryCta label="Try again" busy={busy} onPress={async () => { setBusy(true); await refreshRole(); setBusy(false); }} />
        <SecondaryButton label="Sign out" onPress={() => void signOut()} />
      </OnbScreen>
    );
  }

  if (!pending) {
    const iso = toIsoDate(dob);
    return (
      <DobScreen
        value={dob}
        onChange={setDob}
        valid={!!iso}
        busy={busy}
        message={failed ? 'Something went wrong. Please try again.' : null}
        onContinue={async () => {
          if (!iso || busy) return;
          await run(iso, await getStoreAgeSignal());
        }}
      />
    );
  }

  return (
    <OnbScreen centerContent>
      {failed ? (
        <>
          <OnbTitle>Something went wrong</OnbTitle>
          <OnbSub>We couldn’t finish setting up your account. Please try again.</OnbSub>
          <PrimaryCta label="Try again" busy={busy} onPress={() => void run(pending.birthDateIso, pending.store)} />
          <SecondaryButton label="Sign out" onPress={() => void signOut()} />
        </>
      ) : (
        <View style={{ gap: 16, alignItems: 'flex-start' }} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.accentInk} />
          <Text>Setting up your account…</Text>
        </View>
      )}
    </OnbScreen>
  );
}
