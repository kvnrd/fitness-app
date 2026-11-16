import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { Markdown } from './Markdown';
import { ScreenBackground } from './ScreenAtmosphere';
import { Text } from './ui';

/**
 * Renders a bundled policy. Public text only (no user data), so these routes are reachable signed out and signed in.
 * [ATTORNEY] The text is a Counsel DRAFT: the header says so and shows the version + content hash that consents record.
 */
export function PolicyScreen({
  doc,
  note,
}: {
  doc: { version: string; sha256: string; body: string };
  /** Extra draft / pre-production line shown under the version (Terms v0.1-draft). */
  note?: string;
}) {
  const { colors, radius: r } = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <ScreenBackground>
      <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm, gap: space.sm }}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          style={({ pressed }) => [{ alignSelf: 'flex-start', paddingVertical: space.xs }, pressed && { opacity: 0.6 }]}
        >
          <Text variant="bodyStrong" color={colors.accentInk}>
            ‹ Back
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
          <View style={{ borderRadius: r.pill, borderWidth: 1, borderColor: colors.accentLine, backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text variant="label" color={colors.accentInk} style={{ textTransform: 'uppercase' }}>
              Draft
            </Text>
          </View>
          <Text variant="small" color={colors.textMuted}>
            {doc.version}
          </Text>
        </View>
        <Text variant="label" color={colors.textMuted} selectable>
          Content hash: {doc.sha256.slice(0, 12)}
        </Text>
        {note ? (
          <Text variant="small" color={colors.textSecondary}>
            {note}
          </Text>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: insets.bottom + space['4xl'], maxWidth: 640, width: '100%', alignSelf: 'center' }}
      >
        <Markdown source={doc.body} />
      </ScrollView>
    </ScreenBackground>
  );
}
