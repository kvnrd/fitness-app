import { useSession } from '../auth/SessionProvider';
import { ComingInJobB } from '../onboarding/screens/ComingInJobB';

// TODO(job B): Privacy & safety (health + AI switches, risk checkbox) via submitPrivacySafety.
export default function PrivacySafetyRoute() {
  const { signOut } = useSession();
  return <ComingInJobB name="privacy-safety" onSignOut={() => void signOut()} />;
}
