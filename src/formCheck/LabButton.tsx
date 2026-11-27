import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/ui';
import { radius, space } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';

/**
 * DEV ONLY floating shortcut to the form check lab, rendered by the root layout only when
 * formCheckLabEnabled(). Needed because iOS hands `fitnessapp://` links to Apple's Fitness app,
 * which claims the same scheme. Developer label, not product copy.
 */
export function FormCheckLabButton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open form check lab"
      onPress={() => router.push('/dev-form-check')}
      hitSlop={8}
      style={({ pressed }) => [
        styles.pill,
        { top: insets.top + space[2], backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text variant="small" color={colors.accentText}>Lab</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    right: space[3],
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
