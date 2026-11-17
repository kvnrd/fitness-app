import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { PhotoOptInSheet } from '../../progress/screens/PhotoOptInSheet';
import { space } from '../../theme/tokens';

export default function PhotoOptInRoute() {
  const insets = useSafeAreaInsets();
  const [on, setOn] = useState(false);
  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48 }}>
        <PhotoOptInSheet
          switchOn={on}
          onSwitchChange={setOn}
          onNotNow={() => router.back()}
          onContinue={() => router.replace('/photos/add')}
        />
      </ScrollView>
    </ScreenBackground>
  );
}
