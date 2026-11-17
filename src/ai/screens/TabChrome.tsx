import { ReactNode } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AiNotice } from '../../components/AiNotice';
import { Text } from '../../components/ui';
import { useTheme } from '../../theme/ThemeProvider';

export type TabId = 'home' | 'train' | 'progress' | 'profile';

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'home', label: 'Home', icon: 'home-outline', active: 'home' },
  { id: 'train', label: 'Train', icon: 'barbell-outline', active: 'barbell' },
  { id: 'progress', label: 'Progress', icon: 'stats-chart-outline', active: 'stats-chart' },
  { id: 'profile', label: 'Profile', icon: 'person-outline', active: 'person' },
];

/**
 * Preview / in-screen 4-tab bar (Home · Train · Progress · Profile).
 * The compact plan-notice footer sits above the tabs after the first session. [ATTORNEY]
 */
export function TabChrome({
  active,
  notice,
  children,
}: {
  active: TabId;
  notice?: 'banner' | 'footer' | null;
  children: ReactNode;
}) {
  const { colors, fonts, resolvedScheme } = useTheme();
  const bg = resolvedScheme === 'dark' ? 'rgba(12,12,14,0.84)' : 'rgba(247,247,248,0.88)';
  return (
    <View>
      <View style={{ paddingBottom: notice === 'footer' ? 168 : 118 }}>{children}</View>
      <View>
        {notice === 'footer' ? (
          <View style={{ backgroundColor: bg, borderTopWidth: 1, borderTopColor: colors.border }}>
            <AiNotice variant="footer" />
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 16, paddingTop: 4 }}>
              {TABS.map((t) => {
                const on = t.id === active;
                return (
                  <View key={t.id} style={{ flex: 1, alignItems: 'center', gap: 4, paddingTop: 10 }}>
                    {on ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: -1,
                          width: 28,
                          height: 3,
                          borderBottomLeftRadius: 3,
                          borderBottomRightRadius: 3,
                          backgroundColor: colors.accentLine,
                        }}
                      />
                    ) : null}
                    <Ionicons name={on ? t.active : t.icon} size={22} color={on ? colors.accentInk : colors.textMuted} />
                    <Text
                      color={on ? colors.accentInk : colors.textMuted}
                      style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}
                    >
                      {t.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: bg, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 16, paddingTop: 4 }}>
            {TABS.map((t) => {
              const on = t.id === active;
              return (
                <View key={t.id} style={{ flex: 1, alignItems: 'center', gap: 4, paddingTop: 10 }}>
                  <Ionicons name={on ? t.active : t.icon} size={22} color={on ? colors.accentInk : colors.textMuted} />
                  <Text
                    color={on ? colors.accentInk : colors.textMuted}
                    style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}
                  >
                    {t.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
