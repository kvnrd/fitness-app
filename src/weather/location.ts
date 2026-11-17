/**
 * Approximate location for WeatherKit: about a 1-mile grid, coarser than the
 * TDPSA 1,750-ft precise-location line. The client rounds before sending; the
 * server rounds again. Precise coordinates are never stored or logged.
 */
export const LOCATION_GRID_MILES = 1;
/** Mean statute miles per degree of latitude. */
const MILES_PER_DEG_LAT = 69.172;

export type ApproxLocation = { lat: number; lon: number };

export function roundApproxLocation(lat: number, lon: number): ApproxLocation {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('invalid_location');
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error('invalid_location');
  const latStep = LOCATION_GRID_MILES / MILES_PER_DEG_LAT;
  const rlat = Math.round(lat / latStep) * latStep;
  const clamped = Math.max(-89.9, Math.min(89.9, rlat));
  const lonStep = latStep / Math.max(Math.cos((clamped * Math.PI) / 180), 0.01);
  let rlon = Math.round(lon / lonStep) * lonStep;
  if (rlon > 180) rlon -= 360;
  if (rlon < -180) rlon += 360;
  return { lat: Number(rlat.toFixed(6)), lon: Number(rlon.toFixed(6)) };
}

/** True when `candidate` sits on the same 1-mile grid as `lat`/`lon` would. */
export function isAlreadyRounded(lat: number, lon: number, candidate: ApproxLocation): boolean {
  const expect = roundApproxLocation(lat, lon);
  return expect.lat === candidate.lat && expect.lon === candidate.lon;
}
