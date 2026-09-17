import {
  CANONICAL_SCENARIO_EXPECTATIONS,
  CANONICAL_TIMEZONE,
  buildCanonicalScenario,
  refreshCanonicalScenario,
  type CanonicalDatabaseClient,
  type CanonicalScenario,
} from './canonical-scenario.js';

export const CANONICAL_SHOWCASE_USER_ID = '00000000-0000-4000-8000-000000000020';

const upsertCanonicalShowcase = async (client: CanonicalDatabaseClient) =>
  await client.user.upsert({
    where: { id: CANONICAL_SHOWCASE_USER_ID },
    update: {
      email: null,
      passwordHash: null,
      kind: 'SHOWCASE',
      name: 'ParkCore',
      lastName: 'Showcase',
      phone: null,
      photoUrl: null,
      timezone: CANONICAL_TIMEZONE,
      demoExpiresAt: null,
    },
    create: {
      id: CANONICAL_SHOWCASE_USER_ID,
      email: null,
      passwordHash: null,
      kind: 'SHOWCASE',
      name: 'ParkCore',
      lastName: 'Showcase',
      timezone: CANONICAL_TIMEZONE,
    },
  });

export async function refreshCanonicalShowcase(
  client: CanonicalDatabaseClient,
  referenceTime: Date,
): Promise<CanonicalScenario> {
  const showcase = await upsertCanonicalShowcase(client);

  return await refreshCanonicalScenario(client, showcase.id, referenceTime);
}

export async function ensureCanonicalShowcase(
  client: CanonicalDatabaseClient,
  referenceTime: Date,
): Promise<CanonicalScenario> {
  const showcase = await upsertCanonicalShowcase(client);
  const expected = buildCanonicalScenario(showcase.id, referenceTime);
  const existingFacilities = await client.parking.findMany({
    where: { ownerId: showcase.id },
    select: { id: true, image: true, isActive: true, isListed: true },
  });
  const isCurrent =
    existingFacilities.length === CANONICAL_SCENARIO_EXPECTATIONS.facilities &&
    expected.facilities.every((facility) => {
      const existing = existingFacilities.find((item) => item.id === facility.id);
      if (!existing) return false;
      return (
        existing.image === facility.image &&
        existing.isActive === facility.isActive &&
        existing.isListed === facility.isListed
      );
    });

  return isCurrent ? expected : await refreshCanonicalScenario(client, showcase.id, referenceTime);
}
