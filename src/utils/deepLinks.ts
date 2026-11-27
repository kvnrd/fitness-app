import { DAY_KEYS, DayKey } from '../data/types';
import { formCheckLabEnabled } from '../formCheck/lab';

/**
 * Deep-link allowlist (scheme `fitnessapp`). Anything else resolves to null.
 * `/studio` is allowed here but still role-guarded by the route itself.
 * `/age`, `/not-eligible`, `/sign-in`, `/onboarding`, `/parent-link`, `/consent` are allowed only so the router can resolve them;
 * the root layout mounts each one only in its own state (Stack.Protected), otherwise it lands on Train.
 * `/legal/privacy`, `/legal/health-privacy` and `/legal/terms` are public policy text, mounted outside every guard.
 * `/welcome`, `/method`, `/waiting-parent`, `/privacy-safety` are param-free and guarded the same way.
 * `/parent-consent` is the only route that takes a param: `?token=` (64 hex chars or 43 base64url chars), nothing else survives.
 * `/dev-preview` and `/setup/*` are NOT allowlisted. `/dev-form-check` is allowed only in a build with
 * EXPO_PUBLIC_FORM_CHECK_LAB=1 (never production), so a dev build can open it with fitnessapp://dev-form-check.
 * They take no params and perform no action on open.
 */
const STATIC_PATHS = new Set(['/', '/progress', '/studio', '/age', '/not-eligible', '/sign-in', '/onboarding', '/parent-link', '/consent', '/legal/privacy', '/legal/health-privacy', '/legal/terms', '/welcome', '/method', '/waiting-parent', '/privacy-safety']);

/** Invite token as issued by the server: 256 bits as 64 hex chars (or the same bytes as 43 base64url chars). */
export function isInviteToken(v: string): boolean {
  return /^[0-9a-f]{64}$/i.test(v) || /^[A-Za-z0-9_-]{43}$/.test(v);
}

export function safeDeepLinkPath(input: string): string | null {
  let path = input.trim();
  const m = /^([a-z][a-z0-9+.-]*):(.*)$/i.exec(path);
  if (m) {
    if (m[1].toLowerCase() !== 'fitnessapp') return null;
    // fitnessapp://progress -> host is the first path segment
    path = '/' + m[2].replace(/^\/*/, '');
  }
  const query = /\?([^#]*)/.exec(path)?.[1] ?? '';
  path = path.split(/[?#]/)[0];
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, '');
  if (STATIC_PATHS.has(path)) return path;
  if (path === '/dev-form-check' && formCheckLabEnabled()) return path;
  if (path === '/parent-consent') {
    const token = new URLSearchParams(query).get('token');
    return token && isInviteToken(token) ? `/parent-consent?token=${token}` : null;
  }
  const w = /^\/workout\/([a-z]+)$/.exec(path);
  if (w && (DAY_KEYS as string[]).includes(w[1])) return `/workout/${w[1] as DayKey}`;
  return null;
}
