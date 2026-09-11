import express from 'express';
import type { Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const resetControllerMock = vi.fn((_req: Request, res: Response) => {
  res.status(200).json({ restored: true });
});
const loginControllerMock = vi.fn((_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

async function createDemoTestApp(demoCreationMax: number, resetMax = demoCreationMax) {
  vi.resetModules();
  process.env.AUTH_RATE_LIMIT_MAX = '1';
  process.env.DEMO_CREATION_RATE_LIMIT_MAX = String(demoCreationMax);
  process.env.DEMO_RESET_RATE_LIMIT_MAX = String(resetMax);
  process.env.DEMO_RESET_RATE_LIMIT_WINDOW_MS = '60000';

  vi.doMock('../../middlewares/auth.middleware.js', () => ({
    requireAuth: (_req: Request, _res: Response, next: () => void) => {
      next();
    },
    requireDemo: (_req: Request, _res: Response, next: () => void) => {
      next();
    },
  }));
  vi.doMock('./demo.controller.js', () => ({
    getStatus: vi.fn(),
    login: loginControllerMock,
    reset: resetControllerMock,
  }));

  const { demoRouter } = await import('./demo.routes.js');
  const app = express();
  app.use('/demo', demoRouter);
  return app;
}

describe('demo reset rate limit', () => {
  beforeEach(() => {
    resetControllerMock.mockClear();
    loginControllerMock.mockClear();
  });

  it('returns 429 after exceeding the configured reset limit', async () => {
    const app = await createDemoTestApp(1, 1);

    const first = await request(app).post('/demo/reset');
    const second = await request(app).post('/demo/reset');

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.body).toEqual({ error: true, message: 'Too many requests, try again later' });
    expect(resetControllerMock).toHaveBeenCalledOnce();
  });

  it('rate-limits demo creation independently from normal auth', async () => {
    const app = await createDemoTestApp(2, 1);

    const first = await request(app).post('/demo/login');
    const second = await request(app).post('/demo/login');
    const third = await request(app).post('/demo/login');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(loginControllerMock).toHaveBeenCalledTimes(2);
  });
});
