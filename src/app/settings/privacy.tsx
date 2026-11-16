import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { loadConsents } from '../../auth/consents';
import { useSession } from '../../auth/SessionProvider';
import {
  PRIVACY_COACHING_LABEL,
  PRIVACY_DELETE_ACCOUNT_LABEL,
  PRIVACY_DELETE_HEALTH_LABEL,
  PRIVACY_DOWNLOAD_LABEL,
  PRIVACY_RIGHTS_PLACEHOLDER_NOTE,
  PRIVACY_RIGHTS_ROW_LABEL,
} from '../../legal/text';
import { requestDataExport } from '../../settings/dataExport';
import { PrivacySettingsScreen } from '../../settings/screens/PrivacySettings';

const placeholder = (title: string) => Alert.alert(title, PRIVACY_RIGHTS_PLACEHOLDER_NOTE);

export default function PrivacySettingsRoute() {
  const { user, onboarding } = useSession();
  const [healthOn, setHealthOn] = useState(false);
  const [aiOn, setAiOn] = useState(false);
  const [coachOn, setCoachOn] = useState(false);

  useEffect(() => {
    if (!user) return;
    void loadConsents(user.id).then((r) => {
      if (!r.ok) return;
      setHealthOn(r.state.health_data.self || r.state.health_data.parent);
      setAiOn(r.state.ai_vendor.self || r.state.ai_vendor.parent);
      setCoachOn(r.state.coach_sharing.self || r.state.coach_sharing.parent);
    });
  }, [user]);

  return (
    <PrivacySettingsScreen
      healthOn={healthOn}
      aiOn={aiOn}
      coachOn={coachOn}
      reaskDue={!!onboarding?.health_reask_due}
      onBack={() => router.back()}
      onManageChoices={() => router.push('/consent')}
      onReask={() => router.push('/settings/health-reask')}
      onPrivacyPolicy={() => router.push('/legal/privacy')}
      onHealthPolicy={() => router.push('/legal/health-privacy')}
      onTerms={() => router.push('/legal/terms')}
      onRights={() => placeholder(PRIVACY_RIGHTS_ROW_LABEL)}
      onExport={() => {
        void requestDataExport().then((ok) =>
          Alert.alert(PRIVACY_DOWNLOAD_LABEL, ok ? 'We recorded your download request. The export packer is not built yet.' : PRIVACY_RIGHTS_PLACEHOLDER_NOTE),
        );
      }}
      onDeleteHealth={() => placeholder(PRIVACY_DELETE_HEALTH_LABEL)}
      onDeleteAccount={() => placeholder(PRIVACY_DELETE_ACCOUNT_LABEL)}
      onCoaching={() => placeholder(PRIVACY_COACHING_LABEL)}
    />
  );
}
