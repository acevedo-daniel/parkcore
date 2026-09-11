import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const scannerPath = path.join(scriptDirectory, 'check-authored-text.mjs');

function runScanner() {
  return spawnSync(process.execPath, [scannerPath], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
}

test('passes when authored text is clean', () => {
  const result = runScanner();

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Authored text check passed/);
});

test('reports a forbidden code point with its file and line', () => {
  const fixtureName = `.text-check-fixture-${process.pid}.md`;
  const fixturePath = path.join(repositoryRoot, 'apps', fixtureName);
  const forbiddenCharacter = String.fromCodePoint(0x2014);

  try {
    writeFileSync(fixturePath, `clean line\nforbidden ${forbiddenCharacter} line\n`, 'utf8');
    const result = runScanner();
    const output = `${result.stdout}${result.stderr}`;

    assert.notEqual(result.status, 0);
    assert.match(output, new RegExp(`apps/${fixtureName.replaceAll('.', '\\.')}:2: U\\+2014`));
  } finally {
    unlinkSync(fixturePath);
  }
});

test('excludes generated and dependency content', () => {
  const generatedFixture = path.join(repositoryRoot, 'apps', 'dist', 'text-check-fixture.md');
  const lockfileFixture = path.join(repositoryRoot, 'apps', 'package-lock.json');
  const forbiddenCharacter = String.fromCodePoint(0x2014);

  try {
    mkdirSync(path.dirname(generatedFixture), { recursive: true });
    writeFileSync(generatedFixture, `generated ${forbiddenCharacter}\n`, 'utf8');
    writeFileSync(lockfileFixture, `lock ${forbiddenCharacter}\n`, 'utf8');
    const result = runScanner();

    assert.equal(result.status, 0, result.stderr);
  } finally {
    unlinkSync(generatedFixture);
    unlinkSync(lockfileFixture);
    try {
      rmdirSync(path.dirname(generatedFixture));
    } catch {
      // Keep an existing build directory untouched.
    }
  }
});
