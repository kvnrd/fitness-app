import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './ui';

const ICONS: Record<string, { off: keyof typeof Ionicons.glyphMap; on: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { off: 'home-outline', on: 'home', label: 'Home' },
  train: { off: 'barbell-outline', on: 'barbell', label: 'Train' },
  progress: { off: 'stats-chart-outline', on: 'stats-chart', label: 'Progress' },
  profile: { off: 'person-outline', on: 'person', label: 'Profile' },
};

export type TabBarProps = {
  state: { index: number; routes: { key: string; name: string; params?: object }[] };
  descriptors: Record<string, { options: { href?: string | null | undefined } & Record<string, unknown> }>;
  navigation?: { emit: (e: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean }; navigate: (name: string, params?: object) => void };
  navigateToTab?: (routeKey: string) => void;
  insets?: { bottom: number };
};

/** Floating glass 4-tab bar. Studio is coach-only and is not a root tab on Aurora. */
export function AuroraTabBar({ state, descriptors, navigation, navigateToTab }: TabBarProps) {
  const { colors, radius, fonts, minControlSize } = useTheme();
  const insets = useSafeAreaInsets();
  const tabs = state.routes.filter((route) => {
    if (route.name === 'studio') return false;
    const href = descriptors[route.key]?.options?.href;
    return href !== null;
  });

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
            borderRadius: radius.tab,
            minHeight: 64,
          },
        ]}
      >
        {tabs.map((route) => {
          const focused = state.routes[state.index]?.key === route.key;
          const meta = ICONS[route.name] ?? { off: 'ellipse-outline' as const, on: 'ellipse' as const, label: route.name };
          const color = focused ? colors.tabOnText : colors.textSecondary;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={() => {
                if (navigateToTab) {
                  navigateToTab(route.key);
                  return;
                }
                const event = navigation?.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event?.defaultPrevented) navigation?.navigate(route.name, route.params);
              }}
              style={[
                styles.item,
                { minWidth: minControlSize, minHeight: minControlSize, height: 52, borderRadius: 26 },
                focused && { backgroundColor: colors.tabOn },
              ]}
            >
              <Ionicons name={focused ? meta.on : meta.off} size={20} color={color} />
              <Text style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color }}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const AURORA_TAB_BAR_RESERVE = 64 + 12;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
    gap: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});

