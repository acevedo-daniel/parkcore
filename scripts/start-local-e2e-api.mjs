#!/usr/bin/env node

import { createWriteStream, mkdirSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const logDirectory = path.join(repositoryRoot, 'apps', 'web', 'test-results', 'local-real-stack');
const logPath = path.join(logDirectory, 'api.log');
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

mkdirSync(logDirectory, { recursive: true });
const logStream = createWriteStream(logPath, { flags: 'w' });
let activeProcess;
let logClosed = false;

function closeLog() {
  if (!logClosed) {
    logClosed = true;
    logStream.end();
  }
}

function runCommand(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(pnpmCommand, args, {
      cwd: repositoryRoot,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.pipe(logStream, { end: false });
    child.stderr.pipe(logStream, { end: false });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Command terminated with ${signal}: pnpm ${args.join(' ')}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

async function startApi() {
  for (const args of [
    ['--filter', '@parkcore/api', 'db:setup'],
    ['--filter', '@parkcore/api', 'build'],
  ]) {
    const exitCode = await runCommand(args);
    if (exitCode !== 0) {
      process.exitCode = exitCode;
      closeLog();
      return;
    }
  }

  activeProcess = spawn(pnpmCommand, ['--filter', '@parkcore/api', 'start'], {
    cwd: repositoryRoot,
    env: process.env,
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  activeProcess.stdout.pipe(logStream, { end: false });
  activeProcess.stderr.pipe(logStream, { end: false });

  activeProcess.once('error', (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  activeProcess.once('exit', (code) => {
    process.exitCode = code ?? 1;
    closeLog();
  });
}

function stopApi() {
  if (activeProcess && !activeProcess.killed) {
    activeProcess.kill('SIGTERM');
  }
}

process.once('SIGINT', stopApi);
process.once('SIGTERM', stopApi);

void startApi().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  closeLog();
});
