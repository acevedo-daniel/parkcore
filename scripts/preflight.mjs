#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const composeFile = path.join(repositoryRoot, 'docker-compose.preflight.yml');
const packageManager = resolvePackageManager();
let isolatedEnvironmentPath;

function resolvePackageManager() {
  if (process.platform !== 'win32') return 'pnpm';
  for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
    const executable = path.join(directory, 'node_modules', 'pnpm', 'pnpm.exe');
    if (existsSync(executable)) return executable;
  }
  return 'pnpm.cmd';
}
const retainedEnvironmentKeys = new Set([
  'APPDATA',
  'COMSPEC',
  'COREPACK_HOME',
  'HOME',
  'HOMEDRIVE',
  'HOMEPATH',
  'LOCALAPPDATA',
  'PATH',
  'PATHEXT',
  'PNPM_HOME',
  'PROGRAMFILES',
  'PROGRAMFILES(X86)',
  'SYSTEMROOT',
  'TEMP',
  'TMP',
  'USERPROFILE',
  'WINDIR',
]);

export const createProjectName = (processId, randomPart) =>
  `parkcore-preflight-${String(processId)}-${randomPart}`.toLowerCase();

export function parseMappedPort(output) {
  const match = output.trim().match(/:(\d+)\s*$/);
  if (!match) throw new Error(`Could not parse the mapped PostgreSQL port from: ${output.trim()}`);
  const port = Number(match[1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Docker returned an invalid PostgreSQL port: ${match[1]}`);
  }
  return port;
}

export async function withCleanup(work, cleanup) {
  try {
    return await work();
  } finally {
    await cleanup();
  }
}

function childEnvironment(overrides = {}) {
  const environment = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (retainedEnvironmentKeys.has(key.toUpperCase())) environment[key] = value;
  }
  return {
    ...environment,
    CI: 'true',
    ...(isolatedEnvironmentPath ? { DOTENV_CONFIG_PATH: isolatedEnvironmentPath } : {}),
    ...overrides,
  };
}

function run(command, args, { cwd = repositoryRoot, env = {}, capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: childEnvironment(env),
      shell: process.platform === 'win32' && command.toLowerCase().endsWith('.cmd'),
      windowsHide: true,
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });
    let stdout = '';
    let stderr = '';

    if (capture) {
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
    }

    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      const detail = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n');
      reject(
        new Error(
          `${command} ${args.join(' ')} exited with ${code === null ? String(signal) : String(code)}${detail ? `\n${detail}` : ''}`,
        ),
      );
    });
  });
}

async function stage(label, work) {
  console.log(`\n== ${label} ==`);
  await work();
}

async function assertPortFree(port) {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function assertPrerequisites() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor !== 24) {
    throw new Error(`Node.js 24 is required; found ${process.versions.node}.`);
  }

  const manifest = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));
  const expectedPnpm = manifest.packageManager.split('@').at(-1);
  const actualPnpm = (await run(packageManager, ['--version'], { capture: true })).trim();
  if (actualPnpm !== expectedPnpm) {
    throw new Error(`pnpm ${expectedPnpm} is required; found ${actualPnpm}.`);
  }

  await run('docker', ['info', '--format', '{{.ServerVersion}}'], { capture: true });
  await run('docker', ['compose', 'version', '--short'], { capture: true });
  for (const port of [3000, 4173]) await assertPortFree(port);
}

const composeArguments = (projectName, ...args) => [
  'compose',
  '--file',
  composeFile,
  '--project-name',
  projectName,
  ...args,
];

async function startDatabases(projectName) {
  await run(
    'docker',
    composeArguments(projectName, 'up', '--detach', '--wait', '--wait-timeout', '60'),
  );
  const mappedPort = parseMappedPort(
    await run('docker', composeArguments(projectName, 'port', 'preflight-db', '5432'), {
      capture: true,
    }),
  );

  for (const databaseName of ['parkcore_api', 'parkcore_e2e', 'parkcore_production']) {
    await run(
      'docker',
      composeArguments(
        projectName,
        'exec',
        '--no-TTY',
        'preflight-db',
        'createdb',
        '-U',
        'parkcore',
        databaseName,
      ),
    );
  }

  return {
    api: `postgresql://parkcore:parkcore@127.0.0.1:${String(mappedPort)}/parkcore_api?schema=public`,
    e2e: `postgresql://parkcore:parkcore@127.0.0.1:${String(mappedPort)}/parkcore_e2e?schema=public`,
    production: `postgresql://parkcore:parkcore@127.0.0.1:${String(mappedPort)}/parkcore_production?schema=public`,
  };
}

const testEnvironment = (databaseUrl) => ({
  NODE_ENV: 'test',
  DATABASE_URL: databaseUrl,
  JWT_SECRET: 'parkcore-local-preflight-secret-12345678901234567890',
  JWT_EXPIRES_IN: '1h',
  CORS_ORIGINS: 'http://127.0.0.1:4173',
  PORT: '3000',
  LOG_LEVEL: 'error',
  LOG_PRETTY: 'false',
  ENABLE_API_DOCS: 'false',
  VITE_API_URL: 'http://127.0.0.1:3000',
});

const e2eEnvironment = (databaseUrl) => ({
  ...testEnvironment(databaseUrl),
  LOG_LEVEL: 'info',
  SEED_OWNER_EMAIL: 'owner@parkcore.dev',
  SEED_OWNER_PASSWORD: 'ParkCoreLocalPreflightSeed!123',
  SEED_REFERENCE_TIME: '2026-01-15T12:00:00.000Z',
});

const productionEnvironment = (databaseUrl) => ({
  DATABASE_URL: databaseUrl,
  NODE_ENV: 'production',
  PORT: '3000',
  JWT_SECRET: 'parkcore-local-preflight-production-secret-1234567890',
  JWT_EXPIRES_IN: '24h',
  CORS_ORIGINS: 'https://parkcore-app.vercel.app',
  LOG_LEVEL: 'info',
  LOG_PRETTY: 'false',
  ENABLE_API_DOCS: 'false',
  DEMO_CLEANUP_BATCH_SIZE: '1',
  PARKCORE_ARTIFACT_PRIVATE_VALUES:
    'preflight-seed-owner@example.invalid\nParkCoreLocalPreflightSeed!123',
  VITE_API_URL: 'https://parkcore-api.onrender.com',
});

async function waitForApi(server, url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Compiled API exited with ${server.exitCode}.`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      // The health endpoint is the readiness signal; continue until the bounded deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Compiled API did not become ready at ${url} within 30 seconds.`);
}

