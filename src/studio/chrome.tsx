import type { ReactNode } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground, screenScrollContentStyle } from '../components/ScreenAtmosphere';
import { Button, Text } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { minControlSize, space } from '../theme/tokens';

const noop = () => {};

export function Phase6Shell({
  children,
  tab,
  lockedStudio,
  hideTab,
  athleteTab,
  scroll = true,
}: {
  children: ReactNode;
  tab?: number;
  lockedStudio?: boolean;
  hideTab?: boolean;
  athleteTab?: number;
  scroll?: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const padBottom = hideTab ? Math.max(insets.bottom, 24) : 118;
  const body = (
    <View style={{ paddingTop: Math.max(insets.top, 12) + 8, paddingHorizontal: space.lg, paddingBottom: padBottom, flexGrow: 1 }}>
      {children}
    </View>
  );
  return (
    <ScreenBackground>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[screenScrollContentStyle(colors.bg), { flexGrow: 1 }]}
          scrollIndicatorInsets={{ bottom: 0 }}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, screenScrollContentStyle(colors.bg)]}>{body}</View>
      )}
      {hideTab ? null : athleteTab != null ? <AthleteTabBar on={athleteTab} /> : tab != null ? <CoachTabBar on={tab} locked={lockedStudio} /> : null}
    </ScreenBackground>
  );
}

