import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** Round 40px button with a back chevron. */
export function BackButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
      style={({ pressed }) => [
        { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name="chevron-back" size={20} color={colors.text} />
    </Pressable>
  );
}
