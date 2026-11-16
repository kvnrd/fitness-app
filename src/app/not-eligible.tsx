import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/ui';
import { NOT_ELIGIBLE_BODY, NOT_ELIGIBLE_TITLE } from '../legal/text';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';

/** Counsel's generic not-eligible notice. No age, no threshold, no retry option, no buttons. [ATTORNEY] */
export default function NotEligibleScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: space.md, padding: space.xl, paddingTop: insets.top + space.xl, backgroundColor: colors.bg }}>
      <Text variant="title" accessibilityRole="header" accessibilityLiveRegion="polite">
        {NOT_ELIGIBLE_TITLE}
      </Text>
      <Text color={colors.textSecondary}>{NOT_ELIGIBLE_BODY}</Text>
    </View>
  );
}
