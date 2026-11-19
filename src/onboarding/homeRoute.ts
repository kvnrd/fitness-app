/**
 * The root gate's "home" screen for each state, and when to send the app there.
 *
 * Why: when the current route is blocked by a Stack.Protected guard, expo-router falls back to ONE screen for the
 * whole root Stack: the first allowed static route, shortest name first (then alphabetical). That is rarely the
 * state's own screen: signed out it is /age (not /welcome), during setup it is a legal page (setup/[step] has a
 * param, so it is never picked), and the same for privacy, a waiting teen and not-eligible. So the gate redirects
 * to the state's home when the router has fallen back.
 *
 * Mirror of the guards in src/app/_layout.tsx. Keep both in step.
 */

export type GateFlags = {
  notEligible: boolean;
  signedOut: boolean;
  needsProfile: boolean;
  pendingMinor: boolean;
  needsSetup: boolean;
  needsPrivacy: boolean;
  needsTerms: boolean;
  termsWaiting: boolean;
  /** General app use allowed (the (tabs) group is mounted). */
  inAppOk: boolean;
};

/** Public policy text, mounted outside every guard: reachable from every state. */
const PUBLIC_LEGAL = ['/legal/privacy', '/legal/health-privacy', '/legal/terms', '/legal/coach-terms'];

const SIGNED_OUT = ['/welcome', '/method', '/age', '/parent-help', '/invite-parent', '/invite-sent', '/create', '/verify', '/sign-in', '/parent-consent'];
const ADULT_EXTRAS = ['/parent-link', '/parent-consent'];
const IN_APP_LIMITED = ['/privacy-safety', '/settings/privacy', '/settings/health-reask', '/settings/photo-privacy', '/settings/photo-share', '/settings/data-export', '/photos', '/consent'];

/** The state's own first screen, or null when no redirect applies (the app itself, or not ready). */
export function homeRoute(g: GateFlags): string | null {
  if (g.notEligible) return '/not-eligible';
  if (g.signedOut) return '/welcome';
  if (g.needsProfile) return '/onboarding';
  if (g.pendingMinor) return '/waiting-parent';
  // SetupFlow ignores an unknown step and starts at the account's first step.
  if (g.needsSetup) return '/setup/start';
  if (g.needsPrivacy) return '/privacy-safety';
  if (g.inAppOk) return null;
  if (g.needsTerms || g.termsWaiting) return '/legal/reaccept';
  return null;
}

/** Screens the gate mounts in this state (path prefixes), besides the public legal pages. */
export function allowedPaths(g: GateFlags): string[] {
  if (g.notEligible) return ['/not-eligible'];
  if (g.signedOut) return SIGNED_OUT;
  if (g.needsProfile) return ['/onboarding'];
  if (g.pendingMinor) return ['/waiting-parent', '/setup', '/parent-link'];
  if (g.needsSetup) return ['/setup', ...ADULT_EXTRAS];
  if (g.needsPrivacy) return ['/privacy-safety', ...ADULT_EXTRAS];
  if (g.needsTerms || g.termsWaiting) return ['/legal/reaccept', ...IN_APP_LIMITED, ...ADULT_EXTRAS];
  return [];
}

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/');

/**
 * Whether to replace the current route with `home`.
 * - Never when already on home (or a sub-route of its folder, e.g. any /setup/<step>).
 * - Never on a public legal page the user opened on purpose: pushed from another screen (canGoBack) or the
 *   launch URL itself (a deep link). The router's own fallback lands there from "/" with no back stack.
 * - Always on a root screen the router picked (no back stack): that is the fallback, e.g. /age when signed out.
 * - Otherwise only when the path is not one of this state's screens.
 */
export function shouldGoHome(
  g: GateFlags,
  nav: { path: string; canGoBack: boolean; launchPath: string | null },
): string | null {
  const home = homeRoute(g);
  if (!home) return null;
  const { path, canGoBack, launchPath } = nav;
  // The dev-only screenshot harness is mounted only in preview builds; never send it anywhere.
  if (path === '/dev-preview') return null;
  const homeFolder = home.startsWith('/setup/') ? '/setup' : home;
  if (matches(path, homeFolder)) return null;
  if (PUBLIC_LEGAL.includes(path)) return canGoBack || path === launchPath ? null : home;
  if (!canGoBack) return home;
  return allowedPaths(g).some((p) => matches(path, p)) ? null : home;
}
