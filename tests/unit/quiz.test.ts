import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADULT_QUIZ_GOALS,
  TEEN_QUIZ_GOALS,
  emptyQuiz,
  mapEquipment,
  quizComplete,
  toPlanRequest,
  toggleEquipment,
  toggleGoal,
} from '../../src/ai/quiz.ts';

test('teen quiz omits lose-fat and size targets; includes Build muscle', () => {
  assert.ok(!TEEN_QUIZ_GOALS.some((g) => g.id === 'lose_fat'));
  assert.ok(ADULT_QUIZ_GOALS.some((g) => g.id === 'lose_fat' && g.label === 'Lose fat'));
  assert.deepEqual(
    TEEN_QUIZ_GOALS.map((g) => g.label),
    ['Strength', 'Hybrid', 'Hyrox', 'Endurance', 'Build muscle'],
  );
  assert.ok(TEEN_QUIZ_GOALS.every((g) => !/weight|calorie|supplement|bulk|size|fat/i.test(g.label)));
});

test('up to two goals; equipment maps to schema enums; complete quiz builds a request', () => {
  const allowed = ADULT_QUIZ_GOALS;
  let goals = toggleGoal([], 'build_strength', allowed);
  goals = toggleGoal(goals, 'lose_fat', allowed);
  goals = toggleGoal(goals, 'hybrid', allowed); // evicts the oldest when a third is added
  assert.deepEqual(goals, ['lose_fat', 'hybrid']);
  goals = toggleGoal(goals, 'lose_fat', allowed);
  assert.deepEqual(goals, ['hybrid']);

  assert.deepEqual(mapEquipment(['bodyweight']), ['none']);
  const mixed = mapEquipment(['bodyweight', 'rower']);
  assert.ok(mixed.includes('cardio_machine'));
  assert.ok(!mixed.includes('none'));
  assert.ok(mapEquipment(['full_gym']).includes('barbell'));

  let s = emptyQuiz();
  assert.equal(quizComplete(s), false);
  s = {
    ...s,
    goals: ['hybrid', 'build_strength'],
    experience: 'intermediate',
    equipment: toggleEquipment([], 'full_gym'),
    daysPerWeek: 4,
    sessionMinutes: 50,
    injury: 'knee',
  };
  assert.equal(quizComplete(s), true);
  const req = toPlanRequest(s);
  assert.ok(req);
  assert.equal(req.goal, 'hybrid'); // first pick is sent
  assert.equal(req.daysPerWeek, 4);
  assert.equal(req.sessionMinutes, 50);
  assert.equal(req.experience, 'intermediate');
});
