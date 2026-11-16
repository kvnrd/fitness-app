import { router } from 'expo-router';
import { useLegalLinks } from '../onboarding/flow';
import { WelcomeScreen } from '../onboarding/screens/Welcome';

export default function WelcomeRoute() {
  const links = useLegalLinks();
  return <WelcomeScreen onCreate={() => router.push('/method')} onSignIn={() => router.push('/sign-in')} {...links} />;
}
