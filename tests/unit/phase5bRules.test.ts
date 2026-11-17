import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TEEN_NO_GOAL_WEIGHT_OR_LOSS_ADVICE,
  TEEN_NO_LOSS_CELEBRATIONS,
  TEEN_SUPPORT_LINK,
  teenAllowsGoalWeightOrLossAdvice,
  teenAllowsLossCelebrations,
  teenSupportLinkText,
  TEEN_WEIGHT_SUPPORT_LINK_TEXT,
} from '../../src/progress/phase5bFlags.ts';
import { teenMayHaveWeightGoal, teenChartSupportLink } from '../../src/progress/teenWeightPolicy.ts';
import { mayUseTeenBodyWeightInCalculations, allowTeenWeight } from '../../src/progress/teenWeightPolicy.ts';
import { e1rmEstimate } from '../../src/progress/e1rm.ts';
import {
  recapStreakLine,
  recapStreakCount,
  plannedWorkoutStreak,
  buildWorkoutRecap,
  type PlannedWeek,
} from '../../src/progress/workoutRecap.ts';
import { privacyPhotosRow } from '../../src/progress/privacyPhotosRow.ts';
import { addPhotosEntry } from '../../src/progress/addPhotosRoute.ts';
import { TEEN_PHOTOS_AVAILABLE_AT_18, TEEN_PHOTOS_AVAILABLE_AT_18_A11Y } from '../../src/progress/phase5bCopy.ts';
import { COACH_TERMS, coachTermsAcceptanceCounts } from '../../src/legal/text.ts';
import { COACH_TERMS_DOC } from '../../src/legal/policies/policies.generated.ts';

test('the three optional teen flags are off, and both states are tested', () => {
  assert.equal(TEEN_NO_GOAL_WEIGHT_OR_LOSS_ADVICE, false);
  assert.equal(TEEN_NO_LOSS_CELEBRATIONS, false);
  assert.equal(TEEN_SUPPORT_LINK, false);
  assert.equal(teenAllowsGoalWeightOrLossAdvice(), true);
  assert.equal(teenAllowsLossCelebrations(), true);
  assert.equal(teenSupportLinkText(), null);
  assert.equal(teenMayHaveWeightGoal(), true);
  assert.equal(teenChartSupportLink(), null);

  assert.equal(teenAllowsGoalWeightOrLossAdvice(true), false);
  assert.equal(teenAllowsLossCelebrations(true), false);
  assert.equal(teenSupportLinkText(true), TEEN_WEIGHT_SUPPORT_LINK_TEXT);
  assert.equal(teenAllowsGoalWeightOrLossAdvice(false), true);
  assert.equal(teenAllowsLossCelebrations(false), true);
  assert.equal(teenSupportLinkText(false), null);
});

test('fixed: nothing is calculated from a teen body weight, and teens get no e1RM from body-weight loads', () => {
  assert.equal(mayUseTeenBodyWeightInCalculations(), false);
  assert.equal(allowTeenWeight('volume'), false);
  assert.equal(allowTeenWeight('pr'), false);
  assert.equal(allowTeenWeight('calculation'), false);
  const fromBody = e1rmEstimate(0, 8, { isMinor: true, bodyweightLift: true });
  assert.equal(fromBody, null);
  const loaded = e1rmEstimate(185, 5, { isMinor: true, bodyweightLift: false });
  assert.ok(loaded);
  assert.equal(loaded.estimated, true);
  assert.equal(loaded.label, 'Est. 1RM');
  assert.equal(Math.round(loaded.lb), 216);
});

const plannedHit = (n: number, planned = ['mon', 'wed'], completed = ['mon', 'wed']): PlannedWeek[] =>
  Array.from({ length: n }, (_, i) => ({
    weekStart: `2026-10-${String(5 + i * 7).padStart(2, '0')}`,
    plannedDays: planned,
    completedDays: completed,
  }));

