/** Lock-screen preview text. 16–17 must never see parent/coach message text on the lock screen. */
export type LockScreenKind = 'message' | 'workout' | 'plan';

export function messageLockScreenPreview(kind: LockScreenKind, isMinor: boolean, body?: string): string {
  if (isMinor && kind === 'message') return 'New message';
  return body ?? '';
}

/** Rev 5: lock-screen / push preview for a parent-caused Health-off notice. Mentions no health info. */
export const PARENT_PRIVACY_CHANGE_LOCK_SCREEN = 'Your parent changed a privacy setting.';

export function parentHealthDeletionLockScreenPreview(): string {
  return PARENT_PRIVACY_CHANGE_LOCK_SCREEN;
}
