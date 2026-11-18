/**
 * PostHog and Sentry are configured only when their public env keys are set.
 * This module does not import either SDK and never calls identify / setUser.
 * Retention (published policy): PostHog 12 months, Sentry 90 days.
 */
export const POSTHOG_RETENTION_DAYS = 365;
export const SENTRY_RETENTION_DAYS = 90;

export function posthogKey(env: NodeJS.ProcessEnv = process.env): string | null {
  const v = env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
  return v ? v : null;
}

export function sentryDsn(env: NodeJS.ProcessEnv = process.env): string | null {
  const v = env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  return v ? v : null;
}

export function posthogEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return posthogKey(env) !== null;
}

export function sentryEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return sentryDsn(env) !== null;
}
