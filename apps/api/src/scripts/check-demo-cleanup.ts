import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const packageManager = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const timezone = 'America/Argentina/Buenos_Aires';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function runCleanupCommand(): void {
  const result = spawnSync(packageManager, ['--filter', '@parkcore/api', 'demo:cleanup'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: process.env,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;

  assert(result.status === 0, `demo:cleanup exited with ${String(result.status ?? 'no status')}`);
}

async function main(): Promise<void> {
  const batchSize = env.DEMO_CLEANUP_BATCH_SIZE;
  const existingExpired = await prisma.user.count({
    where: { kind: 'DEMO', demoExpiresAt: { lt: new Date() } },
  });
  assert(
    existingExpired === 0,
    'Cleanup verification requires a disposable database with no expired DEMO users.',
  );

  const suffix = randomUUID();
  const owner = await prisma.user.create({
    data: {
      email: `cleanup-check-owner-${suffix}@example.invalid`,
      passwordHash: 'cleanup-check-only',
      kind: 'OWNER',
      name: 'Cleanup Check',
      timezone,
    },
  });
  const showcase = await prisma.user.create({
    data: { kind: 'SHOWCASE', name: 'Cleanup Check', timezone },
  });
  const expiredIds: string[] = [];
  let activeDemoId: string | undefined;
  const expiredAt = new Date(Date.now() - 60_000);

  try {
    for (let index = 0; index <= batchSize; index += 1) {
      const expired = await prisma.user.create({
        data: { kind: 'DEMO', timezone, demoExpiresAt: expiredAt },
      });
      expiredIds.push(expired.id);
    }

    const activeDemo = await prisma.user.create({
      data: {
        kind: 'DEMO',
        timezone,
        demoExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    activeDemoId = activeDemo.id;

    runCleanupCommand();

    const remainingAfterFirstRun = await prisma.user.count({
      where: { id: { in: expiredIds } },
    });
    assert(
      remainingAfterFirstRun === 1,
      `Expected one expired DEMO user to remain after the bounded run, found ${String(remainingAfterFirstRun)}.`,
    );
    assert(
      (await prisma.user.findUnique({ where: { id: activeDemo.id } })) !== null,
      'Cleanup removed an unexpired DEMO user.',
    );
    assert(
      (await prisma.user.findUnique({ where: { id: owner.id } }))?.kind === 'OWNER',
      'Cleanup removed or changed an OWNER user.',
    );
    assert(
      (await prisma.user.findUnique({ where: { id: showcase.id } }))?.kind === 'SHOWCASE',
      'Cleanup removed or changed a SHOWCASE user.',
    );

    runCleanupCommand();

    const remainingAfterSecondRun = await prisma.user.count({
      where: { id: { in: expiredIds } },
    });
    assert(
      remainingAfterSecondRun === 0,
      `Expected the second bounded run to remove the remaining expired DEMO user, found ${String(remainingAfterSecondRun)}.`,
    );
    console.log(
      `Demo cleanup verification passed (batch ${String(batchSize)}; OWNER and SHOWCASE preserved).`,
    );
  } finally {
    await prisma.user.deleteMany({
      where: { id: { in: [owner.id, showcase.id, ...expiredIds, activeDemoId ?? ''] } },
    });
  }
}

void main()
  .catch((error: unknown) => {
    console.error('Demo cleanup verification failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
