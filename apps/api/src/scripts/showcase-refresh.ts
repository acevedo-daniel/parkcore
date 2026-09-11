import 'dotenv/config';

import { prisma } from '../config/prisma.js';
import { refreshCanonicalShowcase } from '../data/showcase.js';

const getReferenceTime = (): Date => {
  const configured = process.argv[2] ?? process.env.SHOWCASE_REFERENCE_TIME;
  if (!configured) return new Date();

  const referenceTime = new Date(configured);
  if (Number.isNaN(referenceTime.getTime())) {
    throw new Error('SHOWCASE_REFERENCE_TIME must be an ISO-8601 date-time');
  }
  return referenceTime;
};

const main = async (): Promise<void> => {
  const referenceTime = getReferenceTime();
  const scenario = await prisma.$transaction((transaction) =>
    refreshCanonicalShowcase(transaction, referenceTime),
  );
  console.log(
    `Showcase refreshed: ${String(scenario.facilities.length)} facilities and ${String(scenario.sessions.length)} sessions around ${referenceTime.toISOString()}.`,
  );
};

void main()
  .catch((error: unknown) => {
    console.error('Showcase refresh failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
