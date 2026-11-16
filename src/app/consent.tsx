import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConsentKind, CONSENT_KINDS, ConsentState, listActiveMinors, loadConsents, NO_CONSENTS, setConsent } from '../auth/consents';
import { useSession } from '../auth/SessionProvider';
import { Button, Chip, Text } from '../components/ui';
import { AI_TEXT_PARENT, AI_TEXT_TEEN, AI_TEXT_VERSION_B, HEALTH_TEXT, VERSIONS } from '../legal/text';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';

/**
 * Consents. THREE separate opt-ins, each off by default, no "accept all", Continue works with all off
 * (Counsel Q6). Text next to each switch is Counsel's draft wording (src/legal/text.ts).
 *
 * Who sees what:
 *   adult, own choices      -> adult text; own switch decides.
 *   16-17, own choices      -> teen text; switch LOCKED until the parent has turned the same scope on
 *                              (Counsel Q2). Either can turn it off.
 *   parent acting for teen  -> parent text; parent's own switch for that teen.
 *
 * Coach sharing still shows a placeholder: Counsel's wording names the coach and lists the health items
 * the user picks, and neither the coach name (RLS) nor a per-item picker exists yet.
 */
type Audience = 'adult' | 'teen' | 'parent';
type Copy = { text: string; version: string } | null;

function copyFor(kind: ConsentKind, who: Audience): Copy {
  if (kind === 'health_data') return { text: HEALTH_TEXT, version: VERSIONS.health };
  if (kind === 'ai_vendor') {
    if (who === 'teen') return { text: AI_TEXT_TEEN, version: VERSIONS.aiTeen };
    if (who === 'parent') return { text: AI_TEXT_PARENT, version: VERSIONS.aiParent };
    return { text: AI_TEXT_VERSION_B, version: VERSIONS.aiB };
  }
  return null; // coach_sharing: wording not usable yet (see above)
}

const COACH_PLACEHOLDER = { title: 'Sharing with my coach', detail: 'Placeholder label.' };

function splitTitle(text: string): { title: string; rest: string } {
  const i = text.indexOf('. ');
  return i < 0 ? { title: text, rest: '' } : { title: text.slice(0, i + 1), rest: text.slice(i + 2) };
}

export default function ConsentScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useSession();
  const [minors, setMinors] = useState<string[]>([]);
  const [target, setTarget] = useState<string | null>(null); // null = myself
  const [state, setState] = useState<ConsentState>(NO_CONSENTS);
  const [loaded, setLoaded] = useState(false);
  const [busyKind, setBusyKind] = useState<ConsentKind | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const subject = target ?? user?.id ?? null;
  const who: Audience = target ? 'parent' : profile?.is_minor ? 'teen' : 'adult';

  const reload = useCallback(async () => {
    if (!subject) return;
    const r = await loadConsents(subject);
    // Fail to "not granted" on error: never show a switch as on unless the server said so.
    setState(r.ok ? r.state : NO_CONSENTS);
    setLoaded(r.ok);
    if (!r.ok) setMessage("We couldn't load your choices. Please try again.");
  }, [subject]);

  useEffect(() => {
    if (!user || profile?.is_minor) return;
    void listActiveMinors(user.id).then(setMinors);
  }, [user, profile?.is_minor]);

  useEffect(() => {
    setLoaded(false);
    setState(NO_CONSENTS);
    void reload();
  }, [reload]);

  async function toggle(kind: ConsentKind, next: boolean) {
    const copy = copyFor(kind, who);
    if (busyKind || !loaded) return;
    setBusyKind(kind);
    setMessage(null);
    const r = await setConsent(kind, next, {
      forUser: target ?? undefined,
      version: copy?.version ?? VERSIONS.coachPlaceholder,
      shownText: copy?.text ?? `${COACH_PLACEHOLDER.title} ${COACH_PLACEHOLDER.detail}`,
    });
    if (r === 'parent_required') setMessage('Your parent must turn this on first.');
    else if (r === 'error') setMessage("We couldn't save that choice. Please try again.");
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
            <Chip key={id} label={`Linked teen ${i + 1}`} active={target === id} onPress={() => setTarget(id)} />
          ))}
        </View>
      ) : null}

      {CONSENT_KINDS.map((kind) => {
        const copy = copyFor(kind, who);
        const { title, rest } = copy ? splitTitle(copy.text) : { title: COACH_PLACEHOLDER.title, rest: COACH_PLACEHOLDER.detail };
        const pair = state[kind];
        const value = who === 'parent' ? pair.parent : pair.self;
        const locked = who === 'teen' && !pair.parent && !pair.self; // teen can always turn OFF
        return (
          <View key={kind} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
            <View style={{ flex: 1, gap: space.xs }}>
              <Text variant="bodyStrong">{title}</Text>
              {rest ? (
                <Text variant="small" color={colors.textMuted}>
                  {rest}
                </Text>
              ) : null}
              {who === 'teen' ? (
                <Text variant="small" color={colors.textSecondary}>
                  {pair.parent ? (pair.self ? 'On (you and your parent agreed).' : 'Your parent agreed. Turn on to agree too.') : 'Locked until your parent agrees.'}
                </Text>
              ) : null}
            </View>
            <Switch
              value={value}
              disabled={!loaded || busyKind !== null || locked}
              onValueChange={(v) => void toggle(kind, v)}
              accessibilityLabel={title}
            />
          </View>
        );
      })}

      {message ? (
        <Text variant="small" color={colors.danger} accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}

      <Button label="Continue" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </ScrollView>
  );
}
