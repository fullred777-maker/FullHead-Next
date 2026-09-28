import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresInstalledApp } from '../src/domain/accessPolicy.js';

test('browser access is enabled only for the isolated Next test environment', () => {
  assert.equal(requiresInstalledApp('next-testing'), false);
  assert.equal(requiresInstalledApp('production'), true);
  assert.equal(requiresInstalledApp(undefined), true);
  assert.equal(requiresInstalledApp(''), true);
});
