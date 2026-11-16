import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/ui';
import { REJECTION_NOTICE } from '../legal/text';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';

/** Counsel's generic rejection notice. No age, no threshold, no retry option, no buttons. */
export default function NotEligibleScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: space.xl, paddingTop: insets.top + space.xl, backgroundColor: colors.bg }}>
      <Text accessibilityLiveRegion="polite">{REJECTION_NOTICE}</Text>
    </View>
  );
}
