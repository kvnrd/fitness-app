/** Mass and distance units for Progress. Canonical storage is pounds and metres. */

export type MassUnit = 'lb' | 'kg';
export type DistanceUnit = 'mi' | 'km';

import { KG_PER_LB, LB_PER_KG } from '../onboarding/weightGoal.ts';
export { KG_PER_LB, LB_PER_KG };
export const METERS_PER_MILE = 1609.344;
export const METERS_PER_KM = 1000;

export const DEFAULT_MASS_UNIT: MassUnit = 'lb';
export const DEFAULT_DISTANCE_UNIT: DistanceUnit = 'mi';

export function massToLb(value: number, unit: MassUnit): number {
  return unit === 'lb' ? value : value * LB_PER_KG;
}

export function massFromLb(lb: number, unit: MassUnit): number {
  return unit === 'lb' ? lb : lb * KG_PER_LB;
}

/** Round display mass: 1 lb or 0.1 kg, matching the onboarding steppers. */
export function roundMass(value: number, unit: MassUnit): number {
  if (unit === 'lb') return Math.round(value * 10) / 10;
  return Math.round(value * 10) / 10;
}

export function distanceToMeters(value: number, unit: DistanceUnit): number {
  return unit === 'mi' ? value * METERS_PER_MILE : value * METERS_PER_KM;
}

export function distanceFromMeters(meters: number, unit: DistanceUnit): number {
  return unit === 'mi' ? meters / METERS_PER_MILE : meters / METERS_PER_KM;
}

/** Rowing splits are always seconds per 500 m, regardless of the distance-unit pref. */
export function rowSplitSecPer500(timeSeconds: number, distanceMeters: number): number | null {
  if (!(timeSeconds > 0) || !(distanceMeters > 0)) return null;
  return timeSeconds * (500 / distanceMeters);
}

export function paceSecPerUnit(timeSeconds: number, distanceMeters: number, unit: DistanceUnit): number | null {
  if (!(timeSeconds > 0) || !(distanceMeters > 0)) return null;
  const dist = distanceFromMeters(distanceMeters, unit);
  if (!(dist > 0)) return null;
  return timeSeconds / dist;
}

export function speedUnitPerHour(timeSeconds: number, distanceMeters: number, unit: DistanceUnit): number | null {
  if (!(timeSeconds > 0) || !(distanceMeters > 0)) return null;
  const hours = timeSeconds / 3600;
  if (!(hours > 0)) return null;
  return distanceFromMeters(distanceMeters, unit) / hours;
}
