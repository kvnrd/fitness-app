import { HINT_PRIVACY } from '../legal/text.ts';

/**
 * Privacy & safety state machine (pure). Rules, all from Counsel (phase3-review #5, phase4-review #2):
 *  - Switches are OFF by default and never affect Continue; Continue is enabled ONLY by the risk checkbox.
 *  - No "accept all".
 *  - AI planning requires health: AI can be on only while health is on; turning health off turns AI off.
 *    Tapping AI on with health off opens an explanation (healthPrompt). It never enables health by itself:
 *    only confirmHealthPrompt() (the explicit "Turn on health info" tap) does, and then AI stays OFF
 *    (separate consent: the user taps AI again).
 *  - Teen: each switch is LOCKED unless the parent has already granted that scope. [ATTORNEY]
 */
export type Audience = 'adult' | 'teen';
export type ParentGrants = { health: boolean; ai: boolean };
export type PsState = {
  audience: Audience;
  health: boolean;
  ai: boolean;
  risk: boolean;
  parentGrants: ParentGrants;
  /** The "AI planning needs health info" explanation is showing. */
  healthPrompt: boolean;
};

export function initPs(audience: Audience, parentGrants: ParentGrants = { health: false, ai: false }): PsState {
  return { audience, health: false, ai: false, risk: false, parentGrants, healthPrompt: false };
}

export const healthLocked = (s: PsState): boolean => s.audience === 'teen' && !s.parentGrants.health;
export const aiLocked = (s: PsState): boolean => s.audience === 'teen' && !s.parentGrants.ai;

export function setHealth(s: PsState, on: boolean): PsState {
  if (on && healthLocked(s)) return s;
  if (!on && s.audience === 'teen' && !s.health) return s; // locked off stays off
  return { ...s, health: on, ai: on ? s.ai : false, healthPrompt: false };
}

export function setAi(s: PsState, on: boolean): PsState {
  if (!on) return { ...s, ai: false, healthPrompt: false };
  if (aiLocked(s)) return s;
  if (!s.health) return healthLocked(s) ? s : { ...s, healthPrompt: true };
  return { ...s, ai: true };
}

/** The explicit "Turn on health info" tap in the explanation. Turns health on only; AI stays off. */
export function confirmHealthPrompt(s: PsState): PsState {
  if (!s.healthPrompt) return s;
  return { ...s, healthPrompt: false, health: healthLocked(s) ? s.health : true };
}
export const dismissHealthPrompt = (s: PsState): PsState => ({ ...s, healthPrompt: false });

export const setRisk = (s: PsState, v: boolean): PsState => ({ ...s, risk: v });

/** Continue depends ONLY on the risk checkbox. */
export const canContinue = (s: PsState): boolean => s.risk === true;
export const continueHint = (s: PsState): string => (canContinue(s) ? '' : HINT_PRIVACY);

/** What gets submitted. null while the risk box is unchecked. AI is forced off whenever health is off. */
export function submission(s: PsState): { health: boolean; ai: boolean } | null {
  if (!canContinue(s)) return null;
  const health = s.health === true;
  return { health, ai: health && s.ai === true };
}
