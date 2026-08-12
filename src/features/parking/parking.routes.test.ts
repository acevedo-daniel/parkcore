import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const parkingService = vi.hoisted(() => ({
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
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
  pricePerHour: 15.5,
  totalSpaces: 20,
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

    const response = await request(app).get('/parkings?page=2&limit=5&minPrice=10');

    expect(response.status).toBe(200);
    expect(parkingService.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      minPrice: 10,
    });
  });

  it('returns the global error contract for an invalid query', async () => {
    const response = await request(app).get('/parkings?page=0');

    expect(response.status).toBe(400);
    expectErrorContract(response.body);
    expect(parkingService.findAll).not.toHaveBeenCalled();
  });

  it('parses valid route params before calling the service', async () => {
    parkingService.findById.mockResolvedValue(parking);

    const response = await request(app).get(`/parkings/${parkingId}`);

    expect(response.status).toBe(200);
    expect(parkingService.findById).toHaveBeenCalledWith(parkingId);
  });

  it('returns the global error contract for invalid route params', async () => {
    const response = await request(app).get('/parkings/not-a-uuid');

    expect(response.status).toBe(400);
    expectErrorContract(response.body);
    expect(parkingService.findById).not.toHaveBeenCalled();
  });

  it('requires authentication before owner routes', async () => {
    const response = await request(app).get('/parkings/me');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: true, message: 'Missing token' });
    expect(parkingService.findOwned).not.toHaveBeenCalled();
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

  it('returns the global error contract for an invalid body', async () => {
    const response = await request(app)
      .post('/parkings')
      .set(await authorizationHeader())
      .send({ ...createParkingBody, title: 'bad' });

    expect(response.status).toBe(400);
    expectErrorContract(response.body);
    expect(parkingService.create).not.toHaveBeenCalled();
  });
});
