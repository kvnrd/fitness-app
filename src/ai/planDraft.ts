/**
 * In-memory draft of the last generated plan for this app session. Not persisted; a process
 * restart returns the user to the quiz. Used to carry generating → preview / blocked without
 * putting the plan on the URL.
 */
import type { AiPlan } from './aiPlan';
import type { InjuryChipId, QuizState } from './quiz';

export type PlanDraft =
  | { status: 'idle' }
  | { status: 'generating'; quiz: QuizState }
  | { status: 'ready'; plan: AiPlan; quiz: QuizState; injury: InjuryChipId | null }
  | { status: 'blocked'; quiz: QuizState };

let draft: PlanDraft = { status: 'idle' };

export const getPlanDraft = (): PlanDraft => draft;
export const setPlanDraft = (next: PlanDraft): void => {
  draft = next;
};
export const clearPlanDraft = (): void => {
  draft = { status: 'idle' };
};
