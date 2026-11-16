import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { acceptLink, isUuid, listPendingLinks, PendingLink, requestLinkByParentId } from '../auth/parentLinks';
import { useSession } from '../auth/SessionProvider';
import { Button, Text } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space } from '../theme/tokens';

/**
 * Parent / guardian stub.
 * - Minor, not yet onboarded: explains the requirement. The email invite is NOT sent (no account lookup
 *   from the client: that would be an account oracle). A dev-only UUID path exercises link_parent.
 * - Any signed-in adult can also see requests waiting for them here and accept one.
 * Plain information, not legal text. Wording is a draft for Counsel.
 */
export default function ParentLinkScreen() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile, isOnboarded, refreshRole, signOut } = useSession();
  const isBlockedMinor = !!profile?.is_minor && !isOnboarded;
  const [email, setEmail] = useState('');
  const [emailNote, setEmailNote] = useState<string | null>(null);
  const [parentId, setParentId] = useState('');
  const [links, setLinks] = useState<PendingLink[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) return;
    const l = await listPendingLinks(user.id);
    if (l) setLinks(l);
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const field = {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
  } as const;

  async function onRequestByUuid() {
    if (!user || busy) return;
    setBusy(true);
    setMessage(null);
    const ok = await requestLinkByParentId(user.id, parentId);
    setBusy(false);
    if (ok) {
      setParentId('');
      setMessage('Request sent. Ask your parent or guardian to open this screen and accept it.');
      await reload();
    } else {
      setMessage("We couldn't create that request. Check the code and try again.");
    }
  }

  async function onAccept(id: string) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const ok = await acceptLink(id);
    setBusy(false);
    setMessage(ok ? 'Accepted.' : "We couldn't accept that request. Please try again.");
    await reload();
    await refreshRole();
  }

  async function onCheckAgain() {
    setBusy(true);
    await Promise.all([reload(), refreshRole()]); // when the link is active the root gate moves on
    setBusy(false);
  }

  const incoming = links.filter((l) => l.direction === 'incoming');
  const outgoing = links.filter((l) => l.direction === 'outgoing');

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, gap: space.md }}
      >
        {isBlockedMinor ? (
          <>
            <Text variant="title">A parent or guardian is needed</Text>
            <Text color={colors.textMuted}>
              Because you are 16 or 17, a parent or guardian must be the contracting party for your account. Your account becomes fully active once they have linked to it.
            </Text>

            <Text variant="bodyStrong">Parent or guardian email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="parent@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={field}
              accessibilityLabel="Parent or guardian email"
            />
            <Button
              label="Send invite"
              variant="secondary"
              disabled={!email.trim()}
              onPress={() => {
                // Stub: nothing is sent, looked up, or stored. The email never leaves this component.
                setEmail('');
                setEmailNote('Invites are not available yet. Nothing was sent and nothing was saved.');
              }}
            />
            {emailNote ? (
              <Text variant="small" color={colors.textMuted} accessibilityLiveRegion="polite">
                {emailNote}
              </Text>
            ) : null}

            {outgoing.length > 0 ? (
              <Text variant="small" color={colors.textMuted}>
                {`You have ${outgoing.length} request${outgoing.length === 1 ? '' : 's'} waiting for a parent or guardian to accept.`}
              </Text>
            ) : null}

            {__DEV__ ? (
              <View style={{ gap: space.sm }}>
                <Text variant="bodyStrong">Test path (development builds only)</Text>
                <Text variant="small" color={colors.textMuted}>
                  Paste the account code (user id) of an existing adult account to request a link.
                </Text>
                <TextInput
                  value={parentId}
                  onChangeText={setParentId}
                  placeholder="00000000-0000-0000-0000-000000000000"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={field}
                  accessibilityLabel="Parent account code"
                />
                <Button label="Request link" variant="secondary" disabled={busy || !isUuid(parentId)} onPress={onRequestByUuid} />
              </View>
            ) : null}
          </>
        ) : (
          <>
            <Text variant="title">Link requests</Text>
            <Text color={colors.textMuted}>Requests from a 16 or 17 year old asking you to be their parent or guardian appear here.</Text>
          </>
        )}

        {incoming.length > 0 ? (
          <View style={{ gap: space.sm }}>
            <Text variant="bodyStrong">Waiting for you</Text>
            {incoming.map((l) => (
              <View key={l.id} style={{ gap: space.xs }}>
                <Text variant="small" color={colors.textMuted}>
                  {`Request received ${new Date(l.created_at).toLocaleDateString()}`}
                </Text>
                <Button label="Accept" disabled={busy} onPress={() => onAccept(l.id)} />
              </View>
            ))}
          </View>
        ) : !isBlockedMinor ? (
          <Text variant="small" color={colors.textMuted}>
            Nothing is waiting for you.
          </Text>
        ) : null}

        {message ? (
          <Text variant="small" color={colors.textMuted} accessibilityLiveRegion="polite">
            {message}
          </Text>
        ) : null}

        {isBlockedMinor ? (
          <>
            <Button label="Check again" disabled={busy} onPress={onCheckAgain} />
            <Button label="Sign out" variant="secondary" disabled={busy} onPress={() => void signOut()} />
          </>
        ) : (
          <Button label="Done" variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
