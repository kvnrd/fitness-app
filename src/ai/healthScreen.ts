/**
 * Health-screen questions and clearance copy. Our own plain-language draft, never labeled PAR-Q+.
 * [COUNSEL] / [ATTORNEY] — legal/phase4-review.md. Parent wording inserts the teen's first name.
 */
export const HEALTH_SCREEN_VERSION = 'health-screen-2026-11-16-draft';
export const CLEARANCE_VERSION = 'health-clearance-2026-11-16-draft';

export const HEALTH_SCREEN_TITLE = 'Health screen';
export const HEALTH_SCREEN_SUB = 'A few yes-or-no questions before we can build an AI plan.';
export const HEALTH_SCREEN_HINT =
  'If any answer is yes, we ask you to get doctor clearance before an AI plan is created.';

export const parentHealthScreenSub = (teenName: string) =>
  `Please complete these together. They’re about ${teenName}, not you.`;

export const parentHealthScreenHint = (teenName: string) =>
  `If any answer is yes, we ask you to get doctor clearance before ${teenName} starts an AI plan.`;

const ADULT_QUESTIONS = [
  'Has a doctor ever said you have a heart condition or high blood pressure?',
  'Do you get chest pain at rest, during daily activities, or when you exercise?',
  'In the last 12 months, have you lost your balance because of dizziness, or have you lost consciousness?',
  'Have you been diagnosed with another long-term medical condition?',
  'Are you taking prescribed medication for a long-term condition?',
  'Do you have a bone, joint, or soft-tissue problem that could be made worse by exercise?',
  'Has a doctor ever said you should only exercise under medical supervision?',
] as const;

export const HEALTH_QUESTION_COUNT = ADULT_QUESTIONS.length;

/** Adult wording, or parent-together wording with the teen's first name substituted. */
export function healthQuestions(teenName?: string): string[] {
  if (!teenName) return [...ADULT_QUESTIONS];
  return [
    `Has a doctor ever said ${teenName} has a heart condition or high blood pressure?`,
    `Does ${teenName} get chest pain at rest, during daily activities, or when exercising?`,
    `In the last 12 months, has ${teenName} lost balance because of dizziness, or lost consciousness?`,
    `Has ${teenName} been diagnosed with another long-term medical condition?`,
    `Is ${teenName} taking prescribed medication for a long-term condition?`,
    `Does ${teenName} have a bone, joint, or soft-tissue problem that could be made worse by exercise?`,
    `Has a doctor ever said ${teenName} should only exercise under medical supervision?`,
  ];
}

export type HealthAnswer = boolean | null;
export type HealthAnswers = HealthAnswer[];

export const emptyHealthAnswers = (): HealthAnswers => Array.from({ length: HEALTH_QUESTION_COUNT }, () => null);

export const allAnswered = (answers: HealthAnswers): boolean =>
  answers.length === HEALTH_QUESTION_COUNT && answers.every((a) => a === true || a === false);

export const anyYes = (answers: HealthAnswers): boolean => answers.some((a) => a === true);

export const setHealthAnswer = (answers: HealthAnswers, index: number, value: boolean): HealthAnswers =>
  answers.map((a, i) => (i === index ? value : a));

/** JSON string written to health-record (encrypted). Answers only — no name, notes, or free text. */
export function serializeHealthScreen(answers: HealthAnswers): string {
  if (!allAnswered(answers)) throw new Error('incomplete');
  return JSON.stringify({ version: HEALTH_SCREEN_VERSION, answers: answers.map((a) => a === true) });
}

export const CLEARANCE_TITLE = 'Talk to a doctor first';
export const CLEARANCE_SUB = "This isn’t medical advice, and the screen isn’t a diagnosis.";
export const CLEARANCE_FOOTER =
  'You can still use free logging, or train with a coach. We recommend getting clearance. AI planning stays off until this is confirmed.';
export const CLEARANCE_HINT = 'Check the box to continue.';
export const CLEARANCE_ACK = 'I confirm a doctor has cleared me to train.';

export const parentClearanceAck = (teenName: string) => `I confirm a doctor has cleared ${teenName} to train.`;

export function clearanceBody(teenName?: string): string {
  if (teenName) {
    return (
      `Because of an answer on the health screen, we can’t build an AI plan until a doctor has cleared ${teenName} to train. ` +
      `When ${teenName} has that clearance, come back and confirm.`
    );
  }
  return (
    "Because of an answer on the health screen, we can’t build an AI plan until a doctor has cleared you to train. " +
    'When you have that clearance, come back and confirm.'
  );
}

export const HEALTH_SWITCH_TITLE = 'Health data is off';
export const HEALTH_SWITCH_SUB = 'An AI plan needs it on.';
export const HEALTH_SWITCH_BODY =
  'An AI plan uses answers from the health screen, and those answers are health data. ' +
  'To build an AI plan, turn Health data on. If you leave it off, you can still use free logging, or train with a coach.';
export const HEALTH_SWITCH_CTA = 'Turn on Health data';
export const HEALTH_SWITCH_DISMISS = 'Not now';

export const parentHealthSwitchSub = 'An AI plan needs it on — from both of you.';

export function parentHealthSwitchBody(teenName: string): string {
  return (
    `An AI plan uses answers from the health screen, and those answers are health data. ` +
    `You and your parent both need to turn Health data on before we can build one for ${teenName}. ` +
    `If you leave it off, ${teenName} can still use free logging, or train with a coach.`
  );
}
