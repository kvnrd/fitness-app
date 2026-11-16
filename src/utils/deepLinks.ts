import { DAY_KEYS, DayKey } from '../data/types';

/**
 * Deep-link allowlist (scheme `fitnessapp`). Anything else resolves to null.
 * `/studio` is allowed here but still role-guarded by the route itself.
 * `/age`, `/not-eligible`, `/sign-in`, `/onboarding`, `/parent-link`, `/consent` are allowed only so the router can resolve them;
 * the root layout mounts each one only in its own state (Stack.Protected), otherwise it lands on Train.
 * They take no params and perform no action on open.
 */
const STATIC_PATHS = new Set(['/', '/progress', '/studio', '/age', '/not-eligible', '/sign-in', '/onboarding', '/parent-link', '/consent']);

export function safeDeepLinkPath(input: string): string | null {
  let path = input.trim();
  const m = /^([a-z][a-z0-9+.-]*):(.*)$/i.exec(path);
  if (m) {
    if (m[1].toLowerCase() !== 'fitnessapp') return null;
    // fitnessapp://progress -> host is the first path segment
    path = '/' + m[2].replace(/^\/*/, '');
  }
  path = path.split(/[?#]/)[0];
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, '');
  if (STATIC_PATHS.has(path)) return path;
  const w = /^\/workout\/([a-z]+)$/.exec(path);
  if (w && (DAY_KEYS as string[]).includes(w[1])) return `/workout/${w[1] as DayKey}`;
  return null;
}
