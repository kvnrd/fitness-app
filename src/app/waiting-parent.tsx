import { useSession } from '../auth/SessionProvider';
import { ComingInJobB } from '../onboarding/screens/ComingInJobB';

// TODO(job B): "Waiting for a parent" (PENDING_TITLE / PENDING_BODY) + local-only steps 6-8; offer re-invite
// via createParentInvite when the parent email is no longer in memory.
export default function WaitingParentRoute() {
  const { signOut } = useSession();
  return <ComingInJobB name="waiting-parent" onSignOut={() => void signOut()} />;
}
