import type { SetAnalysis } from './analyzer.ts';
import type { FlagCode } from './movements.ts';

/**
 * Rule-based extra cues (Pro). No LLM: form-check data isn't covered by the AI consent
 * (privacy policy §8 review note 5). Cues are codes; the words come from an approved table.
 */
export type CueCode = 'cue_depth' | 'cue_chest_up' | 'cue_finish_lockout' | 'cue_bar_close' | 'cue_brace_hips' | 'cue_film_angle';

const CUE_FOR: Record<FlagCode, CueCode> = {
  depth_short: 'cue_depth',
  torso_lean: 'cue_chest_up',
  lockout_incomplete: 'cue_finish_lockout',
  bar_drift: 'cue_bar_close',
  hip_sag: 'cue_brace_hips',
  low_confidence: 'cue_film_angle',
};

export const MAX_CUES = 2;

/**
 * Cues for a set: a flag earns a cue when it shows up on at least a third of the reps and on
 * at least 2 reps (1 rep for sets of 1–2). Most frequent first, at most MAX_CUES. A camera
 * problem (low_confidence) wins over technique cues, since the numbers can't be trusted.
 */
export function setCues(a: SetAnalysis): CueCode[] {
  const n = a.reps.length;
  if (n === 0) return [];
  const counts = new Map<FlagCode, number>();
  for (const r of a.reps) for (const f of r.flags) counts.set(f, (counts.get(f) ?? 0) + 1);
  const need = Math.max(n <= 2 ? 1 : 2, Math.ceil(n / 3));
  const lowConf = counts.get('low_confidence') ?? 0;
  if (lowConf >= need) return ['cue_film_angle'];
  return [...counts.entries()]
    .filter(([f, c]) => f !== 'low_confidence' && c >= need)
    .sort((x, y) => y[1] - x[1])
    .slice(0, MAX_CUES)
    .map(([f]) => CUE_FOR[f]);
}

/** Reps with any technique flag (low confidence alone doesn't count as a flagged rep). */
export function flaggedReps(a: SetAnalysis): number[] {
  return a.reps.filter((r) => r.flags.some((f) => f !== 'low_confidence')).map((r) => r.index);
}
