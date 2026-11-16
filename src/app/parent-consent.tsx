import { ComingInJobB } from '../onboarding/screens/ComingInJobB';

// TODO(job B): parent-consent screen (attestation + parent risk checkbox) using acceptParentInvite /
// acceptLink. The only param is `token`, validated by isInviteToken in utils/deepLinks.ts.
export default function ParentConsentRoute() {
  return <ComingInJobB name="parent-consent" />;
}
