/**
 * Personal-record detection for strength sessions.
 * A session is a PR when its best-set e1RM beats the previous best by more than 0.5 lb.
 * Sessions that are empty after input limits / the rep cap / excludeFromPrs are skipped.
 */
import { bestSetE1rmLb, sessionVolumeLb, topSetLb, type E1rmOptions, type StrengthSet } from './e1rm.ts';

export const PR_MARGIN_LB = 0.5;

export type StrengthSession = {
  id?: string;
  performedOn: string; // YYYY-MM-DD
  sets: readonly StrengthSet[];
};

export type StrengthSessionSummary = {
  id?: string;
  performedOn: string;
  e1rmLb: number | null;
  topSetLb: number | null;
  volumeLb: number;
  isPr: boolean;
};

/** Sessions should be in chronological order. Same-day sessions are kept in the given order. */
export function summarizeStrengthSessions(
  sessions: readonly StrengthSession[],
  opts: E1rmOptions = {},
): StrengthSessionSummary[] {
  let prevBest: number | null = null;
  const out: StrengthSessionSummary[] = [];
  for (const s of sessions) {
    const e1rm = bestSetE1rmLb(s.sets, opts);
    const isPr = e1rm != null && (prevBest == null || e1rm - prevBest > PR_MARGIN_LB);
    if (e1rm != null && (prevBest == null || e1rm > prevBest)) prevBest = e1rm;
    out.push({
      id: s.id,
      performedOn: s.performedOn,
      e1rmLb: e1rm,
      topSetLb: topSetLb(s.sets),
      volumeLb: sessionVolumeLb(s.sets),
      isPr,
    });
  }
  return out;
}
