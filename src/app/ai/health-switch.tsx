import { router } from 'expo-router';
import { useSession } from '../../auth/SessionProvider';
import { HealthSwitchScreen } from '../../ai/screens/HealthSwitch';

function firstName(display: string | null | undefined): string | undefined {
  const n = display?.trim().split(/\s+/)[0];
  return n || undefined;
}

/** Opens Privacy & safety. Never flips Health data or AI here — those texts are shown only on that screen. */
export default function HealthSwitchRoute() {
  const { onboarding, profile } = useSession();
  const teen = !!onboarding?.is_minor;
  const teenName = teen ? firstName(profile?.display_name) ?? 'Alex' : undefined;

  return (
    <HealthSwitchScreen
      teenName={teenName}
      onReview={() => router.push('/privacy-safety')}
      onNotNow={() => router.back()}
      onBack={() => router.back()}
    />
  );
}
