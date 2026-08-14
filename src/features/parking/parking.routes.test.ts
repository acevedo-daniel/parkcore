import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const parkingService = vi.hoisted(() => ({
  create: vi.fn(),
  findAll: vi.fn(),
  findPublicById: vi.fn(),
  findOwned: vi.fn(),
  update: vi.fn(),
}));

vi.mock('./parking.service.js', () => parkingService);

import { errorHandler } from '../../middlewares/error-handler.middleware.js';
import { signAccessToken } from '../auth/auth.jwt.js';
import { parkingRouter } from './parking.routes.js';

const app = express();
app.use(express.json());
app.use('/parkings', parkingRouter);
app.use(errorHandler);

const parkingId = '00000000-0000-4000-8000-000000000001';
const parking = { id: parkingId, title: 'Central Parking' };

const createParkingBody = {
  title: 'Central Parking',
  address: '123 Main Street',
  hourlyRateCents: 1550,
  currency: 'USD',
  capacity: 20,
  lat: -34.6037,
  lng: -58.3816,
};

const errorResponseSchema = z.strictObject({
  error: z.literal(true),
  message: z.string(),
});

function expectErrorContract(body: unknown): void {
  const error = errorResponseSchema.parse(body);
  expect(error.error).toBe(true);
  expect(error.message.length).toBeGreaterThan(0);
}

async function authorizationHeader(userId = 'owner-1'): Promise<Record<string, string>> {
  const token = await signAccessToken({ sub: userId });
  return { authorization: `Bearer ${token}` };
}

describe('parking routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses a valid query before calling the service', async () => {
    parkingService.findAll.mockResolvedValue({ data: [], meta: {} });

    const response = await request(app).get('/parkings?page=2&limit=5&minHourlyRateCents=1000');

    expect(response.status).toBe(200);
    expect(parkingService.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      minHourlyRateCents: 1000,
    });
  });

  it('returns the global error contract for an invalid query', async () => {
    const response = await request(app).get('/parkings?page=0');

    expect(response.status).toBe(400);
    expectErrorContract(response.body);
    expect(parkingService.findAll).not.toHaveBeenCalled();
  });

  it('parses valid route params before calling the service', async () => {
    parkingService.findPublicById.mockResolvedValue(parking);

    const response = await request(app).get(`/parkings/${parkingId}`);

    expect(response.status).toBe(200);
    expect(parkingService.findPublicById).toHaveBeenCalledWith(parkingId);
  });

  it('returns the global error contract for invalid route params', async () => {
    const response = await request(app).get('/parkings/not-a-uuid');

    expect(response.status).toBe(400);
    expectErrorContract(response.body);
    expect(parkingService.findPublicById).not.toHaveBeenCalled();
  });

  it('requires authentication before owner routes', async () => {
    const response = await request(app).get('/parkings/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: true, message: 'Missing token' });
    expect(parkingService.findOwned).not.toHaveBeenCalled();
  });

  it('returns both active and inactive parkings to the authenticated owner', async () => {
    const inactiveParking = { ...parking, id: 'parking-2', isActive: false };
    parkingService.findOwned.mockResolvedValue([{ ...parking, isActive: true }, inactiveParking]);

    const response = await request(app)
      .get('/parkings/me')
      .set(await authorizationHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ ...parking, isActive: true }, inactiveParking]);
    expect(parkingService.findOwned).toHaveBeenCalledWith('owner-1');
  });

  it('parses a valid body and reads authentication context once', async () => {
    parkingService.create.mockResolvedValue(parking);

    const response = await request(app)
      .post('/parkings')
      .set(await authorizationHeader())
      .send(createParkingBody);

    expect(response.status).toBe(201);
    expect(parkingService.create).toHaveBeenCalledWith('owner-1', createParkingBody);
  });

  it('normalizes a valid currency code before calling the service', async () => {
    parkingService.create.mockResolvedValue(parking);

    const response = await request(app)
      .post('/parkings')
      .set(await authorizationHeader())
      .send({ ...createParkingBody, currency: 'usd' });

    expect(response.status).toBe(201);
    expect(parkingService.create).toHaveBeenCalledWith('owner-1', createParkingBody);
  });

  it('returns the global error contract for an invalid body', async () => {
    const response = await request(app)
      .post('/parkings')
      .set(await authorizationHeader())
      .send({ ...createParkingBody, title: 'bad' });

    expect(response.status).toBe(400);
    expectErrorContract(response.body);
    expect(parkingService.create).not.toHaveBeenCalled();
  });

  it('rejects non-positive rates and capacities before calling the service', async () => {
    const invalidRate = await request(app)
      .post('/parkings')
      .set(await authorizationHeader())
      .send({ ...createParkingBody, hourlyRateCents: 0 });

    expect(invalidRate.status).toBe(400);
    expectErrorContract(invalidRate.body);

    const invalidCapacity = await request(app)
      .post('/parkings')
      .set(await authorizationHeader())
      .send({ ...createParkingBody, capacity: 0 });

    expect(invalidCapacity.status).toBe(400);
    expectErrorContract(invalidCapacity.body);
    expect(parkingService.create).not.toHaveBeenCalled();
  });

  it('allows an authenticated owner to deactivate a parking through update', async () => {
    parkingService.update.mockResolvedValue({ ...parking, isActive: false });

    const response = await request(app)
      .patch(`/parkings/${parkingId}`)
      .set(await authorizationHeader())
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(parkingService.update).toHaveBeenCalledWith('owner-1', parkingId, { isActive: false });
  });
});
