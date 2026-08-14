import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../src/config/prisma.js';

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
        name: 'Integration Owner',
      });

    expect(registerResponse.status).toBe(201);
    const auth = registerResponse.body as unknown as AuthResponse;
    ownerId = auth.user.id;
    const authorization = `Bearer ${auth.accessToken}`;

    const createParkingResponse = await request(app)
      .post('/parkings')
      .set('Authorization', authorization)
      .send({
        title: `Integration Parking ${suffix}`,
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

    const activeResponse = await request(app)
      .get(`/parkings/${parking.id}/sessions/active`)
      .set('Authorization', authorization);

    expect(activeResponse.status).toBe(200);
    const activeSessions = activeResponse.body as unknown as SessionResponse[];
    expect(activeSessions).toHaveLength(1);
    expect(activeSessions[0]).toMatchObject({
      id: checkedIn.id,
      vehicle: { id: checkedIn.vehicle.id },
    });

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
});
