import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../src/config/prisma.js';
import { verifyAccessToken, signAccessToken } from '../../src/features/auth/auth.jwt.js';

interface AuthResponse {
  accessToken: string;
  user: { id: string };
}

interface ParkingResponse {
  id: string;
}

interface VehicleSummary {
  id: string;
  plate: string;
  type: string;
  brand: string | null;
  model: string | null;
}

interface SessionResponse {
  id: string;
  startTime: string;
  endTime: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  totalAmountCents: number | null;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: VehicleSummary;
}

interface SessionListResponse {
  data: SessionResponse[];
}

describe('owner workflow integration', () => {
  let ownerId: string | undefined;

  afterEach(async () => {
    if (ownerId) {
      await prisma.user.delete({ where: { id: ownerId } });
      ownerId = undefined;
    }
  });

  it('registers, operates a parking, and returns frontend-ready session data', async () => {
    const suffix = randomUUID();
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        email: `owner-${suffix}@parkcore.test`,
        password: 'Passw0rd!123',
        name: 'Integration',
        lastName: 'Owner',
        timezone: 'America/Argentina/Buenos_Aires',
      });

    expect(registerResponse.status).toBe(201);
    const auth = registerResponse.body as unknown as AuthResponse;
    ownerId = auth.user.id;
    expect(auth.user).toMatchObject({
      kind: 'OWNER',
      timezone: 'America/Argentina/Buenos_Aires',
      demoExpiresAt: null,
    });
    const authorization = `Bearer ${auth.accessToken}`;

    const createParkingResponse = await request(app)
      .post('/parkings')
      .set('Authorization', authorization)
      .send({
        title: `Integration Parking ${suffix}`,
        neighborhood: 'Downtown',
        address: '123 Integration Street',
        hourlyRateCents: 1500,
        currency: 'USD',
        capacity: 5,
        lat: -34.6037,
        lng: -58.3816,
      });

    expect(createParkingResponse.status).toBe(201);
    const parking = createParkingResponse.body as unknown as ParkingResponse;

    const checkInResponse = await request(app)
      .post(`/parkings/${parking.id}/sessions/check-in`)
      .set('Authorization', authorization)
      .send({
        plate: ' ab-123 cd ',
        type: 'CAR',
        brand: 'Toyota',
        model: 'Corolla',
        customerName: 'Jane Doe',
        customerPhone: '+1234567890',
        notes: 'Scratch on left door',
      });

    expect(checkInResponse.status).toBe(201);
    const checkedIn = checkInResponse.body as unknown as SessionResponse;
    expect(checkedIn).toMatchObject({
      status: 'ACTIVE',
      customerName: 'Jane Doe',
      customerPhone: '+1234567890',
      notes: 'Scratch on left door',
      vehicle: {
        plate: 'AB123CD',
        type: 'CAR',
        brand: 'Toyota',
        model: 'Corolla',
      },
    });
    expect(checkedIn.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(checkedIn.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(checkedIn.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(checkedIn.endTime).toBeNull();

    const secondCheckInResponse = await request(app)
      .post(`/parkings/${parking.id}/sessions/check-in`)
      .set('Authorization', authorization)
      .send({ plate: 'XY-456-ZZ', type: 'CAR' });
    expect(secondCheckInResponse.status).toBe(201);
    const secondCheckedIn = secondCheckInResponse.body as unknown as SessionResponse;

    const activeResponse = await request(app)
      .get(`/parkings/${parking.id}/sessions/active`)
      .set('Authorization', authorization);

    expect(activeResponse.status).toBe(200);
    const activeSessions = activeResponse.body as unknown as SessionResponse[];
    expect(activeSessions).toHaveLength(2);
    expect(
      activeSessions.some(
        (session) => session.id === checkedIn.id && session.vehicle.id === checkedIn.vehicle.id,
      ),
    ).toBe(true);
    await expect(
      prisma.parkingSession.count({ where: { parkingId: parking.id, status: 'ACTIVE' } }),
    ).resolves.toBe(2);

    const capacityResponse = await request(app)
      .patch(`/parkings/${parking.id}`)
      .set('Authorization', authorization)
      .send({ capacity: 0 });
    expect(capacityResponse.status).toBe(400);

    const blockedCapacityResponse = await request(app)
      .patch(`/parkings/${parking.id}`)
      .set('Authorization', authorization)
      .send({ capacity: 1 });
    expect(blockedCapacityResponse.status).toBe(409);
    const blockedCapacityBody = blockedCapacityResponse.body as { message: string };
    expect(blockedCapacityBody.message).toContain('2 active sessions');

    const checkoutResponse = await request(app)
      .post(`/sessions/${checkedIn.id}/check-out`)
      .set('Authorization', authorization);

    expect(checkoutResponse.status).toBe(200);
    const completed = checkoutResponse.body as unknown as SessionResponse;
    expect(completed).toMatchObject({
      id: checkedIn.id,
      status: 'COMPLETED',
      totalAmountCents: 1500,
      vehicle: { plate: 'AB123CD' },
    });
    expect(completed.endTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const returningCheckInResponse = await request(app)
      .post(`/parkings/${parking.id}/sessions/check-in`)
      .set('Authorization', authorization)
      .send({
        plate: 'AB 123 CD',
        brand: 'Honda',
        model: 'Civic',
      });
    expect(returningCheckInResponse.status).toBe(201);
    const returningCheckIn = returningCheckInResponse.body as unknown as SessionResponse;
    expect(returningCheckIn).toMatchObject({
      status: 'ACTIVE',
      customerName: null,
      customerPhone: null,
      notes: null,
      vehicle: {
        id: checkedIn.vehicle.id,
        plate: 'AB123CD',
        type: 'CAR',
        brand: 'Honda',
        model: 'Civic',
      },
    });

    const returningCancelResponse = await request(app)
      .patch(`/sessions/${returningCheckIn.id}/cancel`)
      .set('Authorization', authorization);
    expect(returningCancelResponse.status).toBe(200);
    expect(returningCancelResponse.body).toMatchObject({
      status: 'CANCELLED',
      totalAmountCents: null,
    });
    expect(returningCancelResponse.body.endTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const repeatedCancelResponse = await request(app)
      .patch(`/sessions/${returningCheckIn.id}/cancel`)
      .set('Authorization', authorization);
    expect(repeatedCancelResponse.status).toBe(409);

    const cancelResponse = await request(app)
      .patch(`/sessions/${secondCheckedIn.id}/cancel`)
      .set('Authorization', authorization);
    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body).toMatchObject({
      status: 'CANCELLED',
      totalAmountCents: null,
    });
    expect(cancelResponse.body.endTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const detailResponse = await request(app)
      .get(`/sessions/${checkedIn.id}`)
      .set('Authorization', authorization);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body).toMatchObject({ id: checkedIn.id, status: 'COMPLETED' });

    const historyResponse = await request(app)
      .get(`/parkings/${parking.id}/sessions?status=COMPLETED`)
      .set('Authorization', authorization);
    expect(historyResponse.status).toBe(200);
    const history = historyResponse.body as unknown as SessionListResponse;
    expect(history.data).toHaveLength(1);
    expect(history.data[0]).toMatchObject({
      id: checkedIn.id,
      status: 'COMPLETED',
      totalAmountCents: 1500,
      vehicle: { plate: 'AB123CD' },
    });
  });

  it('keeps returning vehicle identity scoped to its parking', async () => {
    const suffix = randomUUID();
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        email: `vehicle-scope-${suffix}@parkcore.test`,
        password: 'Passw0rd!123',
        name: 'Vehicle',
        lastName: 'Scope',
        timezone: 'America/Argentina/Buenos_Aires',
      });
    expect(registerResponse.status).toBe(201);
    const auth = registerResponse.body as unknown as AuthResponse;
    ownerId = auth.user.id;
    const authorization = `Bearer ${auth.accessToken}`;

    const createParking = async (title: string) => {
      const response = await request(app)
        .post('/parkings')
        .set('Authorization', authorization)
        .send({
          title: `${title} ${suffix}`,
          neighborhood: 'Downtown',
          address: '123 Integration Street',
          hourlyRateCents: 1500,
          currency: 'USD',
          capacity: 2,
          lat: -34.6037,
          lng: -58.3816,
        });
      expect(response.status).toBe(201);
      return response.body as unknown as ParkingResponse;
    };

    const firstParking = await createParking('First Scope Parking');
    const secondParking = await createParking('Second Scope Parking');
    const firstCheckInResponse = await request(app)
      .post(`/parkings/${firstParking.id}/sessions/check-in`)
      .set('Authorization', authorization)
      .send({ plate: 'ab-123-cd', brand: 'Toyota', model: 'Corolla' });
    const secondCheckInResponse = await request(app)
      .post(`/parkings/${secondParking.id}/sessions/check-in`)
      .set('Authorization', authorization)
      .send({ plate: 'AB 123 CD', brand: 'Honda', model: 'Civic' });

    expect(firstCheckInResponse.status).toBe(201);
    expect(secondCheckInResponse.status).toBe(201);
    const firstSession = firstCheckInResponse.body as unknown as SessionResponse;
    const secondSession = secondCheckInResponse.body as unknown as SessionResponse;
    expect(firstSession.vehicle).toMatchObject({ plate: 'AB123CD', brand: 'Toyota' });
    expect(secondSession.vehicle).toMatchObject({ plate: 'AB123CD', brand: 'Honda' });
    expect(secondSession.vehicle.id).not.toBe(firstSession.vehicle.id);
  });

  it('preserves capacity when concurrent check-ins race for the last space', async () => {
    const suffix = randomUUID();
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        email: `concurrency-${suffix}@parkcore.test`,
        password: 'Passw0rd!123',
        name: 'Concurrency',
        lastName: 'Owner',
        timezone: 'America/Argentina/Buenos_Aires',
      });
    expect(registerResponse.status).toBe(201);
    const auth = registerResponse.body as unknown as AuthResponse;
    ownerId = auth.user.id;
    const authorization = `Bearer ${auth.accessToken}`;

    const parkingResponse = await request(app)
      .post('/parkings')
      .set('Authorization', authorization)
      .send({
        title: `Concurrency Parking ${suffix}`,
        neighborhood: 'Downtown',
        address: '123 Integration Street',
        hourlyRateCents: 1500,
        currency: 'USD',
        capacity: 1,
        lat: -34.6037,
        lng: -58.3816,
      });
    expect(parkingResponse.status).toBe(201);
    const parking = parkingResponse.body as unknown as ParkingResponse;

    const responses = await Promise.all([
      request(app)
        .post(`/parkings/${parking.id}/sessions/check-in`)
        .set('Authorization', authorization)
        .send({ plate: 'AA-111-AA', type: 'CAR' }),
      request(app)
        .post(`/parkings/${parking.id}/sessions/check-in`)
        .set('Authorization', authorization)
        .send({ plate: 'BB-222-BB', type: 'CAR' }),
    ]);

    expect(responses.map(({ status }) => status).sort((left, right) => left - right)).toEqual([
      201, 409,
    ]);
    await expect(
      prisma.parkingSession.count({ where: { parkingId: parking.id, status: 'ACTIVE' } }),
    ).resolves.toBe(1);
  });

  it('allows owner and active demo operations but blocks showcase mutations', async () => {
    const demoToken = await signAccessToken(
      {
        sub: 'demo-operation-user',
        kind: 'DEMO',
        demoExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
      { expiresAt: new Date(Date.now() + 60_000) },
    );
    const showcaseToken = await signAccessToken({
      sub: 'showcase-operation-user',
      kind: 'SHOWCASE',
    });

    const demoResponse = await request(app)
      .get('/parkings/me')
      .set('Authorization', `Bearer ${demoToken}`);
    expect(demoResponse.status).toBe(200);

    const showcaseResponse = await request(app)
      .get('/parkings/me')
      .set('Authorization', `Bearer ${showcaseToken}`);
    expect(showcaseResponse.status).toBe(403);
    expect(showcaseResponse.body).toMatchObject({ error: true });
  });

  it('rejects incomplete owner registration and invalid timezones', async () => {
    const suffix = randomUUID();

    const missingLastName = await request(app)
      .post('/auth/register')
      .send({
        email: `missing-last-name-${suffix}@parkcore.test`,
        name: 'Missing',
        password: 'Passw0rd!123',
      });
    expect(missingLastName.status).toBe(400);

    const invalidTimezone = await request(app)
      .post('/auth/register')
      .send({
        email: `invalid-timezone-${suffix}@parkcore.test`,
        lastName: 'Timezone',
        name: 'Invalid',
        password: 'Passw0rd!123',
        timezone: 'Not/A-Timezone',
      });
    expect(invalidTimezone.status).toBe(400);
  });

  it('issues demo access without credentials and bounds its token to demo expiry', async () => {
    const response = await request(app).post('/demo/login');

    expect(response.status).toBe(200);
    const demo = response.body as {
      accessToken: string;
      user: { demoExpiresAt: string | null; email: string | null; id: string; kind: string };
    };
    expect(demo.user).toMatchObject({
      email: null,
      kind: 'DEMO',
    });
    expect(typeof demo.user.demoExpiresAt).toBe('string');

    const payload = await verifyAccessToken(demo.accessToken);
    expect(payload.kind).toBe('DEMO');
    expect(payload.exp).toBeLessThanOrEqual(
      Math.floor(new Date(demo.user.demoExpiresAt ?? '').getTime() / 1000),
    );
  });
});
