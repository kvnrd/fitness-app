import type { AiPlan } from '../aiPlan';
import type { QuizState } from '../quiz';

/** Fixture used by the preview registry (Hybrid Strength, knee-category swaps). */
export const SAMPLE_PLAN: AiPlan = {
  days: [
    {
      day: 'mon',
      title: 'Lower strength',
      focus: 'lower',
      duration_min: 50,
      rest: false,
      exercises: [
        { name: 'Box squat', sets: 4, target: '5', notes: 'Replaces back squat' },
        { name: 'Step-up', sets: 3, target: '8', notes: 'Capped at knee height' },
        { name: 'RDL', sets: 3, target: '8', notes: '' },
        { name: 'Leg press', sets: 3, target: '10', notes: '' },
        { name: 'Calf raise', sets: 3, target: '12', notes: '' },
      ],
    },
    {
      day: 'tue',
      title: 'Engine intervals',
      focus: 'engine',
      duration_min: 40,
      rest: false,
      exercises: [{ name: 'Row 6 × 500 m', sets: 6, target: '500 m', notes: '' }],
    },
    { day: 'wed', title: 'Rest', focus: 'rest', duration_min: 0, rest: true, exercises: [] },
    {
      day: 'thu',
      title: 'Upper push',
      focus: 'push',
      duration_min: 50,
      rest: false,
      exercises: [
        { name: 'Bench press', sets: 4, target: '5', notes: '' },
        { name: 'Overhead press', sets: 3, target: '6', notes: '' },
        { name: 'Weighted dip', sets: 3, target: '8', notes: '' },
        { name: 'DB fly', sets: 3, target: '12', notes: '' },
        { name: 'Tricep extension', sets: 3, target: '12', notes: '' },
        { name: 'Face pull', sets: 3, target: '15', notes: '' },
      ],
    },
    { day: 'fri', title: 'Rest', focus: 'rest', duration_min: 0, rest: true, exercises: [] },
    {
      day: 'sat',
      title: 'Full body',
      focus: 'full',
      duration_min: 50,
      rest: false,
      exercises: [
        { name: 'Box squat', sets: 3, target: '5', notes: 'Replaces back squat' },
        { name: 'Step-up', sets: 3, target: '8', notes: 'Capped at knee height' },
        { name: 'Press', sets: 3, target: '8', notes: '' },
        { name: 'Zone 2 bike', sets: 1, target: '20 min', notes: '' },
      ],
    },
    { day: 'sun', title: 'Rest', focus: 'rest', duration_min: 0, rest: true, exercises: [] },
  ],
  swaps: [
    { avoid: 'Back squat', instead: 'Box squat' },
    { avoid: 'Jumping lunges', instead: 'Step-ups capped at knee height' },
  ],
};

export const SAMPLE_SWAP_NOTE =
  'Box squat replaces back squat. No jumping lunges. Step-ups capped at knee height. We only used the category — not notes — to make these swaps. This isn’t a rehab plan.';

export const SAMPLE_QUIZ: QuizState = {
  goals: ['hybrid', 'build_strength'],
  experience: 'intermediate',
  equipment: ['full_gym', 'rower'],
  daysPerWeek: 4,
  sessionMinutes: 50,
  injury: 'knee',
};

export const SAMPLE_REST = 'Wed, Fri, Sun · rest or easy walk';
