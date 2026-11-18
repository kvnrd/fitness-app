import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { ImportConsentSheet } from '../../progress/screens/ImportConsentSheet';
import { space } from '../../theme/tokens';

export default function ImportConsentRoute() {
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48 }}>
        <ImportConsentSheet onAgree={() => router.back()} onCancel={() => router.back()} />
      </ScrollView>
    </ScreenBackground>
  );
}
