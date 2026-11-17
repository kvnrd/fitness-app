import { router } from 'expo-router';
import { Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ScreenAtmosphere';
import { useSession } from '../../auth/SessionProvider';
import { DataExportSheet } from '../../progress/screens/DataExportSheet';
import { requestDataExport } from '../../settings/dataExport.ts';
import { PRIVACY_DOWNLOAD_LABEL, PRIVACY_RIGHTS_PLACEHOLDER_NOTE } from '../../legal/text.ts';
import { space } from '../../theme/tokens';

export default function DataExportRoute() {
  const insets = useSafeAreaInsets();
  const { profile, onboarding } = useSession();
  const isMinor = profile?.is_minor === true || onboarding?.is_minor === true;
  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingHorizontal: 24, paddingBottom: 48 }}>
        <DataExportSheet
          isMinor={isMinor}
          hasConnectedApps={false}
          hasCoach={false}
          photoCount={0}
          hasHealthInfo={false}
          onBack={() => router.back()}
          onSave={() => {
            void requestDataExport().then((ok) =>
              Alert.alert(PRIVACY_DOWNLOAD_LABEL, ok ? 'We recorded your download request. The export packer is not built yet.' : PRIVACY_RIGHTS_PLACEHOLDER_NOTE),
            );
          }}
        />
      </ScrollView>
    </ScreenBackground>
  );
}