test('streak UI: n < 2 shows nothing; n ≥ 2 uses the same planned-workouts strings for teens and adults', () => {
  assert.equal(recapStreakLine(0), null);
  assert.equal(recapStreakLine(1), null);

  const n2 = recapStreakLine(2);
  assert.deepEqual(n2, {
    title: '2-week streak',
    body: 'You’ve hit your planned workouts 2 weeks in a row.',
  });
  assert.equal(n2!.body.charCodeAt(3), 0x2019);

  const threePlanned = plannedHit(3);
  assert.equal(plannedWorkoutStreak(threePlanned), 3);
  assert.equal(recapStreakCount(threePlanned), 3);
  assert.deepEqual(recapStreakLine(3), {
    title: '3-week streak',
    body: 'You’ve hit your planned workouts 3 weeks in a row.',
  });

  // Partial weeks (at least one workout, but not the full plan) do not count.
  const partial: PlannedWeek[] = [
    { weekStart: '2026-10-05', plannedDays: ['mon', 'wed', 'fri'], completedDays: ['mon'] },
    { weekStart: '2026-10-12', plannedDays: ['mon', 'wed', 'fri'], completedDays: ['wed'] },
    { weekStart: '2026-10-19', plannedDays: ['mon', 'wed', 'fri'], completedDays: ['fri'] },
    { weekStart: '2026-10-26', plannedDays: ['mon', 'wed', 'fri'], completedDays: ['mon'] },
  ];
  assert.equal(plannedWorkoutStreak(partial), 0);
  assert.equal(recapStreakCount(partial), 0);
  assert.equal(recapStreakLine(recapStreakCount(partial)), null);

  const twoHit = plannedHit(2);
  const adult = buildWorkoutRecap({ isMinor: false, sets: [], weeks: twoHit });
  const teen = buildWorkoutRecap({ isMinor: true, sets: [], weeks: twoHit });
  assert.deepEqual(adult.streakLine, teen.streakLine);
  assert.deepEqual(teen.streakLine, {
    title: '2-week streak',
    body: 'You’ve hit your planned workouts 2 weeks in a row.',
  });

  const oneHit = plannedHit(1);
  const adultOne = buildWorkoutRecap({ isMinor: false, sets: [], weeks: oneHit });
  const teenOne = buildWorkoutRecap({ isMinor: true, sets: [], weeks: oneHit });
  assert.equal(adultOne.streakLine, null);
  assert.equal(teenOne.streakLine, null);
  assert.equal(adultOne.streakWeeks, teenOne.streakWeeks);
});

test('16–17 Progress photos row is disabled, with no chevron and no action', () => {
  const row = privacyPhotosRow({ isMinor: true, photoOptedIn: false });
  assert.equal(row.state, 'available_at_18');
  assert.equal(row.subtitle, TEEN_PHOTOS_AVAILABLE_AT_18);
  assert.equal(row.statusCopy, 'Available when you turn 18.');
  assert.equal(row.accessibilityLabel, TEEN_PHOTOS_AVAILABLE_AT_18_A11Y);
  assert.deepEqual(row.accessibilityState, { disabled: true });
  assert.equal(row.disabled, true);
  assert.equal(row.showChevron, false);
  assert.equal(row.opensOptIn, false);
  assert.equal(row.opensPicker, false);
  assert.equal(row.opensSettings, false);
  assert.deepEqual(addPhotosEntry({ isMinor: true, photoOptedIn: false }), { step: 'hidden_until_18' });
});

test('Coach Terms version and hash match the bundled body', () => {
  assert.equal(COACH_TERMS.version, 'coach-terms-v0.1-draft');
  assert.equal(COACH_TERMS.hash, COACH_TERMS_DOC.sha256);
  assert.match(COACH_TERMS.hash, /^[0-9a-f]{64}$/);
  assert.equal(coachTermsAcceptanceCounts(COACH_TERMS.version, COACH_TERMS.hash), true);
  assert.equal(coachTermsAcceptanceCounts('v0.1-draft', COACH_TERMS.hash), false);
  assert.equal(coachTermsAcceptanceCounts(COACH_TERMS.version, null), false);
});
