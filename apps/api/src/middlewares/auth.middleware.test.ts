import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../features/auth/auth.jwt.js', () => ({
  verifyAccessToken: vi.fn(),
}));
vi.mock('../features/user/user.repository.js', () => ({
  findById: vi.fn(),
}));

import { createMockRequest, createMockResponse } from '../../tests/helpers/mocks.js';
import { UnauthorizedError } from '../errors/index.js';
import * as authJwt from '../features/auth/auth.jwt.js';
import * as userRepository from '../features/user/user.repository.js';
import { requireAuth } from './auth.middleware.js';

describe('requireAuth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns Missing token when Authorization header is absent', async () => {
    const req = createMockRequest({ headers: {} });
    const res = createMockResponse();
    const next = vi.fn<(error?: unknown) => void>();

    await requireAuth(req, res, next);

    expect(authJwt.verifyAccessToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls.at(0)?.[0];
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect((error as UnauthorizedError).message).toBe('Missing token');
  });

  it('returns Missing token when Authorization header is malformed', async () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer token unexpected' },
    });
    const res = createMockResponse();
    const next = vi.fn<(error?: unknown) => void>();

    await requireAuth(req, res, next);

    expect(authJwt.verifyAccessToken).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls.at(0)?.[0];
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect((error as UnauthorizedError).message).toBe('Missing token');
  });

  it('returns Invalid or expired token when token verification fails', async () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer invalid-token' },
    });
    const res = createMockResponse();
    const next = vi.fn<(error?: unknown) => void>();

    vi.mocked(authJwt.verifyAccessToken).mockRejectedValue(new Error('bad token'));

    await requireAuth(req, res, next);

    expect(authJwt.verifyAccessToken).toHaveBeenCalledWith('invalid-token');
    expect(next).toHaveBeenCalledTimes(1);

    const error = next.mock.calls.at(0)?.[0];
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect((error as UnauthorizedError).message).toBe('Invalid or expired token');
  });

  it('returns a recognizable error for an expired demo JWT', async () => {
    const req = createMockRequest({
      headers: {
        authorization: `Bearer e30.${Buffer.from(JSON.stringify({ kind: 'DEMO' })).toString('base64url')}.signature`,
      },
    });
    const res = createMockResponse();
    const next = vi.fn<(error?: unknown) => void>();
    const error = Object.assign(new Error('expired'), { code: 'ERR_JWT_EXPIRED' });

    vi.mocked(authJwt.verifyAccessToken).mockRejectedValue(error);

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Demo access has expired', code: 'DEMO_EXPIRED' }),
    );
  });

  it('sets req.user.id and calls next with no error when token is valid', async () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer valid-token' },
    });
    const res = createMockResponse();
    const next = vi.fn<(error?: unknown) => void>();

    vi.mocked(authJwt.verifyAccessToken).mockResolvedValue({
      sub: 'user-123',
      kind: 'OWNER',
    });

    await requireAuth(req, res, next);

    expect(authJwt.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual({ id: 'user-123', kind: 'OWNER', demoExpiresAt: null });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects an expired demo token before reaching protected handlers', async () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer expired-demo-token' },
    });
    const res = createMockResponse();
    const next = vi.fn<(error?: unknown) => void>();

    vi.mocked(authJwt.verifyAccessToken).mockResolvedValue({
      sub: 'demo-123',
      kind: 'DEMO',
      demoExpiresAt: '2020-01-01T00:00:00.000Z',
    });

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Demo access has expired', code: 'DEMO_EXPIRED' }),
    );
  });

  it('rejects a deleted demo owner with a recognizable expiry error', async () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer deleted-demo-token' },
    });
    const res = createMockResponse();
    const next = vi.fn<(error?: unknown) => void>();

    vi.mocked(authJwt.verifyAccessToken).mockResolvedValue({
      sub: 'deleted-demo-123',
      kind: 'DEMO',
      demoExpiresAt: '2099-01-01T00:00:00.000Z',
    });
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Demo access has expired', code: 'DEMO_EXPIRED' }),
    );
  });

  it('allows an active demo owner after checking persisted expiry', async () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer active-demo-token' },
    });
    const res = createMockResponse();
    const next = vi.fn<(error?: unknown) => void>();
    const now = new Date(Date.now() + 60_000);

    vi.mocked(authJwt.verifyAccessToken).mockResolvedValue({
      sub: 'active-demo-123',
      kind: 'DEMO',
      demoExpiresAt: now.toISOString(),
    });
    vi.mocked(userRepository.findById).mockResolvedValue({
      id: 'active-demo-123',
      email: null,
      passwordHash: null,
      kind: 'DEMO',
      name: 'Demo',
      lastName: 'Visitor',
      phone: null,
      photoUrl: null,
      timezone: 'America/Argentina/Buenos_Aires',
      demoExpiresAt: now,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
