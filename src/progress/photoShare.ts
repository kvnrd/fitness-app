/**
 * Coach sharing for progress photos is opt-in, per photo, and only for an active 1:1
 * coach relationship. Plan followers cannot share. Access ends when the share is
 * revoked or the relationship ends (enforced again on the server).
 */

export type PhotoShareGate = {
  isMinor: boolean;
  healthOn: boolean;
  photoOptedIn: boolean;
  /** Separate share-with-coach opt-in (not the general training-data coach_sharing switch). */
  photoShareOptedIn: boolean;
  /** Approved, verified coach who is 18+. */
  coachIsApprovedAdult: boolean;
  hasActiveOneToOneCoach: boolean;
  /** Assigned a general plan with no 1:1 coach relationship. */
  isPlanFollowerOnly: boolean;
};

export function canShareProgressPhoto(g: PhotoShareGate): boolean {
  if (g.isMinor) return false;
  if (g.isPlanFollowerOnly) return false;
  return (
    g.healthOn === true &&
    g.photoOptedIn === true &&
    g.photoShareOptedIn === true &&
    g.coachIsApprovedAdult === true &&
    g.hasActiveOneToOneCoach === true
  );
}

export function canCoachViewSharedPhoto(opts: {
  shareRevoked: boolean;
  relationshipActive: boolean;
  athleteAllows: boolean;
}): boolean {
  return opts.shareRevoked === false && opts.relationshipActive === true && opts.athleteAllows === true;
}
