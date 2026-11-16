/**
 * Session / role module. The ONLY place the app reads a role.
 *
 * CLIENT-SIDE STOPGAP (Phase 0): hiding Studio in the app is UI gating only.
 * The real server-side role check (signed claim / RLS) lands in Phase 2.
 * The app never writes a role in production: the role is not persisted to
 * AsyncStorage or any other client-writable storage, and there is no in-app toggle.
 *
 * Dev preview: in `__DEV__` builds only, set EXPO_PUBLIC_DEV_ROLE
 * (athlete | coach_pending | coach_verified) when starting Metro, e.g.
 *   EXPO_PUBLIC_DEV_ROLE=coach_verified npx expo start
 * The variable is ignored when `__DEV__` is false.
 */
export type Role = 'athlete' | 'coach_pending' | 'coach_verified';

export const DEFAULT_ROLE: Role = 'athlete';

const ROLES: readonly Role[] = ['athlete', 'coach_pending', 'coach_verified'];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function isVerifiedCoach(role: Role): boolean {
  return role === 'coach_verified';
}

export function resolveRole(): Role {
  if (__DEV__) {
    const dev = process.env.EXPO_PUBLIC_DEV_ROLE;
    if (isRole(dev)) return dev;
  }
  return DEFAULT_ROLE;
}
