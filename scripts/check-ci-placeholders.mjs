#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fillTokens = ['<', '(FILL|OPTIONAL)', '[:>]'].join('');
const templateHeader = `^(# )?${'TEMPLATE'} `;
const templateStatus = `^${'status:'} ${'template'}$`;
const pattern = `${fillTokens}|${templateHeader}|${templateStatus}`;
const excludedPaths = [':!.agents/', ':!.claude/', ':!*.template.*'];

export function checkPlaceholders(rootDirectory = repositoryRoot) {
  const result = spawnSync('git', ['grep', '-nE', pattern, '--', '.', ...excludedPaths], {
    cwd: rootDirectory,
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.error) throw result.error;
  if (result.status === 1) return [];
  if (result.status !== 0) {
    throw new Error(result.stderr || `git grep exited with ${String(result.status)}`);
  }

  return (result.stdout ?? '').trimEnd().split(/\r?\n/);
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
  try {
    const findings = checkPlaceholders();
    if (findings.length > 0) {
      console.error('CI template placeholders remain in tracked files:');
      findings.forEach((finding) => console.error(`- ${finding}`));
      process.exitCode = 1;
    } else {
      console.log('CI placeholder check passed.');
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
