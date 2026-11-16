import { useLocalSearchParams } from 'expo-router';
import { ComingInJobB } from '../../onboarding/screens/ComingInJobB';

// TODO(job B): Setup steps 4-8 (role, goal, style, follow-ups, equipment, prefs).
export default function SetupStepRoute() {
  const { step } = useLocalSearchParams<{ step?: string }>();
  return <ComingInJobB name={`setup/${typeof step === 'string' ? step.slice(0, 20) : ''}`} />;
}
