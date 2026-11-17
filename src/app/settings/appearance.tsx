import { router } from 'expo-router';
import { AppearanceSettingsScreen } from '../../settings/screens/AppearanceSettings';

export default function AppearanceSettingsRoute() {
  return <AppearanceSettingsScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />;
}
