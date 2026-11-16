import { PolicyScreen } from '../../components/PolicyScreen';
import { HEALTH_POLICY_DOC } from '../../legal/policies/policies.generated';

/** [ATTORNEY] Draft Consumer Health Data Privacy Policy (Counsel v0.2). Public text; mounted outside every auth guard. */
export default function HealthPrivacyPolicyRoute() {
  return <PolicyScreen doc={HEALTH_POLICY_DOC} />;
}
