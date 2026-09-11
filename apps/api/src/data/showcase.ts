import {
  CANONICAL_TIMEZONE,
  refreshCanonicalScenario,
  type CanonicalDatabaseClient,
  type CanonicalScenario,
} from './canonical-scenario.js';

export const CANONICAL_SHOWCASE_USER_ID = '00000000-0000-4000-8000-000000000020';

export async function refreshCanonicalShowcase(
  client: CanonicalDatabaseClient,
  referenceTime: Date,
): Promise<CanonicalScenario> {
  const showcase = await client.user.upsert({
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

  return await refreshCanonicalScenario(client, showcase.id, referenceTime);
}
