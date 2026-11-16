import { HINT_PARENT_PRIVACY } from '../legal/text.ts';

/**
 * Parent consent state (pure). "Confirm and link" needs the attestation AND the parent risk checkbox; the three
 * optional boxes (health, AI plan, coach sharing) never gate it and start OFF. AI plan needs health: the AI box
 * is disabled while health is off (tapping it shows the explanation), and turning health off turns AI off.
 * [ATTORNEY]
 */
export type PcState = { attest: boolean; risk: boolean; health: boolean; ai: boolean; coach: boolean; aiPrompt: boolean };
export const initPc = (): PcState => ({ attest: false, risk: false, health: false, ai: false, coach: false, aiPrompt: false });

export const setAttest = (s: PcState, v: boolean): PcState => ({ ...s, attest: v });
export const setRisk = (s: PcState, v: boolean): PcState => ({ ...s, risk: v });
export const setCoach = (s: PcState, v: boolean): PcState => ({ ...s, coach: v });
export const setHealth = (s: PcState, v: boolean): PcState => ({ ...s, health: v, ai: v ? s.ai : false, aiPrompt: false });
export function setAi(s: PcState, v: boolean): PcState {
  if (!v) return { ...s, ai: false, aiPrompt: false };
  return s.health ? { ...s, ai: true } : { ...s, aiPrompt: true };
}
/** Explicit tap in the explanation: health on, AI stays off. */
export const confirmAiPrompt = (s: PcState): PcState => (s.aiPrompt ? { ...s, aiPrompt: false, health: true } : s);
export const dismissAiPrompt = (s: PcState): PcState => ({ ...s, aiPrompt: false });

export const aiDisabled = (s: PcState): boolean => !s.health;
export const canConfirm = (s: PcState): boolean => s.attest === true && s.risk === true;
export const confirmHint = (s: PcState): string => (canConfirm(s) ? '' : HINT_PARENT_PRIVACY);

export type OptionalKind = 'health_data' | 'ai_vendor' | 'coach_sharing';
/** record_consent calls to make after the link, in order (health before AI). Only boxes that are on. */
export function consentsToRecord(s: PcState): OptionalKind[] {
  const out: OptionalKind[] = [];
  if (s.health) out.push('health_data');
  if (s.ai && s.health) out.push('ai_vendor');
  if (s.coach) out.push('coach_sharing');
  return out;
}
