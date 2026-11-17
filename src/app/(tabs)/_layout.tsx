import { Ionicons } from '@expo/vector-icons';
import { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { useSession } from '../../auth/SessionProvider';
import { AuroraTabBar, type TabBarProps } from '../../components/AuroraTabBar';
import { useTheme } from '../../theme/ThemeProvider';

type IconName = keyof typeof Ionicons.glyphMap;

const icon =
  (name: IconName, active: IconName) =>
  ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? active : name} color={color as string} size={size - 2} />
  );

export default function TabsLayout() {
  const { colors, fonts, family } = useTheme();
  const { isVerifiedCoach } = useSession();
  const aurora = family === 'aurora';
  return (
    <Tabs
      tabBar={aurora ? (props) => <AuroraTabBar {...(props as unknown as TabBarProps)} /> : undefined}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: colors.accentInk,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: aurora
          ? { display: 'none' }
          : {
              backgroundColor: colors.bg,
              borderTopColor: colors.border,
              height: 84,
              paddingTop: 8,
            },
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.bodyMedium },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="train" options={{ title: 'Train', tabBarIcon: icon('barbell-outline', 'barbell') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('stats-chart-outline', 'stats-chart') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }} />
      <Tabs.Screen
        name="studio"
        options={{
          href: aurora || !isVerifiedCoach ? null : undefined,
          title: 'Studio',
          tabBarIcon: icon('create-outline', 'create'),
        }}
      />
    </Tabs>
  );
}
