/** Mass and distance units for Progress. Canonical storage is pounds and miles. Display follows the user setting. */

export type MassUnit = 'lb' | 'kg';
export type DistanceUnit = 'mi' | 'km';

import { KG_PER_LB, LB_PER_KG } from '../onboarding/weightGoal.ts';
export { KG_PER_LB, LB_PER_KG };
export const METERS_PER_MILE = 1609.344;
export const METERS_PER_KM = 1000;
export const MILES_PER_KM = METERS_PER_KM / METERS_PER_MILE;

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

/** Convert a displayed distance into canonical miles. */
export function distanceToMiles(value: number, unit: DistanceUnit): number {
  return unit === 'mi' ? value : value * MILES_PER_KM;
}

/** Convert canonical miles into the user's display unit. */
export function distanceFromMiles(miles: number, unit: DistanceUnit): number {
  return unit === 'mi' ? miles : miles / MILES_PER_KM;
}

export function milesToMeters(miles: number): number {
  return miles * METERS_PER_MILE;
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

/** @deprecated Use distanceToMiles; kept for 500 m split math. */
export function distanceToMeters(value: number, unit: DistanceUnit): number {
  return milesToMeters(distanceToMiles(value, unit));
}

/** @deprecated Use distanceFromMiles; kept for 500 m split math. */
export function distanceFromMeters(meters: number, unit: DistanceUnit): number {
  return distanceFromMiles(metersToMiles(meters), unit);
}

/** Rowing splits are always seconds per 500 m, regardless of the distance-unit pref. `distanceMiles` is canonical storage. */
export function rowSplitSecPer500(timeSeconds: number, distanceMiles: number): number | null {
  const distanceMeters = milesToMeters(distanceMiles);
  if (!(timeSeconds > 0) || !(distanceMeters > 0)) return null;
  return timeSeconds * (500 / distanceMeters);
}

export function paceSecPerUnit(timeSeconds: number, distanceMiles: number, unit: DistanceUnit): number | null {
  if (!(timeSeconds > 0) || !(distanceMiles > 0)) return null;
  const dist = distanceFromMiles(distanceMiles, unit);
  if (!(dist > 0)) return null;
  return timeSeconds / dist;
}

export function speedUnitPerHour(timeSeconds: number, distanceMiles: number, unit: DistanceUnit): number | null {
  if (!(timeSeconds > 0) || !(distanceMiles > 0)) return null;
  const hours = timeSeconds / 3600;
  if (!(hours > 0)) return null;
  return distanceFromMiles(distanceMiles, unit) / hours;
}