async function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('close', resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}

async function runProductionStartup(databaseUrl) {
  const environment = productionEnvironment(databaseUrl);
  const server = spawn(process.execPath, ['apps/api/dist/server.js'], {
    cwd: repositoryRoot,
    env: childEnvironment(environment),
    windowsHide: true,
    stdio: 'inherit',
  });
  server.once('error', (error) => {
    console.error(error);
  });
  try {
    await waitForApi(server, 'http://127.0.0.1:3000/healthz');
    await runPnpm(['--filter', '@parkcore/api', 'smoke:remote'], {
      ...environment,
      SMOKE_BASE_URL: 'http://127.0.0.1:3000',
      SMOKE_RETRIES: '10',
      SMOKE_TIMEOUT_MS: '5000',
    });
  } finally {
    await stopProcess(server);
  }
}

async function runPnpm(args, env = {}) {
  await run(packageManager, args, { env });
}

async function runPreflight() {
  await assertPrerequisites();
  const projectName = createProjectName(process.pid, randomBytes(4).toString('hex'));
  console.log(`Disposable Compose project: ${projectName}`);

  const environmentDirectory = await mkdtemp(path.join(os.tmpdir(), 'parkcore-preflight-env-'));
  isolatedEnvironmentPath = path.join(environmentDirectory, '.env');

  try {
    await writeFile(isolatedEnvironmentPath, '', 'utf8');
    await runPnpm(['install', '--frozen-lockfile']);
    await withCleanup(
      async () => {
        const databases = await startDatabases(projectName);
        const apiEnv = testEnvironment(databases.api);

        await stage('Quality', async () => {
          await run(process.execPath, ['scripts/check-ci-placeholders.mjs']);
          await runPnpm(['test:scripts']);
          await runPnpm(['text:check']);
          await runPnpm(['locales:check']);
          await runPnpm(['tokens:check']);
          await runPnpm(['format:check']);
          await runPnpm(['--filter', '@parkcore/api', 'prisma:generate'], apiEnv);
          await runPnpm(['--filter', '@parkcore/api-client', 'build']);
          await runPnpm(['lint']);
          await runPnpm(['typecheck']);
        });

        await stage('Tests / API', async () => {
          await runPnpm(['--filter', '@parkcore/api', 'db:setup'], apiEnv);
          await runPnpm(['--filter', '@parkcore/api', 'test:coverage'], apiEnv);
        });

        await stage('Tests / Web', async () => {
          await runPnpm(['--filter', '@parkcore/web', 'test:coverage'], apiEnv);
        });

        await stage('Contract', async () => {
          await runPnpm(['contract:check'], apiEnv);
        });

        await stage('E2E / Web prerequisites', async () => {
          await runPnpm(['--filter', '@parkcore/web', 'exec', 'playwright', 'install', 'chromium']);
        });

        await stage('E2E', async () => {
          const env = e2eEnvironment(databases.e2e);
          await runPnpm(['--filter', '@parkcore/api', 'db:setup'], env);
          await runPnpm(['--filter', '@parkcore/web', 'test:e2e:local'], env);
        });

        await stage('E2E / Web', async () => {
          await runPnpm(['--filter', '@parkcore/web', 'test:e2e:hardening'], {
            ...apiEnv,
            VITE_API_URL: 'http://127.0.0.1:3000',
          });
        });

        await stage('Production / audits', async () => {
          await runPnpm(['audit', '--prod']);
          await runPnpm(['audit', '--audit-level', 'high']);
        });

        await stage('Production', async () => {
          const env = productionEnvironment(databases.production);
          await runPnpm(['--filter', '@parkcore/api', 'prisma:migrate:deploy'], env);
          await runPnpm(['build'], env);
          await runPnpm(['--filter', '@parkcore/api', 'showcase:refresh'], env);
          await runPnpm(
            ['--filter', '@parkcore/api', 'exec', 'tsx', 'src/scripts/check-build-artifact.ts'],
            env,
          );
          await run(process.execPath, ['scripts/check-web-build-artifact.mjs'], { env });
          await runProductionStartup(databases.production);
          await runPnpm(['--filter', '@parkcore/api', 'demo:cleanup:check'], env);
        });
      },
      async () => {
        console.log('\nCleaning up the disposable PostgreSQL project.');
        await run('docker', composeArguments(projectName, 'down', '--volumes', '--remove-orphans'));
      },
    );
  } finally {
    isolatedEnvironmentPath = undefined;
    await rm(environmentDirectory, { recursive: true, force: true });
  }

  console.log('\nPreflight passed.');
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectExecution) {
  runPreflight().catch((error) => {
    console.error('\nPreflight failed.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
