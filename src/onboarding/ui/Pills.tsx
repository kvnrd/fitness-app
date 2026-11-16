import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';

/** Outlined pill choice (Start from, division, focus areas, units). Selected = accent line + sunken accent wash. */
export function PillOption({ label, selected, onPress, check = false, flex = false, tall = false, sub }: { label: string; selected: boolean; onPress: () => void; check?: boolean; flex?: boolean; tall?: boolean; sub?: string }) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        {
          minHeight: tall ? 56 : 44,
          paddingHorizontal: 16,
          borderRadius: tall ? 14 : 999,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? colors.accentLine : colors.borderStrong,
          backgroundColor: selected ? colors.surfaceRaised : 'transparent',
          flexDirection: tall ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: tall ? 0 : 6,
        },
        flex && { flex: 1 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {selected && check ? <Ionicons name="checkmark" size={14} color={colors.accentInk} /> : null}
      <Text importantForAccessibility="no" color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 }}>
        {label}
      </Text>
      {sub ? (
        <Text importantForAccessibility="no" color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 18 }}>
          {sub}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Uppercase small caption above a control group. `right` sits on the same line. */
export function Caption({ children, right, accent = false }: { children: string; right?: ReactNode; accent?: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text accessibilityRole="header" color={accent ? colors.accentInk : colors.textMuted} style={{ fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.96, textTransform: 'uppercase' }}>
        {children}
      </Text>
      {right}
    </View>
  );
}
