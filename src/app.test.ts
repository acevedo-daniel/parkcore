import request from 'supertest';
import { Router } from 'express';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const authRouter = Router();
const bookingRouter = Router();
const parkingRouter = Router();
const userRouter = Router();
const vehicleRouter = Router();

vi.mock('../src/features/auth/auth.routes.js', () => ({ authRouter }));
vi.mock('../src/features/booking/booking.routes.js', () => ({ bookingRouter }));
vi.mock('../src/features/parking/parking.routes.js', () => ({ parkingRouter }));
vi.mock('../src/features/user/user.routes.js', () => ({ userRouter }));
vi.mock('../src/features/vehicle/vehicle.routes.js', () => ({ vehicleRouter }));

let app: import('express').Express;

beforeAll(async () => {
  ({ default: app } = await import('../app.js'));
});

describe('app smoke', () => {
  it('GET / returns 200', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'parkcore-api',
    });
  });

  it('GET /healthz returns 200', async () => {
    const response = await request(app).get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('unknown route returns standard error contract', async () => {
    const response = await request(app).get('/__missing_route__');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: true,
      message: 'Route not found',
    });
  });

  it('review endpoints are no longer part of the application', async () => {
    const response = await request(app).get(
      '/reviews/parking/00000000-0000-4000-8000-000000000001',
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: true,
      message: 'Route not found',
    });
  });
});
