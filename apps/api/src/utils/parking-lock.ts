import type { Prisma } from '../../prisma/generated/client.js';

export const lockParkingRow = async (
  transaction: Prisma.TransactionClient,
  parkingId: string,
): Promise<void> => {
  await transaction.$queryRaw<{ id: string }[]>`
    SELECT "id"
    FROM "Parking"
    WHERE "id" = ${parkingId}
    FOR UPDATE
  `;
};
