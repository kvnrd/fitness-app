// Parses and validates the model's JSON. Only allowlisted fields are copied; everything else is dropped.
// The output shape has no personal-data fields (Counsel: no personal data in output schemas).
//
// Tolerance: small, mechanical slips (a title a few characters too long, "sets": "3", 13 exercises,
// a code fence around the JSON) are normalized instead of failing the whole plan, because one slip
// used to throw away an otherwise good plan ("We couldn't use this plan"). Anything that changes the
// plan's meaning (bad JSON, unknown or repeated day, wrong number of training days) still fails.
// The safety filter runs on exactly the normalized text, so nothing unfiltered can reach the user.
import { DAY_KEYS, isOneOf } from './schema.ts';

export interface PlanExercise { name: string; sets: number; target: string; notes: string }
export interface PlanDay { day: (typeof DAY_KEYS)[number]; title: string; focus: string; duration_min: number; rest: boolean; exercises: PlanExercise[] }
export interface Plan { overview: string; days: PlanDay[]; swaps: { avoid: string; instead: string }[] }

/** Why a reply could not be used. Internal only: the audit log still records just "unparseable". */
export type ParseFailure = 'no_json' | 'bad_json' | 'bad_days' | 'bad_day' | 'bad_exercise' | 'day_count';
export type ParseResult = { ok: true; plan: Plan } | { ok: false; reason: ParseFailure };

export const LIMITS = { title: 80, focus: 160, name: 80, target: 120, notes: 240, overview: 800, swap: 80, exercises: 12 } as const;

/** Shortens to max characters, preferring a sentence end, then a word break. Never adds text. */
export function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentence >= max * 0.5) return cut.slice(0, sentence + 1);
  const space = cut.lastIndexOf(' ');
  return (space >= max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,;:\-–—(]+$/, '');
}

/** A string (possibly empty when allowEmpty), clipped to max; null for anything else. */
function str(v: unknown, max: number, allowEmpty = true): string | null {
  if (v === undefined || v === null) return allowEmpty ? '' : null;
  if (typeof v !== 'string') return null;
  const out = clip(v, max);
  return out || allowEmpty ? out : null;
}

/** An integer, or a numeric string, rounded and clamped to [lo, hi]; null for anything else. */
function int(v: unknown, lo: number, hi: number): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\s*\d+(\.\d+)?\s*$/.test(v) ? Number(v) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

/** Finds the JSON object in the reply: plain, inside a ```json fence, or with prose around it. */
function extractJson(text: string): { ok: true; value: unknown } | { ok: false; reason: 'no_json' | 'bad_json' } {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = fenced && fenced[1].includes('{') ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return { ok: false, reason: 'no_json' };
  try {
    return { ok: true, value: JSON.parse(body.slice(start, end + 1)) };
  } catch {
    return { ok: false, reason: 'bad_json' };
  }
}

const DAY_ALIASES: Record<string, (typeof DAY_KEYS)[number]> = {
  monday: 'mon', tuesday: 'tue', wednesday: 'wed', thursday: 'thu', friday: 'fri', saturday: 'sat', sunday: 'sun',
  tues: 'tue', weds: 'wed', thur: 'thu', thurs: 'thu',
};
function dayKey(v: unknown): (typeof DAY_KEYS)[number] | null {
  if (typeof v !== 'string') return null;
  const k = v.trim().toLowerCase();
  return isOneOf(DAY_KEYS, k) ? k : DAY_ALIASES[k] ?? null;
}

export function parsePlanResult(text: string, expectedTrainingDays: number): ParseResult {
  const j = extractJson(text);
  if (!j.ok) return j;
  const raw = j.value as { overview?: unknown; days?: unknown; swaps?: unknown } | null;
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.days) || raw.days.length === 0 || raw.days.length > 7) {
    return { ok: false, reason: 'bad_days' };
  }
  const seen = new Set<string>();
  const days: PlanDay[] = [];
  for (const d of raw.days as Record<string, unknown>[]) {
    const day = d && typeof d === 'object' ? dayKey(d.day) : null;
    if (!day || seen.has(day)) return { ok: false, reason: 'bad_day' };
    seen.add(day);
    const title = str(d.title, LIMITS.title, false), focus = str(d.focus, LIMITS.focus), dur = int(d.duration_min ?? 0, 0, 180);
    if (title === null || focus === null || dur === null) return { ok: false, reason: 'bad_day' };
    const exIn = Array.isArray(d.exercises) ? (d.exercises as Record<string, unknown>[]).slice(0, LIMITS.exercises) : [];
    const exercises: PlanExercise[] = [];
    for (const e of exIn) {
      if (!e || typeof e !== 'object') return { ok: false, reason: 'bad_exercise' };
      const name = str(e.name, LIMITS.name, false), sets = int(e.sets, 1, 10), target = str(e.target, LIMITS.target), notes = str(e.notes, LIMITS.notes);
      if (!name || sets === null || target === null || notes === null) return { ok: false, reason: 'bad_exercise' };
      exercises.push({ name, sets, target, notes });
    }
    const rest = d.rest === true || exercises.length === 0;
    days.push({ day, title, focus, duration_min: dur, rest, exercises: rest ? [] : exercises });
  }
  if (days.filter((d) => !d.rest).length !== expectedTrainingDays) return { ok: false, reason: 'day_count' };
  const swaps: Plan['swaps'] = [];
  for (const s of (Array.isArray(raw.swaps) ? raw.swaps : []).slice(0, 20) as Record<string, unknown>[]) {
    const avoid = str(s?.avoid, LIMITS.swap), instead = str(s?.instead, LIMITS.swap);
    if (avoid && instead) swaps.push({ avoid, instead });
  }
  // Optional: a missing or non-string overview is dropped rather than failing the whole plan.
  const overview = str(raw.overview, LIMITS.overview) ?? '';
  return { ok: true, plan: { overview, days, swaps } };
}

export function parsePlan(text: string, expectedTrainingDays: number): Plan | null {
  const r = parsePlanResult(text, expectedTrainingDays);
  return r.ok ? r.plan : null;
}

export function planStrings(plan: Plan): string[] {
  const out: string[] = [plan.overview];
  for (const d of plan.days) {
    out.push(d.title, d.focus);
    for (const e of d.exercises) out.push(e.name, e.target, e.notes);
  }
  for (const s of plan.swaps) out.push(s.avoid, s.instead);
  return out;
}
