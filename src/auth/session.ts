/**
 * Role types + helpers. The role SOURCE OF TRUTH is public.user_roles on the server, read by
 * SessionProvider when Supabase is configured. Client state is a UI-gating cache only;
 * RLS enforces access server-side. A client-set role or a JWT `app_role` claim is never trusted.
 *
 * Dev preview (Supabase NOT configured only, `__DEV__` only): set EXPO_PUBLIC_DEV_ROLE
 * (athlete | coach_pending | coach_verified) when starting Metro. Ignored when configured.
 */
export type Role = 'athlete' | 'coach_pending' | 'coach_verified' | 'gym_admin' | 'platform_admin';

export const DEFAULT_ROLE: Role = 'athlete';

const ROLES: readonly Role[] = ['athlete', 'coach_pending', 'coach_verified', 'gym_admin', 'platform_admin'];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Only coach_verified unlocks Studio tools. gym_admin / platform_admin do not. */
export function isVerifiedCoach(role: Role): boolean {
  return role === 'coach_verified';
}

/** Pending and verified coaches see the Studio tab. Pending sees the lock. */
export function isStudioCoach(role: Role): boolean {
  return role === 'coach_pending' || role === 'coach_verified';
}

/** Unconfigured-prototype role: dev override in __DEV__, otherwise athlete. */
export function resolveDevRole(): Role {
  if (__DEV__) {
    const dev = process.env.EXPO_PUBLIC_DEV_ROLE;
    if (dev === 'athlete' || dev === 'coach_pending' || dev === 'coach_verified') return dev;
  }
  return DEFAULT_ROLE;
}
