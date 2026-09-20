import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import app from '../../app.js';
import { prisma } from '../../src/config/prisma.js';
import { cleanupExpiredDemoOwners } from '../../src/features/demo/demo.repository.js';

interface DemoSandbox {
  accessToken: string;
  user: {
    id: string;
    kind: string;
    timezone: string;
    demoExpiresAt: string;
  };
}

interface OwnedParking {
  id: string;
  title: string;
  ownerId: string;
  activeSessionCount: number;
  availableSpaces: number;
  availabilityState: string;
}

interface PublicParking {
  id: string;
  isShowcase: boolean;
  activeSessionCount: number;
  availableSpaces: number;
  availabilityState: string;
}

interface PublicList {
  data: PublicParking[];
  meta: { total: number };
}

interface VehicleLookup {
  vehicle: { id: string; plate: string } | null;
}

interface AnalyticsSummary {
  activeVehicles: number;
  facilities: { parkingId: string; activeVehicles: number }[];
}

const authHeader = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});

const loginDemo = async (): Promise<DemoSandbox> => {
  const response = await request(app).post('/demo/login');
  expect(response.status).toBe(200);
  return response.body as DemoSandbox;
};

const getOwnedParkings = async (accessToken: string): Promise<OwnedParking[]> => {
  const response = await request(app).get('/parkings/me').set(authHeader(accessToken));
  expect(response.status).toBe(200);
  return response.body as OwnedParking[];
};

const getAnalyticsSummary = async (accessToken: string): Promise<AnalyticsSummary> => {
  const response = await request(app).get('/analytics/summary').set(authHeader(accessToken));
  expect(response.status).toBe(200);
  return response.body as AnalyticsSummary;
};

const getPublicList = async (query: string): Promise<PublicList> => {
  const response = await request(app).get(`/parkings?${query}`);
  expect(response.status).toBe(200);
  return response.body as PublicList;
};

const parkingByTitle = (parkings: OwnedParking[], title: string): OwnedParking => {
  const parking = parkings.find((candidate) => candidate.title === title);
  if (!parking) throw new Error(`Missing parking: ${title}`);
  return parking;
};

const createBoundaryParking = async (ownerId: string, title: string, isListed: boolean) => {
  return await prisma.parking.create({
    data: {
      title,
      neighborhood: 'Palermo',
      address: `${title} Street`,
      hourlyRateCents: 1_500,
      currency: 'USD',
      capacity: 5,
      lat: -34.6037,
      lng: -58.3816,
      isActive: true,
      isListed,
      is24Hours: true,
      owner: { connect: { id: ownerId } },
    },
  });
};

const assertPublicBoundary = async ({
  suffix,
  demoParkingIds,
  hiddenOwnerParkingId,
  showcaseParkingId,
}: {
  suffix: string;
  demoParkingIds: string[];
  hiddenOwnerParkingId: string;
  showcaseParkingId: string;
}): Promise<PublicParking> => {
  const listResponse = await request(app).get('/parkings?limit=100');
  expect(listResponse.status).toBe(200);
  const listBody = listResponse.body as PublicList;
  const listIds = listBody.data.map(({ id }) => id);

  for (const parkingId of [...demoParkingIds, hiddenOwnerParkingId]) {
    expect(listIds).not.toContain(parkingId);
  }

  const showcase = listBody.data.find(({ id }) => id === showcaseParkingId);
  expect(showcase).toMatchObject({ id: showcaseParkingId, isShowcase: true });
  expect(JSON.stringify(listBody)).not.toMatch(/ownerId|customerName|customerPhone|notes/);

  const searchResponse = await request(app).get(
    `/parkings?search=${encodeURIComponent(suffix)}&limit=100`,
  );
  expect(searchResponse.status).toBe(200);
  const searchBody = searchResponse.body as PublicList;
  expect(searchBody.data.map(({ id }) => id)).toEqual([showcaseParkingId]);
  expect(JSON.stringify(searchBody)).not.toMatch(/ownerId|customerName|customerPhone|notes/);

  const showcaseDetail = await request(app).get(`/parkings/${showcaseParkingId}`);
  expect(showcaseDetail.status).toBe(200);
  expect(showcaseDetail.body).toMatchObject({ id: showcaseParkingId, isShowcase: true });
  expect(JSON.stringify(showcaseDetail.body)).not.toMatch(
    /ownerId|customerName|customerPhone|notes/,
  );

  for (const parkingId of [...demoParkingIds, hiddenOwnerParkingId]) {
    await expect(request(app).get(`/parkings/${parkingId}`)).resolves.toMatchObject({
      status: 404,
    });
  }

  const availableNow = await getPublicList('availableNow=true&limit=100');
  const availableNowIds = availableNow.data.map(({ id }) => id);
  for (const parkingId of [...demoParkingIds, hiddenOwnerParkingId]) {
    expect(availableNowIds).not.toContain(parkingId);
  }
  expect(availableNowIds).toContain(showcaseParkingId);

  if (!showcase) throw new Error('Missing public showcase data');
  return showcase;
};