export function BackRow({ title, rightLabel, right }: { title: string; rightLabel?: string; right?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: minControlSize }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        }}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </View>
      <Text variant="bodyStrong">{title}</Text>
      {right ?? (
        <View style={{ minWidth: 44, alignItems: 'flex-end' }}>
          {rightLabel ? (
            <Text variant="small" color={colors.accentInk} style={{ fontWeight: '600' }}>
              {rightLabel}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

export function GlassCard({ children, style }: { children?: ReactNode; style?: object }) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        {
          marginTop: space.md,
          borderRadius: 24,
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SettingsRow({
  icon,
  label,
  sub,
  first,
  accentChevron,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  first?: boolean;
  accentChevron?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {sub ? (
          <Text variant="label" color={colors.textMuted}>
            {sub}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={accentChevron ? colors.accentInk : colors.textMuted} />
    </View>
  );
}

export function PrimaryButton({ label, disabled, onPress = noop }: { label: string; disabled?: boolean; onPress?: () => void }) {
  return <Button label={label} disabled={disabled} onPress={onPress} style={{ marginTop: space.md }} />;
}

export function TextLink({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text variant="small" color={colors.accentInk} style={{ marginTop: 12, textAlign: 'center', fontWeight: '600' }}>
      {label}
    </Text>
  );
}

export function EqualRow({ left, right, danger, stacked }: { left: string; right?: string; danger?: boolean; stacked?: boolean }) {
  const { colors, radius } = useTheme();
  const btn = (label: string, isDanger?: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flex: stacked ? undefined : 1,
        minHeight: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: isDanger ? colors.danger : colors.text,
        paddingHorizontal: space.sm,
      }}
    >
      <Text variant="bodyStrong" color={isDanger ? colors.danger : colors.text}>
        {label}
      </Text>
    </Pressable>
  );
  if (!right) {
    return <View style={{ marginTop: 12 }}>{btn(left)}</View>;
  }
  return (
    <View style={{ marginTop: 12, flexDirection: stacked ? 'column' : 'row', gap: stacked ? 10 : 12 }}>{btn(left)}{btn(right, danger)}</View>
  );
}

export function SwitchRow({ label, hint, on, a11y }: { label: string; hint?: string; on: boolean; a11y: string }) {
  const { colors } = useTheme();
  return (
    <GlassCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <View style={{ flex: 1 }}>
          <Text variant="body">{label}</Text>
          {hint ? (
            <Text variant="label" color={colors.textMuted} style={{ marginTop: 2 }}>
              {hint}
            </Text>
          ) : null}
        </View>
        <Switch
          value={on}
          onValueChange={noop}
          accessibilityLabel={a11y}
          trackColor={{ false: colors.borderStrong, true: colors.accent }}
          thumbColor={on ? colors.accentText : colors.surfaceRaised}
        />
      </View>
    </GlassCard>
  );
}

export function CheckRow({ label, on, a11y }: { label: string; on: boolean; a11y: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, alignItems: 'flex-start' }}>
      <View
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on }}
        accessibilityLabel={a11y}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: on ? colors.accent : colors.borderStrong,
          backgroundColor: on ? colors.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        {on ? <Ionicons name="checkmark" size={16} color={colors.accentText} /> : null}
      </View>
      <Text variant="small" style={{ flex: 1 }}>
        {label}
      </Text>
    </View>
  );
}

export function StatusList({ rows }: { rows: { label: string; value: string }[] }) {
  const { colors } = useTheme();
  return (
    <GlassCard>
      <View style={{ padding: 16, gap: 10 }}>
        {rows.map((r) => (
          <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text variant="body" style={{ flex: 1 }}>
              {r.label}
            </Text>
            <Text variant="small" color={colors.textMuted}>
              {r.value}
            </Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

export function InfoRows({
  rows,
}: {
  rows: { icon?: keyof typeof Ionicons.glyphMap; title: string; body: string }[];
}) {
  const { colors } = useTheme();
  return (
    <GlassCard>
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        {rows.map((r, i) => (
          <View
            key={r.title}
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingVertical: 12,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: colors.border,
              alignItems: 'flex-start',
            }}
          >
            {r.icon ? <Ionicons name={r.icon} size={20} color={colors.accentInk} style={{ marginTop: 2 }} /> : null}
            <View style={{ flex: 1 }}>
              <Text variant="body">{r.title}</Text>
              <Text variant="small" color={colors.textMuted} style={{ marginTop: 2 }}>
                {r.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

export function EmptyState({ title, body, cta, alt }: { title: string; body: string; cta: string; alt?: string }) {
  const { colors } = useTheme();
  return (
    <GlassCard>
      <View style={{ paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.glass,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="people-outline" size={24} color={colors.accentInk} />
        </View>
        <Text variant="heading" style={{ marginTop: 14, textAlign: 'center' }}>
          {title}
        </Text>
        <Text variant="small" color={colors.textMuted} style={{ marginTop: 6, textAlign: 'center' }}>
          {body}
        </Text>
        <Button label={cta} style={{ marginTop: 16, alignSelf: 'stretch' }} />
        {alt ? (
          <Text variant="small" color={colors.accentInk} style={{ marginTop: 10, fontWeight: '600' }}>
            {alt}
          </Text>
        ) : null}
      </View>
    </GlassCard>
  );
}

export function Avatar({ initials, size = 44 }: { initials: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceRaised,
        borderWidth: 1.5,
        borderColor: colors.glassBorder,
      }}
    >
      <Text variant="small" style={{ fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}

export function Caption({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text variant="label" color={colors.textMuted} style={{ textTransform: 'uppercase', letterSpacing: 1.4 }}>
      {children}
    </Text>
  );
}

export function Field({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 14 }}>
      <Text variant="label" color={colors.textMuted} style={{ marginBottom: 6 }}>
        {label}
      </Text>
      <View
        style={{
          minHeight: 48,
          borderRadius: 16,
          paddingHorizontal: 14,
          justifyContent: 'center',
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        }}
      >
        <Text variant="body" color={value ? colors.text : colors.placeholder}>
          {value || placeholder || ''}
        </Text>
      </View>
    </View>
  );
}

const COACH_TABS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'home-outline', label: 'Home' },
  { icon: 'barbell-outline', label: 'Train' },
  { icon: 'trending-up-outline', label: 'Progress' },
  { icon: 'clipboard-outline', label: 'Studio' },
  { icon: 'person-outline', label: 'Profile' },
];

export function CoachTabBar({ on, locked }: { on: number; locked?: boolean }) {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 10), alignItems: 'center' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 64,
          borderRadius: 32,
          paddingHorizontal: 4,
          paddingVertical: 6,
          gap: 2,
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        }}
      >
        {COACH_TABS.map((t, i) => {
          const focused = i === on;
          const color = focused ? colors.tabOnText : colors.text;
          return (
            <View
              key={t.label}
              accessibilityLabel={t.label}
              style={{
                height: 52,
                minWidth: 48,
                paddingHorizontal: focused ? 12 : 8,
                borderRadius: 26,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: focused ? colors.tabOn : 'transparent',
              }}
            >
              <Ionicons name={t.icon} size={22} color={color} />
              {focused ? (
                <Text variant="small" color={color} style={{ fontWeight: '700' }}>
                  {t.label}
                </Text>
              ) : null}
              {locked && i === 3 && !focused ? <Ionicons name="lock-closed" size={14} color={colors.textMuted} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const ATHLETE_TABS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'home-outline', label: 'Home' },
  { icon: 'barbell-outline', label: 'Train' },
  { icon: 'trending-up-outline', label: 'Progress' },
  { icon: 'person-outline', label: 'Profile' },
];

export function AthleteTabBar({ on }: { on: number }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 10), alignItems: 'center' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 64,
          borderRadius: 32,
          paddingHorizontal: 4,
          paddingVertical: 6,
          gap: 2,
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        }}
      >
        {ATHLETE_TABS.map((t, i) => {
          const focused = i === on;
          const color = focused ? colors.tabOnText : colors.text;
          return (
            <View
              key={t.label}
              accessibilityLabel={t.label}
              style={{
                height: 52,
                minWidth: 56,
                paddingHorizontal: focused ? 12 : 8,
                borderRadius: 26,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: focused ? colors.tabOn : 'transparent',
              }}
            >
              <Ionicons name={t.icon} size={22} color={color} />
              {focused ? (
                <Text variant="small" color={color} style={{ fontWeight: '700' }}>
                  {t.label}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function Banner({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 16,
        padding: 12,
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.danger,
      }}
    >
      <Text variant="small" color={colors.danger}>
        {text}
      </Text>
    </View>
  );
}

export { noop };
