import express from 'express';
import type { Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const registerControllerMock = vi.fn((_req: Request, res: Response) => {
  res.status(201).json({ ok: true });
});

const loginControllerMock = vi.fn((_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

const validBody = {
  email: 'rate-limit@parkcore.test',
  password: 'Passw0rd!123',
};

async function createAuthTestApp(maxRequests: number) {
  vi.resetModules();
  process.env.AUTH_RATE_LIMIT_MAX = String(maxRequests);
  process.env.AUTH_RATE_LIMIT_WINDOW_MS = '60000';

  vi.doMock('./auth.controller.js', () => ({
    register: registerControllerMock,
    login: loginControllerMock,
  }));

  const { authRouter } = await import('./auth.routes.js');
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  return app;
}

describe('auth routes rate limit', () => {
  beforeEach(() => {
    registerControllerMock.mockClear();
    loginControllerMock.mockClear();
  });

  it('returns 429 after exceeding configured limit in /auth/login', async () => {
    const app = await createAuthTestApp(2);

    const first = await request(app).post('/auth/login').send(validBody);
    const second = await request(app).post('/auth/login').send(validBody);
    const third = await request(app).post('/auth/login').send(validBody);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body).toEqual({
      error: true,
      message: 'Too many requests, try again later',
    });
    expect(third.headers.ratelimit).toBeTypeOf('string');
    expect(third.headers['retry-after']).toBeTypeOf('string');
  });

  it('uses independent buckets for /auth/register and /auth/login', async () => {
    const app = await createAuthTestApp(1);

    const registerBlocked = await request(app).post('/auth/register').send(validBody);
    const registerLimited = await request(app).post('/auth/register').send(validBody);
    const loginAllowed = await request(app).post('/auth/login').send(validBody);

    expect(registerBlocked.status).toBe(201);
    expect(registerLimited.status).toBe(429);
    expect(loginAllowed.status).toBe(200);
  });
});
