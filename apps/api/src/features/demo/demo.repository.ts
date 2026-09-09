import { Prisma } from '../../../prisma/generated/client.js';
import { restoreCanonicalDemoData } from '../../../prisma/seed.js';
import { prisma } from '../../config/prisma.js';

const DEMO_RESET_LOCK_ID = 3948271;

export async function restoreDemoOwnerData(ownerId: string): Promise<boolean> {
  return await prisma.$transaction(
    async (transaction) => {
      const lock = await transaction.$queryRawUnsafe<{ acquired: boolean }[]>(
        `SELECT pg_try_advisory_xact_lock(${String(DEMO_RESET_LOCK_ID)}) AS acquired`,
      );
      if (!lock[0]?.acquired) return false;

      await restoreCanonicalDemoData(transaction, ownerId);
      return true;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
