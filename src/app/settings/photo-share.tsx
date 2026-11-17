import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { CoachShareSheet } from '../../progress/screens/CoachShareSheet';
import { space } from '../../theme/tokens';

export default function PhotoShareRoute() {
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48 }}>
        <CoachShareSheet
          coachFirst="Alex"
          onNotNow={() => router.back()}
          onContinue={() => router.back()}
        />
      </ScrollView>
    </ScreenBackground>
  );
}
