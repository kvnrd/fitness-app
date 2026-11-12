import { Ionicons } from '@expo/vector-icons';
import { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

const icon =
  (name: IconName, active: IconName) =>
  ({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons name={focused ? active : name} color={color as string} size={size - 2} />
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSunken,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Train', tabBarIcon: icon('barbell-outline', 'barbell') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('stats-chart-outline', 'stats-chart') }} />
      <Tabs.Screen name="studio" options={{ title: 'Coach Studio', tabBarIcon: icon('create-outline', 'create') }} />
    </Tabs>
  );
}
