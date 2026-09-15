import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const userService = vi.hoisted(() => ({
  getById: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('./user.service.js', () => userService);

import { errorHandler } from '../../middlewares/error-handler.middleware.js';
import { signAccessToken } from '../auth/auth.jwt.js';
import { userRouter } from './user.routes.js';

const app = express();
app.use(express.json());
app.use('/users', userRouter);
app.use(errorHandler);

const profile = {
  id: 'user-1',
  kind: 'OWNER',
  email: 'owner@parkcore.test',
  name: 'Grace',
  lastName: 'Hopper',
  phone: null,
  photoUrl: null,
  timezone: 'Europe/Madrid',
  demoExpiresAt: null,
  createdAt: '2026-09-14T12:00:00.000Z',
  updatedAt: '2026-09-14T12:00:00.000Z',
};

async function authorizationHeader(userId = 'user-1'): Promise<Record<string, string>> {
  const token = await signAccessToken({ sub: userId, kind: 'OWNER' });
  return { authorization: `Bearer ${token}` };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('user routes', () => {
  it('requires authentication before profile updates', async () => {
    const response = await request(app).patch('/users/me').send({ timezone: 'Europe/Madrid' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: true, message: 'Missing token' });
    expect(userService.updateProfile).not.toHaveBeenCalled();
  });

  it('passes trimmed identity and timezone updates to the service', async () => {
    userService.updateProfile.mockResolvedValue(profile);

    const response = await request(app)
      .patch('/users/me')
      .set(await authorizationHeader())
      .send({ lastName: ' Hopper ', name: ' Grace ', timezone: ' Europe/Madrid ' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(profile);
    expect(userService.updateProfile).toHaveBeenCalledWith('user-1', {
      lastName: 'Hopper',
      name: 'Grace',
      timezone: 'Europe/Madrid',
    });
  });

  it('rejects invalid IANA timezones before the service is called', async () => {
    const response = await request(app)
      .patch('/users/me')
      .set(await authorizationHeader())
      .send({ timezone: 'Mars/Olympus' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: true });
    expect(userService.updateProfile).not.toHaveBeenCalled();
  });
});
