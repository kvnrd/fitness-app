// Builds the Anthropic Messages request. Counsel section 12/13 rules enforced here:
//  - The prompt contains NO name, email, user id, photos, location or free-text injury/pain notes.
//    It is built from an explicit allowlist of enum values; nothing from the input object is spread.
//  - A random per-request id (not linked to the user anywhere) is the only identifier sent.
//  - The injury CATEGORY may only be used to avoid or swap exercises, never for rehab/treatment.
import type { AgeBand, Equipment, Experience, Goal, InjuryCategory } from './schema.ts';

export interface PromptInput {
  requestId: string;
  goal: Goal;
  experience: Experience;
  equipment: Equipment[];
  daysPerWeek: number;
  sessionMinutes: number;
  ageBand: AgeBand;
  injuryCategory: InjuryCategory;
}

export interface MessagesRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: { role: 'user'; content: string }[];
  metadata: { user_id: string };
  temperature: number;
}

const OUTPUT_FORMAT = `Reply with ONE JSON object and nothing else:
{"days":[{"day":"mon|tue|wed|thu|fri|sat|sun","title":string,"focus":string,"duration_min":integer,"rest":boolean,
"exercises":[{"name":string,"sets":integer,"target":string,"notes":string}]}],
"swaps":[{"avoid":string,"instead":string}]}
Use exactly the requested number of training days; other days are rest days with no exercises.`;

const BASE_RULES = `You write general strength and conditioning plans for a fitness app.
Rules:
- This is general fitness guidance, not medical advice. Never diagnose, never give treatment, rehab or physical-therapy plans, and never mention medication.
- If an injury category is given, use it ONLY to leave out or swap exercises that load that area, and list each swap in "swaps". Do not add exercises meant to treat or heal it.
- Never give calorie targets, diets, fasting, weigh-ins, body-weight or body-shape goals, or exercise meant to "burn off" food.
- Never comment on how anyone's body looks. Keep language neutral and encouraging.
- Keep volume appropriate for the stated experience level and session length.`;

const MINOR_RULES = `The user is 16 or 17 years old. Additional rules:
- No weight-loss, fat-loss, cutting or calorie content of any kind.
- No bulking, body-size or weight targets, no calorie-surplus advice, and no supplement suggestions. "Build muscle" means strength and performance, not size or mass.
- Conservative loads, technique first, no maximal (1-rep max) testing.`;

export function buildPlanRequest(input: PromptInput, model: string): MessagesRequest {
  // Allowlist copy: adding a field here is a legal change (Counsel's consent text lists exactly these).
  const facts = {
    request_id: input.requestId,
    goal: input.goal,
    experience: input.experience,
    equipment: input.equipment,
    training_days_per_week: input.daysPerWeek,
    session_minutes: input.sessionMinutes,
    age_range: input.ageBand === '16_17' ? '16-17' : '18+',
    injury_category: input.injuryCategory,
  };
  return {
    model,
    max_tokens: 4000,
    temperature: 0.4,
    system: [BASE_RULES, input.ageBand === '16_17' ? MINOR_RULES : '', OUTPUT_FORMAT].filter(Boolean).join('\n\n'),
    messages: [{ role: 'user', content: `Build a one-week training plan for:\n${JSON.stringify(facts)}` }],
    metadata: { user_id: input.requestId },
  };
}
