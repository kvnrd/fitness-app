/**
 * Health-screen questions and clearance copy. Our own plain-language draft, never labeled PAR-Q+.
 * [COUNSEL] / [ATTORNEY] — legal/phase4-review.md. Parent wording inserts the teen's first name.
 */
export const HEALTH_SCREEN_VERSION = 'health-screen-2026-11-16-reword-draft';
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
  'Has a doctor told you that you have heart disease or high blood pressure?',
  'Does your chest hurt, feel tight, or feel pressure while you rest, go about your day, or work out?',
  "In the past year, have you fainted, or felt so dizzy that you couldn't stay steady on your feet?",
  'Do you have any other ongoing health condition that a doctor has diagnosed?',
  'Do you take prescription medicine for an ongoing health condition?',
  'Is there a problem with a bone, joint, muscle, or tendon that training could make worse?',
  'Has a doctor told you that you need medical supervision when you exercise?',
] as const;

export const HEALTH_QUESTION_COUNT = ADULT_QUESTIONS.length;

/** Adult wording, or parent-together wording with the teen's first name substituted. */
export function healthQuestions(teenName?: string): string[] {
  if (!teenName) return [...ADULT_QUESTIONS];
  return [
    `Has a doctor told ${teenName} that ${teenName} has heart disease or high blood pressure?`,
    `Does ${teenName}'s chest hurt, feel tight, or feel pressure while resting, going about the day, or working out?`,
    `In the past year, has ${teenName} fainted, or felt so dizzy that ${teenName} couldn't stay steady?`,
    `Does ${teenName} have any other ongoing health condition that a doctor has diagnosed?`,
    `Does ${teenName} take prescription medicine for an ongoing health condition?`,
    `Is there a problem with ${teenName}'s bone, joint, muscle, or tendon that training could make worse?`,
    `Has a doctor told ${teenName} that ${teenName} needs medical supervision when exercising?`,
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
  'An AI plan checks your health-screen answers and uses any injury you add to avoid or swap exercises. Those answers are health data, so Health data has to be on first. From your health info, Anthropic, our AI provider, receives only an injury category, never your notes, measurements, name, or email. If you leave it off, you can still use free logging, or train with a coach.';
export const HEALTH_SWITCH_CTA = 'Review Health data';
export const HEALTH_SWITCH_DISMISS = 'Not now';

export const parentHealthSwitchSub = 'An AI plan needs it on, from you and your parent.';

/** Shown to the teen. The body no longer interpolates a name (Counsel phase4-build-answers B). */
export function parentHealthSwitchBody(_teenName?: string): string {
  return (
    'An AI plan checks your health-screen answers and uses any injury you add to avoid or swap exercises. Those answers are health data, so you and your parent both need to turn Health data on first. From your health info, Anthropic, our AI provider, receives only an injury category, never your notes, measurements, name, or email. If you leave it off, you can still use free logging, or train with a coach.'
  );
}
