import { safeDeepLinkPath } from '../utils/deepLinks';

/** Rewrites incoming deep links; anything off the allowlist lands on Train. */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    return safeDeepLinkPath(path) ?? '/';
  } catch {
    return '/';
  }
}
