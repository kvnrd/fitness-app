import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

/** "ACCOUNT · STEP n OF 8" eyebrow under a segmented progress bar (filled segments use the accent line). */
export function StepHeader({ eyebrow, current, total = 8 }: { eyebrow: string; current: number; total?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{ gap: 8 }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${eyebrow}, step ${current} of ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current }}
    >
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              { flex: 1, height: 4, borderRadius: 2 },
              i < current
                ? { backgroundColor: colors.accentLine, shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }
                : { backgroundColor: colors.border },
            ]}
          />
        ))}
      </View>
      <Text variant="label" color={colors.textMuted} style={{ textTransform: 'uppercase', letterSpacing: 0.96 }} importantForAccessibility="no">
        {`${eyebrow} · Step ${current} of ${total}`}
      </Text>
    </View>
  );
}
