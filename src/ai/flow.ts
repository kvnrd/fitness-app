/**
 * Pure router for the AI-plan flow. The health switch, health screen, and clearance all gate
 * generation. A teen cannot self-submit the health screen (the server raises parent_required).
 */
export type HealthScreenStatus = 'missing' | 'due' | 'clearance_needed' | 'ok';

export type AiPlanState = {
  isMinor: boolean;
  /** Effective health_data consent (teen + current parent for 16–17). */
  healthConsent: boolean;
  /** Effective ai_vendor consent. */
  aiConsent: boolean;
  healthScreenStatus: HealthScreenStatus;
  canAiPlan: boolean;
  planAccepted: boolean;
  firstSessionDone: boolean;
};

export type AiStep =
  | 'health-switch'
  | 'health-screen'
  | 'clearance'
  | 'privacy' // health is on but AI vendor consent is still off
  | 'quiz'
  | 'ready';

export function parseHealthScreenStatus(v: unknown): HealthScreenStatus | null {
  return v === 'missing' || v === 'due' || v === 'clearance_needed' || v === 'ok' ? v : null;
}

export function nextAiStep(s: AiPlanState): AiStep {
  if (!s.healthConsent) return 'health-switch';
  if (s.healthScreenStatus === 'missing' || s.healthScreenStatus === 'due') return 'health-screen';
  if (s.healthScreenStatus === 'clearance_needed') return 'clearance';
  if (!s.aiConsent) return 'privacy';
  if (s.planAccepted && s.canAiPlan) return 'ready';
  return 'quiz';
}

export function aiStepRoute(step: AiStep): string {
  switch (step) {
    case 'health-switch':
      return '/ai/health-switch';
    case 'health-screen':
      return '/ai/health';
    case 'clearance':
      return '/ai/clearance';
    case 'privacy':
      return '/privacy-safety';
    case 'quiz':
      return '/ai/quiz';
    case 'ready':
      return '/(tabs)';
  }
}

/** Full banner until the first session is logged; compact footer after. Never hidden. */
export function aiNoticeVariant(s: Pick<AiPlanState, 'planAccepted' | 'firstSessionDone'>): 'banner' | 'footer' | null {
  if (!s.planAccepted) return null;
  return s.firstSessionDone ? 'footer' : 'banner';
}

/** 16–17: no body-weight card or trend on Home. Profile weight only with both health opt-ins and no target. */
export function showHomeWeight(isMinor: boolean): boolean {
  return !isMinor;
}

export function showTeenProfileWeight(opts: { isMinor: boolean; healthSelf: boolean; healthParent: boolean; hasTarget: boolean }): boolean {
  return opts.isMinor && opts.healthSelf && opts.healthParent && !opts.hasTarget;
}
