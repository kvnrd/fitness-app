import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { loadConsents } from '../../auth/consents';
import { useSession } from '../../auth/SessionProvider';
import { PrivacySettingsScreen } from '../../settings/screens/PrivacySettings';

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
      onExport={() => Alert.alert('Download my data', 'Data export will be available before launch.')}
      onDelete={() => Alert.alert('Delete my data', 'Account deletion will be available before launch.')}
    />
  );
}
