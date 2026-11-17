/**
 * Kevin has not decided these Phase 5 items yet (Counsel Rev 2 and Rev 3).
 * Each is a config flag so the rest of the logic can land without a UI.
 * See docs/phase-5-progress.md.
 */

/** Drawn as a default-on setting. Flip to 'always_on' to remove the off switch. */
export type PhotoLockMode = 'always_on' | 'default_on_setting';
export const PHOTO_LOCK_MODE: PhotoLockMode = 'default_on_setting';

/** Keep the "save copies to camera roll" option, default off. Flip to false to drop it. */
export const CAMERA_ROLL_SAVE_OPTION = true;

/** Teen weight lives only as a Profile current value when it exists (Counsel's recommendation). */
export const TEEN_WEIGHT_PROFILE_ONLY = true;

/**
 * Whether teen weight exists at all (Rev 3, pending Kevin).
 * false = no teen weight surface, even in Profile.
 * Default true so the Profile-only path can be built and tested.
 */
export const TEEN_WEIGHT_EXISTS = true;

/**
 * Whether a parent can export a teen's data, with the teen notified (Rev 3, pending Kevin).
 * Counsel recommended yes. Teens have no photos, so this covers other teen data.
 */
export const PARENT_CAN_EXPORT_TEEN_DATA = true;
