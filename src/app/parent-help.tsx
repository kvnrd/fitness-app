import { router } from 'expo-router';
import { ParentHelpScreen } from '../onboarding/screens/ParentHelp';

/** 16-17 path. No back to the date of birth; the layout disables the back gesture. */
export default function ParentHelpRoute() {
  return <ParentHelpScreen onInvite={() => router.push('/invite-parent')} />;
}
