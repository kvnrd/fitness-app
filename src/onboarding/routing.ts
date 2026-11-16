import type { OnboardingState } from './api.ts';

/**
 * Where a signed-in user goes next, as a pure function of my_onboarding_state() plus two device facts.
 * UI gating only; RLS / functions enforce. `null` (state unreadable) fails closed: never the app.
 *  retry          state could not be read
 *  waiting        pending 16-17 (no active contracting parent): Waiting for a parent
 *  upload-draft   linked 16-17 with a device-only 6-8 draft: upload it first (delete the copy only on success)
 *  goal           linked 16-17 who has not done Step 5 yet (minor-safe list)
 *  setup          steps still missing (adult: from Role; linked teen without a draft: 6-8)
 *  privacy        setup done, Privacy & safety not yet submitted
 *  app            done
 */
export type NextRoute = 'retry' | 'waiting' | 'upload-draft' | 'goal' | 'setup' | 'privacy' | 'app';

export function nextOnboardingRoute(state: OnboardingState | null, facts: { hasDeviceDraft: boolean; goalDone: boolean }): NextRoute {
  if (!state) return 'retry';
  if (state.is_minor && !state.linked) return 'waiting';
  if (state.is_minor) {
    if (facts.hasDeviceDraft && !state.setup_done) return 'upload-draft';
    if (!facts.goalDone) return 'goal';
  }
  if (!state.setup_done) return 'setup';
  if (!state.privacy_done) return 'privacy';
  return 'app';
}

/** Should the device draft be uploaded now? Only for a linked teen; a pending one never uploads. */
export const shouldUploadDraft = (state: OnboardingState | null, hasDeviceDraft: boolean): boolean =>
  !!state && state.is_minor && state.linked && hasDeviceDraft;

/** True when the pending teen needs a (new) parent invite: none yet, or the last one was cancelled / expired. */
export const inviteNeedsResend = (status: string | null): boolean => status == null || status === 'cancelled' || status === 'expired';

/** Calm status line under the Waiting copy (UI chrome, not Counsel copy). */
export function inviteStatusText(status: string | null): string {
  switch (status) {
    case 'queued':
      return 'We’re sending your parent’s invite.';
    case 'sent':
      return 'Invite sent. We’ll update this when your parent confirms.';
    case 'accepted':
      return 'Your parent confirmed. Finishing up…';
    case 'cancelled':
    case 'expired':
      return 'That invite is no longer active. Send a new one below.';
    default:
      return 'No invite yet. Add your parent’s email below to send one.';
  }
}

/** Train: workouts stay disabled until both risk acknowledgements exist (server enforces via can_train). */
export const workoutsLocked = (state: OnboardingState | null): boolean => !!state && !state.can_train;
export const parentRiskMissing = (state: OnboardingState | null): boolean => !!state && state.is_minor && !state.can_train && state.parent_risk_done === false;
