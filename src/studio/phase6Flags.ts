/**
 * Phase 6 launch flags. Each stays off until the named condition is met.
 * Tests pass an override so both states stay covered.
 */

/** Screens 53 / 53b. Off until the designated DMCA agent is registered
 *  (17 U.S.C. §512(c)(2)) and the real 5.11 details replace the placeholder. */
export const DMCA_FORM_ENABLED: boolean = false;

/** Hash-matching vendor calls and 5.18/5.20 copy. Off until the vendor is live.
 *  When off, demo videos are also not sent to the vendor. */
export const HASH_MATCHING_LIVE: boolean = false;

export function dmcaFormEnabled(flag: boolean = DMCA_FORM_ENABLED): boolean {
  return flag === true;
}

export function hashMatchingLive(flag: boolean = HASH_MATCHING_LIVE): boolean {
  return flag === true;
}
