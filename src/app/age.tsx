import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { getStoreAgeSignal } from '../age/storeAgeSignal';
import { screenAge } from '../auth/ageGate';
import { useAgeGate } from '../auth/AgeGateProvider';
import { DateParts, toIsoDate } from '../onboarding/dob';
import { useProceedAfterDob } from '../onboarding/flow';
import { DobScreen } from '../onboarding/screens/Dob';

/**
 * Account · Step 1 of 8: date of birth BEFORE any email or OAuth sheet (Counsel C6 + Q3). Neutral.
 * Nothing is stored on the server; on "not eligible" the device gets a flag with no personal data.
 * The DOB is locked after submit: this route is left with `replace` and redirects away if an answer exists.
 */
export default function AgeRoute() {
  const { getPending, setPending, markIneligible, method } = useAgeGate();
  const proceed = useProceedAfterDob();
  const [dob, setDob] = useState<DateParts>({ year: '', month: '', day: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const iso = toIsoDate(dob);

  // Only decided on mount: submitting sets the pending answer and must not bounce this screen mid-navigation.
  const [locked] = useState(() => !!getPending());
  if (locked) return <Redirect href="/method" />;

  async function submit() {
    if (!iso || busy) return;
    setBusy(true);
    setMessage(null);
    const store = await getStoreAgeSignal();
    const r = await screenAge({ birthDateIso: iso, store });
    if (r.kind === 'ineligible') {
      await markIneligible(); // the root gate swaps to the not-eligible screen
      return;
    }
    if (r.kind === 'retry') {
      setBusy(false);
      setMessage('Something went wrong. Please try again.');
      return;
    }
    setPending({ birthDateIso: iso, store, band: r.band });
    const err = await proceed(r.band, method ?? 'email', 'replace');
    setBusy(false);
    if (err !== null) {
      // OAuth failed or was cancelled. The DOB stays locked, so go back to Method (which proceeds directly).
      router.replace('/method');
    }
  }

  return <DobScreen value={dob} onChange={setDob} valid={!!iso} busy={busy} message={message} onContinue={submit} onBack={() => (router.canGoBack() ? router.back() : router.replace('/method'))} />;
}
