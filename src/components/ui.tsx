import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text as RNText, TextProps, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius, space, TypeVariant } from '../theme/tokens';

export function Text({
  variant = 'body',
  color,
  style,
  ...rest
}: TextProps & { variant?: TypeVariant; color?: string }) {
  const { type, colors } = useTheme();
  return <RNText {...rest} style={[type[variant], { color: color ?? colors.text }, style]} />;
}

/** The one primary action on a screen: accent pill. Secondary actions are outlined. */
export function Button({
  label,
  variant = 'primary',
  icon,
  style,
  disabled,
  ...rest
}: PressableProps & { label: string; variant?: 'primary' | 'secondary'; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        styles.button,
        primary && !disabled ? { backgroundColor: colors.accent } : { borderWidth: 1, borderColor: colors.borderStrong },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon}
      <Text variant="bodyStrong" color={disabled ? colors.textMuted : primary ? colors.accentText : colors.text}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: active }}
      style={[styles.chip, { borderColor: colors.border }, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}
    >
      <Text variant="small" color={active ? colors.accentText : colors.textSecondary} style={{ fontFamily: fonts.bodyMedium }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Thin horizontal progress: accent over border. */
export function ProgressBar({ ratio, style }: { ratio: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const r = Math.min(1, Math.max(0, ratio));
  return (
    <View
      style={[styles.track, { backgroundColor: colors.border }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(r * 100) }}
    >
      <View style={[styles.fill, { width: `${r * 100}%`, backgroundColor: colors.accentLine }]} />
    </View>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="title">{title}</Text>
      {right}
    </View>
  );
}

export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }, style]} />;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.xs,
  },
  chip: {
    paddingHorizontal: space.sm,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  track: { height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.sm },
});
