/** Lock-screen preview text. 16–17 must never see parent/coach message text on the lock screen. */
export type LockScreenKind = 'message' | 'workout' | 'plan';

export function messageLockScreenPreview(kind: LockScreenKind, isMinor: boolean, body?: string): string {
  if (isMinor && kind === 'message') return 'New message';
  return body ?? '';
}
