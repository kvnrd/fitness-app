// Parses and validates the model's JSON. Only allowlisted fields are copied; everything else is dropped.
// The output shape has no personal-data fields (Counsel: no personal data in output schemas).
import { DAY_KEYS, isOneOf } from './schema.ts';

export interface PlanExercise { name: string; sets: number; target: string; notes: string }
export interface PlanDay { day: (typeof DAY_KEYS)[number]; title: string; focus: string; duration_min: number; rest: boolean; exercises: PlanExercise[] }
export interface Plan { days: PlanDay[]; swaps: { avoid: string; instead: string }[] }

const str = (v: unknown, max: number): string | null => (typeof v === 'string' && v.length <= max ? v.trim() : null);
const int = (v: unknown, lo: number, hi: number): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : null;

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function parsePlan(text: string, expectedTrainingDays: number): Plan | null {
  const raw = extractJson(text) as { days?: unknown; swaps?: unknown } | null;
  if (!raw || !Array.isArray(raw.days) || raw.days.length === 0 || raw.days.length > 7) return null;
  const seen = new Set<string>();
  const days: PlanDay[] = [];
  for (const d of raw.days as Record<string, unknown>[]) {
    if (!d || typeof d !== 'object' || !isOneOf(DAY_KEYS, d.day) || seen.has(d.day)) return null;
    seen.add(d.day);
    const title = str(d.title, 80), focus = str(d.focus ?? '', 160), dur = int(d.duration_min, 0, 180);
    if (title === null || focus === null || dur === null) return null;
    const exIn = Array.isArray(d.exercises) ? (d.exercises as Record<string, unknown>[]) : [];
    if (exIn.length > 12) return null;
    const exercises: PlanExercise[] = [];
    for (const e of exIn) {
      const name = str(e?.name, 80), sets = int(e?.sets, 1, 10), target = str(e?.target ?? '', 120), notes = str(e?.notes ?? '', 240);
      if (!name || sets === null || target === null || notes === null) return null;
      exercises.push({ name, sets, target, notes });
    }
    const rest = d.rest === true || exercises.length === 0;
    days.push({ day: d.day, title, focus, duration_min: dur, rest, exercises: rest ? [] : exercises });
  }
  if (days.filter((d) => !d.rest).length !== expectedTrainingDays) return null;
  const swaps: Plan['swaps'] = [];
  for (const s of (Array.isArray(raw.swaps) ? raw.swaps : []).slice(0, 20) as Record<string, unknown>[]) {
    const avoid = str(s?.avoid, 80), instead = str(s?.instead, 80);
    if (avoid && instead) swaps.push({ avoid, instead });
  }
  return { days, swaps };
}

export function planStrings(plan: Plan): string[] {
  const out: string[] = [];
  for (const d of plan.days) {
    out.push(d.title, d.focus);
    for (const e of d.exercises) out.push(e.name, e.target, e.notes);
  }
  for (const s of plan.swaps) out.push(s.avoid, s.instead);
  return out;
}
