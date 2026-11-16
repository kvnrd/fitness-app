import { PolicyScreen } from '../../components/PolicyScreen';
import { TERMS_DOC } from '../../legal/policies/policies.generated';
import { isProductionBuild } from '../../legal/text';

/** [ATTORNEY] Counsel Terms of Service, bundled as v0.1-draft. Public text; mounted outside every auth guard. */
export default function TermsRoute() {
  const note = isProductionBuild
    ? undefined
    : 'This is a pre-production draft. Placeholders such as [Company] are still open. Anything you accept now will have to be accepted again before launch.';
  return <PolicyScreen doc={TERMS_DOC} note={note} />;
}
