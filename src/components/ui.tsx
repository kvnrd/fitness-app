import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text as RNText, TextProps, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, space, type, TypeVariant } from '../theme/tokens';

export function Text({
  variant = 'body',
  color = colors.text,
  style,
  ...rest
}: TextProps & { variant?: TypeVariant; color?: string }) {
  return <RNText {...rest} style={[type[variant], { color }, style]} />;
}

export function Card({ children, style, raised }: { children: ReactNode; style?: StyleProp<ViewStyle>; raised?: boolean }) {
  return <View style={[styles.card, raised && styles.cardRaised, style]}>{children}</View>;
}

export function Button({
  label,
  variant = 'primary',
  icon,
  style,
  ...rest
}: PressableProps & { label: string; variant?: 'primary' | 'secondary' | 'ghost'; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const bg = variant === 'primary' ? colors.accent : variant === 'secondary' ? colors.surfaceRaised : 'transparent';
  const fg = variant === 'primary' ? colors.accentText : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {icon}
      <Text variant="bodyStrong" color={fg}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
    >
      <Text variant="small" color={active ? colors.accent : colors.textSecondary} style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ProgressRing({
  size = 44,
  stroke = 4,
  ratio,
  children,
}: {
  size?: number;
  stroke?: number;
  ratio: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, ratio)))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionLabel}>
      <Text variant="label" color={colors.textMuted}>
        {children}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
  },
  cardRaised: { backgroundColor: colors.surfaceRaised },
  button: {
    minHeight: 52,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
});
