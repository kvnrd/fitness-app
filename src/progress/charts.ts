/**
 * Server-computable chart numbers shared with the SQL RPCs.
 * At most 120 points per range. Body-weight change is styled neutrally by the UI.
 */
export const MAX_CHART_POINTS = 120;
export const WEIGHT_EMA_DAYS = 10;

export type ChartRange = '1M' | '3M' | '6M' | '1Y' | 'All';

export const RANGE_DAYS: Record<Exclude<ChartRange, 'All'>, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
};

export type SeriesPoint = { date: string; value: number };

export type ChartSeries = {
  points: SeriesPoint[];
  start: number | null;
  low: number | null;
  ratePerWeek: number | null;
  /** Fewer than 3 points: teaser, no PR markers. */
  sparse: boolean;
  empty: boolean;
  /** PR markers only when there are more than 5 points (design notes). */
  showPrMarkers: boolean;
};

export function rangeStartDate(range: ChartRange, now: Date): string | null {
  if (range === 'All') return null;
  const days = RANGE_DAYS[range];
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function filterRange(points: readonly SeriesPoint[], range: ChartRange, now: Date): SeriesPoint[] {
  const start = rangeStartDate(range, now);
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return start ? sorted.filter((p) => p.date >= start) : sorted;
}

/** Evenly pick at most `max` points, always keeping the first and last. */
export function downsample(points: readonly SeriesPoint[], max: number = MAX_CHART_POINTS): SeriesPoint[] {
  if (points.length <= max) return [...points];
  if (max < 2) return points.length ? [points[points.length - 1]!] : [];
  const out: SeriesPoint[] = [];
  for (let i = 0; i < max; i++) {
    const idx = i === max - 1 ? points.length - 1 : Math.round((i * (points.length - 1)) / (max - 1));
    const p = points[idx]!;
    if (!out.length || out[out.length - 1]!.date !== p.date || out[out.length - 1]!.value !== p.value) {
      out.push(p);
    }
  }
  return out;
}

/**
 * 10-day EMA of daily values. Missing days do not advance the average;
 * each recorded weigh-in updates it with α = 2 / (days + 1).
 */
export function ema(points: readonly SeriesPoint[], days: number = WEIGHT_EMA_DAYS): SeriesPoint[] {
  if (!points.length || days < 1) return [];
  const a = 2 / (days + 1);
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let prev = sorted[0]!.value;
  return sorted.map((p, i) => {
    const value = i === 0 ? p.value : a * p.value + (1 - a) * prev;
    prev = value;
    return { date: p.date, value };
  });
}

export function summarizeSeries(points: readonly SeriesPoint[]): ChartSeries {
  const empty = points.length === 0;
  const start = empty ? null : points[0]!.value;
  const last = empty ? null : points[points.length - 1]!.value;
  let low: number | null = null;
  for (const p of points) {
    if (low == null || p.value < low) low = p.value;
  }
  let ratePerWeek: number | null = null;
  if (points.length >= 2) {
    const t0 = Date.parse(`${points[0]!.date}T00:00:00Z`);
    const t1 = Date.parse(`${points[points.length - 1]!.date}T00:00:00Z`);
    const weeks = (t1 - t0) / (7 * 24 * 3600 * 1000);
    if (weeks > 0 && start != null && last != null) ratePerWeek = (last - start) / weeks;
  }
  return {
    points: [...points],
    start,
    low,
    ratePerWeek,
    sparse: points.length > 0 && points.length < 3,
    empty,
    showPrMarkers: points.length > 5,
  };
}

export function buildWeightChart(
  weighIns: readonly SeriesPoint[],
  range: ChartRange,
  now: Date,
): ChartSeries {
  const inRange = filterRange(weighIns, range, now);
  const smoothed = ema(inRange);
  return summarizeSeries(downsample(smoothed));
}

export function buildValueChart(points: readonly SeriesPoint[], range: ChartRange, now: Date): ChartSeries {
  return summarizeSeries(downsample(filterRange(points, range, now)));
}
