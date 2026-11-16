import { acceptParentInvite } from './api';
import { setConsent, type ConsentKind } from '../auth/consents';
import { acceptLink } from '../auth/parentLinks';
import {
  HEALTH_POLICY, PRIVACY_POLICY, VERSIONS, legalTextHash, legalTexts, type ParentNames,
} from '../legal/text';
import { consentsToRecord, type PcState } from './parentConsent';

export type ParentConfirmResult = { kind: 'linked' } | { kind: 'linked_partial' } | { kind: 'failed' };

/**
 * Confirm and link: accept (token or pending link) with the attestation / terms / risk / privacy versions + hashes, then
 * record_consent for each optional box that is on, health BEFORE AI, for the linked teen. Optional boxes never block the link.
 * The teen is found by diffing the parent's active minors before and after, because RLS shows the parent no teen identity.
 * [ATTORNEY]
 */
export async function confirmParentLink(args: {
  parentId: string;
  names: ParentNames;
  state: PcState;
  token: string | null;
  linkId: string | null;
  listActiveMinors: (parentId: string) => Promise<string[]>;
}): Promise<ParentConfirmResult> {
  const { names, state } = args;
  const attest = legalTexts.parentAttest(names);
  const risk = legalTexts.riskParent(names);
  const [attestHash, riskHash] = await Promise.all([legalTextHash(attest), legalTextHash(risk)]);
  const common = {
    attestation: { version: attest.version, hash: attestHash },
    termsVersion: VERSIONS.terms,
    risk: { version: risk.version, hash: riskHash },
    privacyVersion: PRIVACY_POLICY.version,
    privacyHash: PRIVACY_POLICY.hash,
  };
  const before = await args.listActiveMinors(args.parentId);
  const ok = args.token
    ? await acceptParentInvite({ token: args.token, ...common })
    : args.linkId
      ? await acceptLink({ linkId: args.linkId, ...common })
      : false;
  if (!ok) return { kind: 'failed' };

  const kinds = consentsToRecord(state);
  if (kinds.length === 0) return { kind: 'linked' };
  const after = await args.listActiveMinors(args.parentId);
  const fresh = after.filter((id) => !before.includes(id));
  if (fresh.length !== 1) return { kind: 'linked_partial' };
  const minor = fresh[0];

  const spec: Record<ConsentKind, { text: { version: string; text: string }; doc?: string }> = {
    health_data: { text: legalTexts.parentHealth(names), doc: HEALTH_POLICY.hash },
    ai_vendor: { text: legalTexts.parentAi(names), doc: HEALTH_POLICY.hash },
    coach_sharing: { text: legalTexts.parentCoach(names) },
  };
  let all = true;
  for (const k of kinds) {
    const r = await setConsent(k, true, { forUser: minor, version: spec[k].text.version, shownText: spec[k].text.text, policyDocHash: spec[k].doc });
    if (r !== 'ok') all = false;
  }
  return all ? { kind: 'linked' } : { kind: 'linked_partial' };
}