describe('demo isolation integration', () => {
  const userIds: string[] = [];

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    userIds.length = 0;
  });

  it('keeps concurrent sandboxes, public discovery, analytics, and cleanup isolated', async () => {
    const [firstDemo, secondDemo] = await Promise.all([loginDemo(), loginDemo()]);
    userIds.push(firstDemo.user.id, secondDemo.user.id);

    expect(firstDemo.accessToken).not.toBe(secondDemo.accessToken);
    expect(firstDemo.user.id).not.toBe(secondDemo.user.id);
    expect(firstDemo.user).toMatchObject({
      kind: 'DEMO',
      timezone: 'America/Argentina/Buenos_Aires',
    });
    expect(secondDemo.user).toMatchObject({
      kind: 'DEMO',
      timezone: 'America/Argentina/Buenos_Aires',
    });
    expect(new Date(firstDemo.user.demoExpiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(new Date(secondDemo.user.demoExpiresAt).getTime()).toBeGreaterThan(Date.now());

    const [firstInitial, secondInitial] = await Promise.all([
      getOwnedParkings(firstDemo.accessToken),
      getOwnedParkings(secondDemo.accessToken),
    ]);
    expect(firstInitial).toHaveLength(6);
    expect(secondInitial).toHaveLength(6);
    expect(new Set(firstInitial.map(({ id }) => id)).size).toBe(6);
    expect(new Set(secondInitial.map(({ id }) => id)).size).toBe(6);
    expect(firstInitial.map(({ id }) => id)).not.toEqual(secondInitial.map(({ id }) => id));
    expect(firstInitial.every(({ ownerId }) => ownerId === firstDemo.user.id)).toBe(true);
    expect(secondInitial.every(({ ownerId }) => ownerId === secondDemo.user.id)).toBe(true);

    const firstCentral = parkingByTitle(firstInitial, 'Central Corrientes');
    const secondCentral = parkingByTitle(secondInitial, 'Central Corrientes');
    expect(firstCentral.id).not.toBe(secondCentral.id);
    expect(firstCentral).toMatchObject({ activeSessionCount: 4, availableSpaces: 26 });
    expect(secondCentral).toMatchObject({ activeSessionCount: 4, availableSpaces: 26 });

    const [firstLookupResponse, secondLookupResponse] = await Promise.all([
      request(app)
        .get(`/parkings/${firstCentral.id}/sessions/vehicle-lookup?plate=CC004`)
        .set(authHeader(firstDemo.accessToken)),
      request(app)
        .get(`/parkings/${secondCentral.id}/sessions/vehicle-lookup?plate=CC004`)
        .set(authHeader(secondDemo.accessToken)),
    ]);
    expect(firstLookupResponse.status).toBe(200);
    expect(secondLookupResponse.status).toBe(200);
    const firstLookup = firstLookupResponse.body as VehicleLookup;
    const secondLookup = secondLookupResponse.body as VehicleLookup;
    expect(firstLookup.vehicle).not.toBeNull();
    expect(firstLookup.vehicle?.id).toBeTypeOf('string');
    expect(firstLookup.vehicle?.plate).toBe('CC004');
    expect(secondLookup.vehicle).not.toBeNull();
    expect(secondLookup.vehicle?.id).toBeTypeOf('string');
    expect(secondLookup.vehicle?.plate).toBe('CC004');
    expect(firstLookup.vehicle?.id).not.toBe(secondLookup.vehicle?.id);

    const suffix = randomUUID();
    const boundaryOwner = await prisma.user.create({
      data: {
        email: `isolation-owner-${suffix}@parkcore.test`,
        passwordHash: 'test-hash',
        kind: 'OWNER',
        name: 'Boundary',
        lastName: 'Owner',
        timezone: 'America/Argentina/Buenos_Aires',
      },
    });
    const boundaryShowcase = await prisma.user.create({
      data: { kind: 'SHOWCASE', timezone: 'America/Argentina/Buenos_Aires' },
    });
    userIds.push(boundaryOwner.id, boundaryShowcase.id);

    const firstPrivateDemoParking = await createBoundaryParking(
      firstDemo.user.id,
      `Demo Private One ${suffix}`,
      true,
    );
    const secondPrivateDemoParking = await createBoundaryParking(
      secondDemo.user.id,
      `Demo Private Two ${suffix}`,
      true,
    );
    const hiddenOwnerParking = await createBoundaryParking(
      boundaryOwner.id,
      `Owner Hidden ${suffix}`,
      false,
    );
    const showcaseParking = await createBoundaryParking(
      boundaryShowcase.id,
      `Showcase Boundary ${suffix}`,
      true,
    );

    const publicBefore = await assertPublicBoundary({
      suffix,
      demoParkingIds: [firstPrivateDemoParking.id, secondPrivateDemoParking.id],
      hiddenOwnerParkingId: hiddenOwnerParking.id,
      showcaseParkingId: showcaseParking.id,
    });

    const [firstSummaryBefore, secondSummaryBefore] = await Promise.all([
      getAnalyticsSummary(firstDemo.accessToken),
      getAnalyticsSummary(secondDemo.accessToken),
    ]);
    expect(firstSummaryBefore.activeVehicles).toBe(secondSummaryBefore.activeVehicles);
    expect(firstSummaryBefore.facilities.map(({ parkingId }) => parkingId)).not.toContain(
      secondCentral.id,
    );
    expect(secondSummaryBefore.facilities.map(({ parkingId }) => parkingId)).not.toContain(
      firstCentral.id,
    );

    const plate = `QA${suffix.replaceAll('-', '').slice(0, 8).toUpperCase()}`;
    const checkInResponse = await request(app)
      .post(`/parkings/${firstCentral.id}/sessions/check-in`)
      .set(authHeader(firstDemo.accessToken))
      .send({
        plate,
        type: 'CAR',
        brand: 'Toyota',
        model: 'Corolla',
        customerName: 'Sandbox One',
        customerPhone: '+5491100000001',
        notes: 'Sandbox one mutation',
      });
    expect(checkInResponse.status).toBe(201);
    expect(checkInResponse.body).toMatchObject({
      parkingId: firstCentral.id,
      status: 'ACTIVE',
      customerName: 'Sandbox One',
      customerPhone: '+5491100000001',
      notes: 'Sandbox one mutation',
      vehicle: { plate },
    });
    const checkInSession = checkInResponse.body as { id: string };

    const [firstActiveResponse, secondActiveResponse, secondLookupAfterMutationResponse] =
      await Promise.all([
        request(app)
          .get(`/parkings/${firstCentral.id}/sessions/active`)
          .set(authHeader(firstDemo.accessToken)),
        request(app)
          .get(`/parkings/${secondCentral.id}/sessions/active`)
          .set(authHeader(secondDemo.accessToken)),
        request(app)
          .get(`/parkings/${secondCentral.id}/sessions/vehicle-lookup?plate=${plate}`)
          .set(authHeader(secondDemo.accessToken)),
      ]);
    expect(firstActiveResponse.status).toBe(200);
    expect(secondActiveResponse.status).toBe(200);
    expect(secondLookupAfterMutationResponse.status).toBe(200);
    expect(
      (firstActiveResponse.body as { vehicle: { plate: string } }[]).some(
        ({ vehicle }) => vehicle.plate === plate,
      ),
    ).toBe(true);
    expect(
      (secondActiveResponse.body as { vehicle: { plate: string } }[]).some(
        ({ vehicle }) => vehicle.plate === plate,
      ),
    ).toBe(false);
    expect((secondLookupAfterMutationResponse.body as VehicleLookup).vehicle).toBeNull();

    const crossSandboxRead = await request(app)
      .get(`/parkings/${secondCentral.id}/sessions/active`)
      .set(authHeader(firstDemo.accessToken));
    expect(crossSandboxRead.status).toBe(403);

    const [firstDuring, secondDuring] = await Promise.all([
      getOwnedParkings(firstDemo.accessToken),
      getOwnedParkings(secondDemo.accessToken),
    ]);
    expect(parkingByTitle(firstDuring, 'Central Corrientes')).toMatchObject({
      activeSessionCount: 5,
      availableSpaces: 25,
    });
    expect(parkingByTitle(secondDuring, 'Central Corrientes')).toMatchObject({
      activeSessionCount: 4,
      availableSpaces: 26,
    });

    const [firstSummaryDuring, secondSummaryDuring] = await Promise.all([
      getAnalyticsSummary(firstDemo.accessToken),
      getAnalyticsSummary(secondDemo.accessToken),
    ]);
    expect(firstSummaryDuring.activeVehicles).toBe(firstSummaryBefore.activeVehicles + 1);
    expect(secondSummaryDuring.activeVehicles).toBe(secondSummaryBefore.activeVehicles);
    expect(firstSummaryDuring.facilities.map(({ parkingId }) => parkingId)).not.toContain(
      secondPrivateDemoParking.id,
    );
    expect(secondSummaryDuring.facilities.map(({ parkingId }) => parkingId)).not.toContain(
      firstPrivateDemoParking.id,
    );

    const publicDuring = await assertPublicBoundary({
      suffix,
      demoParkingIds: [firstPrivateDemoParking.id, secondPrivateDemoParking.id],
      hiddenOwnerParkingId: hiddenOwnerParking.id,
      showcaseParkingId: showcaseParking.id,
    });
    expect(publicDuring).toEqual(publicBefore);

    const checkOutResponse = await request(app)
      .post(`/sessions/${checkInSession.id}/check-out`)
      .set(authHeader(firstDemo.accessToken));
    expect(checkOutResponse.status).toBe(200);
    expect(checkOutResponse.body).toMatchObject({
      id: checkInSession.id,
      parkingId: firstCentral.id,
      status: 'COMPLETED',
      vehicle: { plate },
    });
    const checkOutBody = checkOutResponse.body as { totalAmountCents: number };
    expect(checkOutBody.totalAmountCents).toBeGreaterThan(0);

    const firstSessionDetail = await request(app)
      .get(`/sessions/${checkInSession.id}`)
      .set(authHeader(firstDemo.accessToken));
    expect(firstSessionDetail.status).toBe(200);
    expect(firstSessionDetail.body).toMatchObject({
      id: checkInSession.id,
      status: 'COMPLETED',
      vehicle: { plate },
    });
    const secondSessionDetail = await request(app)
      .get(`/sessions/${checkInSession.id}`)
      .set(authHeader(secondDemo.accessToken));
    expect(secondSessionDetail.status).toBe(403);

    const [firstAfterCheckOut, secondAfterCheckOut] = await Promise.all([
      getOwnedParkings(firstDemo.accessToken),
      getOwnedParkings(secondDemo.accessToken),
    ]);
    expect(parkingByTitle(firstAfterCheckOut, 'Central Corrientes')).toMatchObject({
      activeSessionCount: 4,
      availableSpaces: 26,
    });
    expect(parkingByTitle(secondAfterCheckOut, 'Central Corrientes')).toMatchObject({
      activeSessionCount: 4,
      availableSpaces: 26,
    });

    const [firstHistoryResponse, secondHistoryResponse] = await Promise.all([
      request(app)
        .get(`/parkings/${firstCentral.id}/sessions?period=30d&plate=${plate}`)
        .set(authHeader(firstDemo.accessToken)),
      request(app)
        .get(`/parkings/${secondCentral.id}/sessions?period=30d&plate=${plate}`)
        .set(authHeader(secondDemo.accessToken)),
    ]);
    expect(firstHistoryResponse.status).toBe(200);
    expect(secondHistoryResponse.status).toBe(200);
    const firstHistoryBody = firstHistoryResponse.body as {
      data: { id: string; status: string }[];
    };
    const secondHistoryBody = secondHistoryResponse.body as {
      data: { id: string; status: string }[];
    };
    expect(firstHistoryBody.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: checkInSession.id, status: 'COMPLETED' }),
      ]),
    );
    expect(secondHistoryBody.data).toHaveLength(0);

    const firstSummaryAfterCheckOut = await getAnalyticsSummary(firstDemo.accessToken);
    const secondSummaryAfterCheckOut = await getAnalyticsSummary(secondDemo.accessToken);
    expect(firstSummaryAfterCheckOut.activeVehicles).toBe(firstSummaryBefore.activeVehicles);
    expect(secondSummaryAfterCheckOut.activeVehicles).toBe(secondSummaryBefore.activeVehicles);

    const publicAfterCheckOut = await assertPublicBoundary({
      suffix,
      demoParkingIds: [firstPrivateDemoParking.id, secondPrivateDemoParking.id],
      hiddenOwnerParkingId: hiddenOwnerParking.id,
      showcaseParkingId: showcaseParking.id,
    });
    expect(publicAfterCheckOut).toEqual(publicBefore);

    const expiryBefore = (
      await prisma.user.findUniqueOrThrow({
        where: { id: firstDemo.user.id },
        select: { demoExpiresAt: true },
      })
    ).demoExpiresAt;
    const secondPrivateParkingBeforeReset = await prisma.parking.findUniqueOrThrow({
      where: { id: secondPrivateDemoParking.id },
    });

    const resetResponse = await request(app)
      .post('/demo/reset')
      .set(authHeader(firstDemo.accessToken));
    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body).toEqual({ restored: true });

    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: firstDemo.user.id },
        select: { demoExpiresAt: true },
      }),
    ).resolves.toEqual({ demoExpiresAt: expiryBefore });
    await expect(
      prisma.parking.findUnique({ where: { id: firstPrivateDemoParking.id } }),
    ).resolves.toBeNull();
    await expect(
      prisma.parking.findUnique({ where: { id: secondPrivateDemoParking.id } }),
    ).resolves.toEqual(secondPrivateParkingBeforeReset);

    const [firstAfterReset, secondAfterReset] = await Promise.all([
      getOwnedParkings(firstDemo.accessToken),
      getOwnedParkings(secondDemo.accessToken),
    ]);
    expect(firstAfterReset).toHaveLength(6);
    expect(secondAfterReset).toHaveLength(7);
    expect(parkingByTitle(firstAfterReset, 'Central Corrientes')).toMatchObject({
      activeSessionCount: 4,
      availableSpaces: 26,
    });
    expect(parkingByTitle(secondAfterReset, 'Central Corrientes')).toMatchObject({
      activeSessionCount: 4,
      availableSpaces: 26,
    });

    const firstLookupAfterReset = await request(app)
      .get(`/parkings/${firstCentral.id}/sessions/vehicle-lookup?plate=${plate}`)
      .set(authHeader(firstDemo.accessToken));
    expect(firstLookupAfterReset.status).toBe(200);
    expect((firstLookupAfterReset.body as VehicleLookup).vehicle).toBeNull();

    const [firstSummaryAfterReset, secondSummaryAfterReset] = await Promise.all([
      getAnalyticsSummary(firstDemo.accessToken),
      getAnalyticsSummary(secondDemo.accessToken),
    ]);
    expect(firstSummaryAfterReset.activeVehicles).toBe(firstSummaryBefore.activeVehicles);
    expect(secondSummaryAfterReset.activeVehicles).toBe(secondSummaryBefore.activeVehicles);
    expect(firstSummaryAfterReset.facilities.map(({ parkingId }) => parkingId)).not.toContain(
      secondPrivateDemoParking.id,
    );
    expect(secondSummaryAfterReset.facilities.map(({ parkingId }) => parkingId)).not.toContain(
      firstCentral.id,
    );

    const publicAfterReset = await assertPublicBoundary({
      suffix,
      demoParkingIds: [firstPrivateDemoParking.id, secondPrivateDemoParking.id],
      hiddenOwnerParkingId: hiddenOwnerParking.id,
      showcaseParkingId: showcaseParking.id,
    });
    expect(publicAfterReset).toEqual(publicBefore);

    const expiredDemoId = randomUUID();
    userIds.push(expiredDemoId);
    await prisma.user.create({
      data: {
        id: expiredDemoId,
        kind: 'DEMO',
        timezone: 'America/Argentina/Buenos_Aires',
        demoExpiresAt: new Date('2000-01-01T00:00:00.000Z'),
      },
    });
    const expiredParking = await createBoundaryParking(
      expiredDemoId,
      `Expired Demo ${suffix}`,
      false,
    );

    await cleanupExpiredDemoOwners(prisma, new Date());
    await expect(prisma.user.findUnique({ where: { id: expiredDemoId } })).resolves.toBeNull();
    await expect(
      prisma.parking.findUnique({ where: { id: expiredParking.id } }),
    ).resolves.toBeNull();
    await expect(
      prisma.user.findUnique({ where: { id: firstDemo.user.id } }),
    ).resolves.not.toBeNull();
    await expect(
      prisma.user.findUnique({ where: { id: secondDemo.user.id } }),
    ).resolves.not.toBeNull();
    await expect(
      prisma.user.findUnique({ where: { id: boundaryOwner.id } }),
    ).resolves.not.toBeNull();
    await expect(
      prisma.user.findUnique({ where: { id: boundaryShowcase.id } }),
    ).resolves.not.toBeNull();
    await expect(
      prisma.parking.findUnique({ where: { id: showcaseParking.id } }),
    ).resolves.not.toBeNull();
  }, 15_000);
});
