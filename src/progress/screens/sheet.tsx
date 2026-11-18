import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';
import { minControlSize, space } from '../../theme/tokens';
import { PHOTO_LIBRARY_LINE } from '../phase5bCopy.ts';

export function SheetCard({ children }: { children: ReactNode }) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surfaceRaised ?? colors.surface,
        borderColor: colors.glassBorder ?? colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.hero ?? 24,
        padding: 20,
        gap: 16,
      }}
    >
      {children}
    </View>
  );
}

export function EqualActions({
  left,
  right,
  onLeft,
  onRight,
  leftA11y,
  rightA11y,
  equal,
}: {
  left: string;
  right: string;
  onLeft: () => void;
  onRight: () => void;
  leftA11y?: string;
  rightA11y?: string;
  /** Export sheet: both actions are identical outlines. */
  equal?: boolean;
}) {
  const { colors, fonts, radius } = useTheme();
  const btn = (label: string, onPress: () => void, a11y: string, primary: boolean) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={{
        flex: 1,
        minHeight: minControlSize,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.input ?? 12,
        borderWidth: 1,
        borderColor: !equal && primary ? colors.accent : colors.borderStrong,
        backgroundColor: !equal && primary ? colors.accent : 'transparent',
        paddingHorizontal: space.sm,
      }}
    >
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: !equal && primary ? colors.accentText : colors.text }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {btn(left, onLeft, leftA11y ?? left, false)}
      {btn(right, onRight, rightA11y ?? right, true)}
    </View>
  );
}

export function CopyBlock({ label, body }: { label: string; body: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Text color={colors.text} style={{ fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 }}>
        {label}
      </Text>
      <Text color={colors.textSecondary} style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22 }}>
        {body}
      </Text>
    </View>
  );
}

export function LibraryLine() {
  const { colors, fonts } = useTheme();
  return (
    <Text color={colors.textMuted} style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18 }}>
      {PHOTO_LIBRARY_LINE}
    </Text>
  );
}
