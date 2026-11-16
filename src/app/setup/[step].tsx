import { useLocalSearchParams } from 'expo-router';
import { SetupFlow } from '../../onboarding/SetupFlow';

/** Setup steps 4-8. The optional `step` segment only picks where to start; SetupFlow validates it against the account's mode. */
export default function SetupStepRoute() {
  const { step } = useLocalSearchParams<{ step?: string }>();
  return <SetupFlow param={typeof step === 'string' ? step.slice(0, 20) : undefined} />;
}
