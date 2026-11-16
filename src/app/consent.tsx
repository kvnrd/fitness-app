import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConsentKind, CONSENT_KINDS, ConsentState, listActiveMinors, loadConsents, NO_CONSENTS, setConsent } from '../auth/consents';
import { useSession } from '../auth/SessionProvider';
import { Button, Chip, Text } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';

/**
 * Consent stub. THREE separate opt-ins, each off by default, no "accept all".
 * None is required to continue: the server still refuses health writes and coach sharing without consent.
 *
 * COUNSEL: the labels below are placeholders, not policy text. Counsel must supply the real wording
 * and the policy version (see POLICY_VERSION in src/auth/consents.ts) before release.
 */
const LABELS: Record<ConsentKind, { title: string; detail: string }> = {
  health_data: { title: 'Health data processing', detail: 'Placeholder label.' },
  ai_vendor: { title: 'Sharing with our AI vendor', detail: 'Placeholder label.' },
  coach_sharing: { title: 'Sharing with my coach', detail: 'Placeholder label.' },
};

export default function ConsentScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const [minors, setMinors] = useState<string[]>([]);
  const [target, setTarget] = useState<string | null>(null); // null = myself
  const [state, setState] = useState<ConsentState>(NO_CONSENTS);
  const [loaded, setLoaded] = useState(false);
  const [busyKind, setBusyKind] = useState<ConsentKind | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const subject = target ?? user?.id ?? null;

  const reload = useCallback(async () => {
    if (!subject) return;
    const r = await loadConsents(subject);
    // Fail to "not granted" on error: never show a switch as on unless the server said so.
    setState(r.ok ? r.state : NO_CONSENTS);
    setLoaded(r.ok);
    if (!r.ok) setMessage("We couldn't load your choices. Please try again.");
  }, [subject]);

  useEffect(() => {
    if (!user) return;
    void listActiveMinors(user.id).then(setMinors);
  }, [user]);

  useEffect(() => {
    setLoaded(false);
    setState(NO_CONSENTS);
    void reload();
  }, [reload]);

  async function toggle(kind: ConsentKind, next: boolean) {
    if (busyKind || !loaded) return;
    setBusyKind(kind);
    setMessage(null);
    const ok = await setConsent(kind, next, target ?? undefined);
    if (!ok) setMessage("We couldn't save that choice. Please try again.");
    await reload(); // the server state is the truth; the switch shows what it says
    setBusyKind(null);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, gap: space.md }} style={{ backgroundColor: colors.bg }}>
      <Text variant="title">Your choices</Text>
      <Text color={colors.textMuted}>
        Each choice is separate and off until you turn it on. You can change any of them later. You can continue without turning any on.
      </Text>

      {minors.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <Chip label="Myself" active={target === null} onPress={() => setTarget(null)} />
          {minors.map((id, i) => (
            <Chip key={id} label={`Linked minor ${i + 1}`} active={target === id} onPress={() => setTarget(id)} />
          ))}
        </View>
      ) : null}

      {CONSENT_KINDS.map((kind) => (
        <View key={kind} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{LABELS[kind].title}</Text>
            <Text variant="small" color={colors.textMuted}>
              {LABELS[kind].detail}
            </Text>
          </View>
          <Switch
            value={state[kind]}
            disabled={!loaded || busyKind !== null}
            onValueChange={(v) => void toggle(kind, v)}
            accessibilityLabel={LABELS[kind].title}
          />
        </View>
      ))}

      {message ? (
        <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}

      <Button label="Continue" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </ScrollView>
  );
}
