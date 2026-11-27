/**
 * Saved form-check videos (privacy policy §14, health-data policy retention table):
 *   - Adults: on the phone, deleted after 90 days unless starred; at most 20 starred.
 *   - 16–17: deleted on the phone right after analysis; never uploaded, never starred.
 */
export const VIDEO_RETENTION_DAYS = 90;
export const MAX_STARRED_VIDEOS = 20;
const DAY_MS = 86_400_000;

export type LocalVideo = {
  id: string;
  /** ISO timestamp when recorded. */
  recordedAt: string;
  starred: boolean;
};

/** Whether a video is kept at all once analysis finishes. */
export function keepVideoAfterAnalysis(ownerIsMinor: boolean): boolean {
  return !ownerIsMinor;
}

/** When an unstarred adult video is deleted. */
export function expiresAt(v: LocalVideo): Date | null {
  if (v.starred) return null;
  return new Date(Date.parse(v.recordedAt) + VIDEO_RETENTION_DAYS * DAY_MS);
}

/** Ids of videos the phone must delete now. A minor's phone keeps none. */
export function videosToDelete(videos: readonly LocalVideo[], now: Date, ownerIsMinor: boolean): string[] {
  if (ownerIsMinor) return videos.map((v) => v.id);
  return videos
    .filter((v) => {
      const exp = expiresAt(v);
      return exp !== null && now.getTime() >= exp.getTime();
    })
    .map((v) => v.id);
}

export type StarResult = { ok: true } | { ok: false; reason: 'star_limit' | 'minor' | 'expired' };

/** Starring is refused past the limit, for minors, and for a video already past 90 days. */
export function canStar(videos: readonly LocalVideo[], id: string, now: Date, ownerIsMinor: boolean): StarResult {
  if (ownerIsMinor) return { ok: false, reason: 'minor' };
  const v = videos.find((x) => x.id === id);
  if (!v || v.starred) return { ok: true };
  const exp = expiresAt(v);
  if (exp && now.getTime() >= exp.getTime()) return { ok: false, reason: 'expired' };
  const starred = videos.filter((x) => x.starred).length;
  return starred >= MAX_STARRED_VIDEOS ? { ok: false, reason: 'star_limit' } : { ok: true };
}
