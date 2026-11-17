/**
 * Kevin's Phase 5 decisions (Counsel Rev 2 and Rev 3).
 * See docs/phase-5-progress.md.
 */

/** Approved: lock is a default-on setting. Flip to 'always_on' to remove the off switch. */
export type PhotoLockMode = 'always_on' | 'default_on_setting';
export const PHOTO_LOCK_MODE: PhotoLockMode = 'default_on_setting';

/** Approved: keep the "save copies to camera roll" option. The user default is off. */
export const CAMERA_ROLL_SAVE_OPTION = true;

/** Approved: teen weight lives only as a Profile current value when it exists. */
export const TEEN_WEIGHT_PROFILE_ONLY = true;

/**
 * Approved alongside Profile-only: teen weight exists as a Profile current value.
 * false would hide even the Profile current value.
 */
export const TEEN_WEIGHT_EXISTS = true;

/**
 * Approved: a parent cannot export a teen's data.
 * Server RPCs refuse the path; do not re-enable without a Counsel policy sync.
 */
export const PARENT_CAN_EXPORT_TEEN_DATA: boolean = false;
