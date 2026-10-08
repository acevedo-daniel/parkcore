import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProjectName, parseMappedPort, withCleanup } from './preflight.mjs';

test('parses Docker mapped ports and rejects invalid output', () => {
  assert.equal(parseMappedPort('127.0.0.1:49152\n'), 49152);
  assert.equal(parseMappedPort('[::1]:54321\n'), 54321);
  assert.throws(() => parseMappedPort('no published port'), /Could not parse/);
  assert.throws(() => parseMappedPort('127.0.0.1:70000'), /invalid PostgreSQL port/);
});

test('creates unique valid Compose project names', () => {
  assert.equal(createProjectName(1234, 'a1b2c3d4'), 'parkcore-preflight-1234-a1b2c3d4');
  assert.notEqual(createProjectName(1234, 'a1b2c3d4'), createProjectName(1234, 'e5f6a7b8'));
});

test('runs cleanup when a preflight stage fails', async () => {
  let cleaned = false;

  await assert.rejects(
    withCleanup(
      async () => {
        throw new Error('injected stage failure');
      },
      async () => {
        cleaned = true;
      },
    ),
    /injected stage failure/,
  );

  assert.equal(cleaned, true);
});
