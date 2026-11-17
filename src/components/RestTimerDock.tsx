import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { space } from '../theme/tokens';
import { HeroNumeral } from './HeroNumeral';
import { Button, Text } from './ui';

export type RestTimerState = {
  remaining: number;
  total: number;
  nextLabel: string;
};

function fmt(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** Glass rest-timer sheet. Digits are the only gradient on this dock. */
export function RestTimerDock({
  rest,
  onAdjust,
  onSkip,
  finishLabel,
  onFinish,
}: {
  rest: RestTimerState;
  onAdjust: (delta: number) => void;
  onSkip: () => void;
  finishLabel: string;
  onFinish: () => void;
}) {
  const { colors, radius, minControlSize, fonts } = useTheme();
  const size = 156;
  const R = 72;
  const C = 2 * Math.PI * R;
  const ratio = rest.total > 0 ? Math.min(1, Math.max(0, rest.remaining / rest.total)) : 0;

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
          borderRadius: radius.sheet,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
            <Circle cx={78} cy={78} r={R} fill="none" stroke={colors.track} strokeWidth={10} />
            <Circle
              cx={78}
              cy={78}
              r={R}
              fill="none"
              stroke={colors.accent}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${C * ratio} 999`}
              rotation={-90}
              origin="78, 78"
            />
          </Svg>
          <View style={styles.center}>
            <HeroNumeral variant="stamp">{fmt(rest.remaining)}</HeroNumeral>
            <Text variant="label" color={colors.textSecondary}>
              of {fmt(rest.total)}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Text variant="bodyStrong">Rest · {rest.nextLabel}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Minus 15 seconds"
              onPress={() => onAdjust(-15)}
              style={[styles.ctrl, { minHeight: minControlSize, backgroundColor: colors.glass, borderColor: colors.glassBorder, borderRadius: 22 }]}
            >
              <Text variant="small" style={{ fontFamily: fonts.bodySemi }}>
                −15s
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Plus 15 seconds"
              onPress={() => onAdjust(15)}
              style={[styles.ctrl, { minHeight: minControlSize, backgroundColor: colors.glass, borderColor: colors.glassBorder, borderRadius: 22 }]}
            >
              <Text variant="small" style={{ fontFamily: fonts.bodySemi }}>
                +15s
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip rest"
            onPress={onSkip}
            style={[
              styles.ctrl,
              { minHeight: minControlSize, backgroundColor: colors.tabOn, borderRadius: 22, borderWidth: 0 },
            ]}
          >
            <Text variant="small" color={colors.tabOnText} style={{ fontFamily: fonts.bodySemi }}>
              Skip rest
            </Text>
          </Pressable>
        </View>
      </View>
      <Button label={finishLabel} onPress={onFinish} style={{ minHeight: 52 }} />
    </View>
  );
}

export function EmptySetsFooter({ done, total }: { done: number; total: number }) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.empty,
        { backgroundColor: colors.glass, borderColor: colors.glassBorder, borderRadius: radius.tab },
      ]}
    >
      <View style={styles.emptyRow}>
        <Text variant="bodyStrong">
          {done} of {total} sets
        </Text>
        <Text variant="label" color={colors.textSecondary}>
          Check off a set to start rest
        </Text>
      </View>
      <View style={[styles.slim, { backgroundColor: colors.track }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    zIndex: 5,
  },
  row: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  ctrl: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.sm,
  },
  empty: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    height: 64,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 5,
    justifyContent: 'center',
  },
  emptyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slim: { height: 4, borderRadius: 2, marginTop: 8 },
});
