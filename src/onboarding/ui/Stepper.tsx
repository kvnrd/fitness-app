import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';

function Round({ sign, onPress, label, size }: { sign: '−' | '+'; onPress: () => void; label: string; size: number }) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong }, pressed && { opacity: 0.7 }]}
    >
      <Text importantForAccessibility="no" color={colors.text} style={{ fontFamily: fonts.bodyBold, fontSize: size > 30 ? 22 : 18, lineHeight: size > 30 ? 24 : 20 }}>
        {sign}
      </Text>
    </Pressable>
  );
}

/** − value unit +. `big` = the 52px weight-goal field; default = compact row stepper (max weights). */
export function Stepper({ value, unit, onMinus, onPlus, label, big = false }: { value: string; unit: string; onMinus: () => void; onPlus: () => void; label: string; big?: boolean }) {
  const { colors, fonts } = useTheme();
  const size = big ? 30 : 28;
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`${label}, ${value} ${unit}`}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'increment' ? onPlus() : onMinus())}
      style={{ flexDirection: 'row', alignItems: 'center', gap: big ? 8 : 8 }}
    >
      <Round sign="−" onPress={onMinus} label={`Decrease ${label}`} size={size} />
      <Text numberOfLines={1} color={colors.text} style={{ fontFamily: big ? fonts.displayHeavy : fonts.bodyBold, fontSize: big ? 32 : 16, lineHeight: big ? 38 : 22, minWidth: big ? 0 : 52, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
        {value}
        <Text color={colors.textSecondary} style={{ fontFamily: fonts.bodySemi, fontSize: big ? 16 : 14 }}>{` ${unit}`}</Text>
      </Text>
      <Round sign="+" onPress={onPlus} label={`Increase ${label}`} size={size} />
    </View>
  );
}
