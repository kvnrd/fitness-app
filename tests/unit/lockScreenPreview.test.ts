import test from 'node:test';
import assert from 'node:assert/strict';
import { messageLockScreenPreview } from '../../src/settings/lockScreenPreview.ts';

test('16–17 lock-screen previews never include parent or coach message text', () => {
  assert.equal(messageLockScreenPreview('message', true, 'See you after school at the gym'), 'New message');
  assert.ok(!messageLockScreenPreview('message', true, 'See you after school at the gym').includes('school'));
});

test('adult message previews may show the body, and other kinds are unchanged', () => {
  assert.equal(messageLockScreenPreview('message', false, 'See you after school at the gym'), 'See you after school at the gym');
  assert.equal(messageLockScreenPreview('workout', true, 'Time to train'), 'Time to train');
  assert.equal(messageLockScreenPreview('plan', true, 'Your plan is ready'), 'Your plan is ready');
});
