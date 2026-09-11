import 'dotenv/config';

import { prisma } from '../config/prisma.js';
import { cleanupExpiredDemoOwners } from '../features/demo/demo.repository.js';

const main = async (): Promise<void> => {
  const removed = await prisma.$transaction((transaction) =>
    cleanupExpiredDemoOwners(transaction, new Date()),
  );
  console.log(
    `Demo cleanup removed ${String(removed)} expired DEMO owner${removed === 1 ? '' : 's'}.`,
  );
};

void main()
  .catch((error: unknown) => {
    console.error('Demo cleanup failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
