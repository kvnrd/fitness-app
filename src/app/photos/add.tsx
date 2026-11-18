import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { AddPhotosChooser } from '../../progress/screens/AddPhotosChooser';
import { space } from '../../theme/tokens';

export default function AddPhotosRoute() {
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48 }}>
        <AddPhotosChooser
          onTakePhoto={() => router.back()}
          onChooseFromLibrary={() => router.replace('/photos/import-consent')}
          onCancel={() => router.back()}
        />
      </ScrollView>
    </ScreenBackground>
  );
}
