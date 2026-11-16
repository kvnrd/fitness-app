import { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** Minimal horizontal slider (0-100, step 5): drag or tap, via the responder props (no dependency, no refs). Accessible as an adjustable. */
export function Slider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const set = (x: number) => {
    if (w <= 0) return;
    onChange(Math.round(Math.max(0, Math.min(100, (x / w) * 100)) / 5) * 5);
  };
  const x = (value / 100) * w;
  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => set(e.nativeEvent.locationX)}
      onResponderMove={(e) => set(e.nativeEvent.locationX)}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.max(0, Math.min(100, value + (e.nativeEvent.actionName === 'increment' ? 5 : -5))))}
      style={{ height: 32, justifyContent: 'center', flex: 1 }}
    >
      <View pointerEvents="none" style={{ height: 4, borderRadius: 2, backgroundColor: colors.border }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: Math.max(0, x - 12), width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.accentLine, shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
    </View>
  );
}
