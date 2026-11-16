import { PolicyScreen } from '../../components/PolicyScreen';
import { PRIVACY_POLICY_DOC } from '../../legal/policies/policies.generated';

/** [ATTORNEY] Draft Privacy Policy (Counsel v0.2). Public text; mounted outside every auth guard. */
export default function PrivacyPolicyRoute() {
  return <PolicyScreen doc={PRIVACY_POLICY_DOC} />;
}
