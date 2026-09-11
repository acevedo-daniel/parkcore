import { Prisma, type PrismaClient, type User } from '../../../prisma/generated/client.js';
import { env } from '../../config/env.js';
import {
  CANONICAL_REFERENCE_TIME,
  CANONICAL_TIMEZONE,
  restoreCanonicalScenario,
} from '../../data/canonical-scenario.js';
import { DEMO_TTL_MS } from './demo.constants.js';
import { prisma } from '../../config/prisma.js';

const DEMO_RESET_LOCK_ID = 3948271;

type DemoCreationClient = Pick<PrismaClient, 'user' | 'parking' | 'vehicle' | 'parkingSession'>;

export async function cleanupExpiredDemoOwners(
  client: DemoCreationClient | Prisma.TransactionClient,
  referenceTime: Date,
): Promise<number> {
  const expired = await client.user.findMany({
    where: { kind: 'DEMO', demoExpiresAt: { lt: referenceTime } },
    orderBy: [{ demoExpiresAt: 'asc' }, { id: 'asc' }],
    take: env.DEMO_CLEANUP_BATCH_SIZE,
    select: { id: true },
  });
  if (expired.length === 0) return 0;

  const result = await client.user.deleteMany({
    where: { kind: 'DEMO', id: { in: expired.map((user) => user.id) } },
  });
  return result.count;
}

export async function createDemoSandbox(): Promise<User> {
  return await prisma.$transaction(async (transaction) => {
    await cleanupExpiredDemoOwners(transaction, new Date());

    const createdAt = new Date(Math.floor(Date.now() / 1000) * 1000);
    const demoExpiresAt = new Date(createdAt.getTime() + DEMO_TTL_MS);
    const user = await transaction.user.create({
      data: {
        email: null,
        passwordHash: null,
        kind: 'DEMO',
        name: 'Demo',
        lastName: 'Visitor',
        timezone: CANONICAL_TIMEZONE,
        demoExpiresAt,
        createdAt,
      },
    });

    await restoreCanonicalScenario(transaction, user.id, createdAt);
    return user;
  });
}

export async function restoreDemoOwnerData(ownerId: string): Promise<boolean> {
  return await prisma.$transaction(
    async (transaction) => {
      const lock = await transaction.$queryRawUnsafe<{ acquired: boolean }[]>(
        `SELECT pg_try_advisory_xact_lock(${String(DEMO_RESET_LOCK_ID)}) AS acquired`,
      );
      if (!lock[0]?.acquired) return false;

      await restoreCanonicalScenario(transaction, ownerId, new Date(CANONICAL_REFERENCE_TIME));
      return true;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
