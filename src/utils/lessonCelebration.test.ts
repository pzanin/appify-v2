import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldCelebrateLesson } from './lessonCelebration';

test('lesson celebration override respects the gamification master switch', () => {
  assert.equal(shouldCelebrateLesson({ enabled: false, enableCelebration: true }, { enableCelebration: true }), false);
  assert.equal(shouldCelebrateLesson({ enabled: true, enableCelebration: false }, { enableCelebration: true }), true);
  assert.equal(shouldCelebrateLesson({ enabled: true, enableCelebration: true }, { enableCelebration: false }), false);
  assert.equal(shouldCelebrateLesson({ enabled: true, enableCelebration: true }, undefined), true);
  assert.equal(shouldCelebrateLesson({ enabled: true, enableCelebration: false }, undefined), false);
});
