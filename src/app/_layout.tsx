import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStoreProvider } from '../state/AppStore';
import { colors } from '../theme/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}
          />
        </View>
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}
