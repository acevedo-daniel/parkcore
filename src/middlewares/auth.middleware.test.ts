import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../features/auth/auth.jwt.js', () => ({
  verifyAccessToken: vi.fn(),
}));

import { createMockRequest, createMockResponse } from '../../tests/helpers/mocks.js';
import { UnauthorizedError } from '../errors/index.js';
import * as authJwt from '../features/auth/auth.jwt.js';
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

  it('sets req.user.id and calls next with no error when token is valid', async () => {
    const req = createMockRequest({
      headers: { authorization: 'Bearer valid-token' },
    });
    const res = createMockResponse();
    const next = vi.fn<(error?: unknown) => void>();

    vi.mocked(authJwt.verifyAccessToken).mockResolvedValue({ sub: 'user-123' });

    await requireAuth(req, res, next);

    expect(authJwt.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual({ id: 'user-123' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
