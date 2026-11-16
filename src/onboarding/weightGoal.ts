import { PACES, type PaceId } from './goals.ts';
import type { Units } from './prefs.ts';

/** Adult weight goal helpers (pure). Weights are health data: they live on the device (deviceSetupStore). */
export const LB_PER_KG = 2.20462262;
export const KG_PER_LB = 0.45359237;

export const WEIGHT_LIMITS: Record<Units, { min: number; max: number; step: number }> = {
  lb: { min: 60, max: 800, step: 1 },
  kg: { min: 27, max: 360, step: 0.5 },
};

export const clampWeight = (v: number, unit: Units): number => {
  const l = WEIGHT_LIMITS[unit];
  return Math.min(l.max, Math.max(l.min, Math.round(v * 10) / 10));
};

/** Parse typed text ("186.4", "186,4"). null when empty or out of range. */
export function parseWeight(text: string, unit: Units): number | null {
  const n = Number(text.trim().replace(',', '.'));
  if (!text.trim() || !Number.isFinite(n)) return null;
  const l = WEIGHT_LIMITS[unit];
  return n >= l.min && n <= l.max ? Math.round(n * 10) / 10 : null;
}

export const stepWeight = (v: number | null, dir: 1 | -1, unit: Units, fallback: number): number => clampWeight((v ?? fallback) + dir * WEIGHT_LIMITS[unit].step, unit);

export const toLb = (v: number, unit: Units): number => (unit === 'lb' ? v : v * LB_PER_KG);
export const fromLb = (lb: number, unit: Units): number => (unit === 'lb' ? lb : lb * KG_PER_LB);

export const formatWeight = (v: number): string => (Number.isInteger(v) ? String(v) : v.toFixed(1));

export type Projection = { diff: number; weeks: number; whenLabel: string; perWeek: number } | null;

/** Pace is capped at 1% of body weight per week (copy from the Paper board). Weeks are rounded up. */
export function projection(current: number | null, target: number | null, unit: Units, pace: PaceId, now: Date = new Date()): Projection {
  if (current == null || target == null || current === target) return null;
  const lbPerWeek = PACES.find((p) => p.id === pace)?.lbPerWeek ?? 0.5;
  const cap = toLb(current, unit) * 0.01;
  const perWeekLb = Math.min(lbPerWeek, cap);
  const perWeek = fromLb(perWeekLb, unit);
  const diff = Math.round((target - current) * 10) / 10;
  const weeks = Math.max(1, Math.ceil(Math.abs(diff) / perWeek));
  const d = new Date(now.getTime() + weeks * 7 * 24 * 3600 * 1000);
  const month = d.toLocaleString('en-US', { month: 'long' });
  const dom = d.getDate();
  const part = dom <= 10 ? 'early' : dom <= 20 ? 'mid' : 'late';
  return { diff, weeks, whenLabel: `${part} ${month}`, perWeek: Math.round(perWeek * 100) / 100 };
}

/** Max-weight steppers on the equipment step. The draft keeps lb; kg is shown to the nearest 0.5 and stepped by 2.5. */
export const maxDisplay = (lb: number, unit: Units): number => (unit === 'lb' ? Math.round(lb) : Math.round(lb * KG_PER_LB * 2) / 2);
export function stepMaxLb(lb: number, dir: 1 | -1, unit: Units): number {
  if (unit === 'lb') return lb + dir * 5;
  return Math.round((maxDisplay(lb, 'kg') + dir * 2.5) * LB_PER_KG);
}

/** Wire conversion: the draft holds weights in lb; when units are kg the server gets kg. */
export const toWireUnit = (lb: number, unit: Units): number => (unit === 'lb' ? Math.round(lb) : Math.round(lb * KG_PER_LB));
