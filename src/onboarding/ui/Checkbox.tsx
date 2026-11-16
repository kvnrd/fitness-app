import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** 22px checkbox with a label slot (labels may contain links). Never pre-checked by the screens that use it. */
export function Checkbox({ checked, onChange, children, label }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        hitSlop={10}
        style={[
          { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
          checked ? { backgroundColor: colors.accent } : { borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSunken },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={16} color={colors.accentText} /> : null}
      </Pressable>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
