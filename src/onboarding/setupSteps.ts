import { resolveMinorGoal } from './goals.ts';
import { defaultGym } from './equipment.ts';
import { defaultPrefs } from './prefs.ts';
import { buildSetupPayload, type SetupDraft, type SetupPayload } from './setupPayload.ts';
import { defaultFollowups, skipSelection } from './styles.ts';
import { toWireUnit } from './weightGoal.ts';

/** Setup steps 4-8 as one small pure state machine (the screens and the route only call these). */
export type SetupStepId = 'role' | 'goal' | 'style' | 'followups' | 'equipment' | 'prefs';
export const SETUP_STEP_IDS: readonly SetupStepId[] = ['role', 'goal', 'style', 'followups', 'equipment', 'prefs'];
export const isSetupStepId = (v: unknown): v is SetupStepId => typeof v === 'string' && (SETUP_STEP_IDS as readonly string[]).includes(v);

/** The number shown in "SETUP · STEP n OF 8". Follow-ups share Step 6. */
export const STEP_NUMBER: Record<SetupStepId, number> = { role: 4, goal: 5, style: 6, followups: 6, equipment: 7, prefs: 8 };

/** adult: 4-8 → server. pending: 6-8 only, device only (the bar jumps 3 → 6). linked: 5 first, then 6-8 unless the device draft already went up. */
export type SetupMode = 'adult' | 'minor-pending' | 'minor-linked';

export function stepsFor(mode: SetupMode, opts: { draftUploaded?: boolean } = {}): SetupStepId[] {
  if (mode === 'adult') return [...SETUP_STEP_IDS];
  if (mode === 'minor-pending') return ['style', 'followups', 'equipment', 'prefs'];
  return opts.draftUploaded ? ['goal'] : ['goal', 'style', 'followups', 'equipment', 'prefs'];
}
export const firstStep = (mode: SetupMode, o: { draftUploaded?: boolean } = {}): SetupStepId => stepsFor(mode, o)[0];

export function nextStep(mode: SetupMode, cur: SetupStepId, o: { draftUploaded?: boolean } = {}): SetupStepId | null {
  const s = stepsFor(mode, o);
  const i = s.indexOf(cur);
  return i >= 0 && i + 1 < s.length ? s[i + 1] : null;
}
export function prevStep(mode: SetupMode, cur: SetupStepId, o: { draftUploaded?: boolean } = {}): SetupStepId | null {
  const s = stepsFor(mode, o);
  const i = s.indexOf(cur);
  return i > 0 ? s[i - 1] : null;
}
/** Is `cur` allowed in this mode? (Pending minors can never open role or goal; the route also checks the URL.) */
export const stepAllowed = (mode: SetupMode, cur: SetupStepId): boolean => stepsFor(mode).includes(cur);

type Key = keyof SetupPayload;
const KEYS: Record<'goal' | 'style' | 'equipment' | 'prefs', Key[]> = {
  goal: ['goal', 'goal_pace'],
  style: ['styles', 'main_style', 'days_per_week', 'followups'],
  equipment: ['gym'],
  prefs: ['units', 'distance', 'accent'],
};

/** The draft holds weights in lb; the wire carries the draft's unit. */
function toWire(draft: SetupDraft): SetupDraft {
  const u = draft.prefs.units;
  if (u === 'lb') return draft;
  const maxes = Object.fromEntries(Object.entries(draft.gym.maxes).map(([k, v]) => [k, toWireUnit(v as number, u)]));
  const pm = draft.followups.powerMaxes;
  const conv = (v: number | null) => (v == null ? null : toWireUnit(v, u));
  return {
    ...draft,
    gym: { ...draft.gym, maxes },
    followups: { ...draft.followups, powerMaxes: { squat: conv(pm.squat), bench: conv(pm.bench), deadlift: conv(pm.deadlift) } },
  };
}

function pick(draft: SetupDraft, minor: boolean, keys: Key[]): Partial<SetupPayload> {
  const full = buildSetupPayload(toWire(draft), { minor });
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = full[k];
  return out as Partial<SetupPayload>;
}

/** Partial payload for one step (the server keeps keys that are absent). Never carries body weights. */
export function stepPayload(draft: SetupDraft, step: SetupStepId, minor: boolean): Partial<SetupPayload> | null {
  if (step === 'role') return null;
  if (step === 'goal') return pick(draft, minor, KEYS.goal);
  if (step === 'style' || step === 'followups') return pick(draft, minor, KEYS.style);
  if (step === 'equipment') return pick(draft, minor, KEYS.equipment);
  return pick(draft, minor, KEYS.prefs);
}

/** Upload of a pending teen's device draft: steps 6-8 only. The goal is chosen after the link, on its own screen. */
export function draftUploadPayload(draft: SetupDraft): Partial<SetupPayload> {
  return pick(draft, true, [...KEYS.style, ...KEYS.equipment, ...KEYS.prefs]);
}

/** Skip on a step applies the safe defaults (onboarding-notes). Skip on the follow-ups resets them to the defaults shown. */
export function applySkip(draft: SetupDraft, step: SetupStepId, minor: boolean): SetupDraft {
  switch (step) {
    case 'role':
      return draft;
    case 'goal':
      return { ...draft, goal: minor ? resolveMinorGoal(null) : null, pace: null };
    case 'style':
      return { ...draft, selection: skipSelection(), followups: defaultFollowups() };
    case 'followups':
      return { ...draft, followups: defaultFollowups() };
    case 'equipment':
      return { ...draft, gym: defaultGym() };
    case 'prefs':
      return { ...draft, prefs: defaultPrefs() };
  }
}
