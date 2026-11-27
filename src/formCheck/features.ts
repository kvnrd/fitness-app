/**
 * What a user sees after a set. Live rep count is free; the rest is Pro (BUILD-PLAN Phase 7).
 * Pro entitlements arrive with the Phase 9 paywall, so until then callers pass isPro = false
 * in store builds. Dev builds can preview Pro with EXPO_PUBLIC_DEV_FORM_CHECK_PRO=1.
 */
export type FormCheckOutputs = {
  repCount: true;
  angles: boolean;
  flaggedReps: boolean;
  barPath: boolean;
  cues: boolean;
};

export function formCheckOutputs(isPro: boolean): FormCheckOutputs {
  return { repCount: true, angles: isPro, flaggedReps: isPro, barPath: isPro, cues: isPro };
}

/** Dev-only Pro preview. Never true in a production build. */
export function devProPreview(env: Record<string, string | undefined> = process.env): boolean {
  return env.EXPO_PUBLIC_ENV !== 'production' && env.EXPO_PUBLIC_DEV_FORM_CHECK_PRO === '1';
}
