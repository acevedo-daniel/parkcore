import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockWarn, mockError } = vi.hoisted(() => ({
  mockWarn: vi.fn(),
  mockError: vi.fn(),
}));

vi.mock('../lib/logger.js', () => ({
  logger: {
    warn: mockWarn,
    error: mockError,
  },
}));

import { AppError } from '../errors/app-error.js';
import { createMockRequest, createMockResponse } from '../../tests/helpers/mocks.js';
import { errorHandler } from './error-handler.middleware.js';

describe('errorHandler middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns operational AppError status and message', () => {
    const req = createMockRequest({ path: '/auth/register' });
    const res = createMockResponse();
    res.headersSent = false;
    const next = vi.fn<(error?: unknown) => void>();

    errorHandler(
      new AppError('Email already in use', 409),
      req,
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Email already in use',
    });
    expect(mockWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Email already in use',
        statusCode: 409,
        path: '/auth/register',
      }),
      'Operational error',
    );
    expect(mockError).not.toHaveBeenCalled();
  });

  it('returns 500 and safe message for unexpected errors', () => {
    const req = createMockRequest({ path: '/auth/login' });
    const res = createMockResponse();
    res.headersSent = false;
    const next = vi.fn<(error?: unknown) => void>();

    errorHandler(
      new Error('boom'),
      req,
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Internal Server Error',
    });
    expect(mockError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'boom',
        path: '/auth/login',
      }),
      'Unexpected error',
    );
  });

  it('returns 400 for invalid JSON payload', () => {
    const req = createMockRequest({ path: '/parkings' });
    const res = createMockResponse();
    res.headersSent = false;
    const next = vi.fn<(error?: unknown) => void>();

    const jsonError = Object.assign(new SyntaxError('Unexpected token'), {
      status: 400,
      type: 'entity.parse.failed',
    });

    errorHandler(jsonError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Invalid JSON payload',
    });
    expect(mockWarn).not.toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  it('returns 413 for payload too large', () => {
    const req = createMockRequest({ path: '/bookings' });
    const res = createMockResponse();
    res.headersSent = false;
    const next = vi.fn<(error?: unknown) => void>();

    errorHandler(
      { type: 'entity.too.large' },
      req,
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Payload too large',
    });
    expect(mockWarn).not.toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  it('delegates to next when headers are already sent', () => {
    const req = createMockRequest({ path: '/users/me' });
    const res = createMockResponse();
    res.headersSent = true;
    const next = vi.fn<(error?: unknown) => void>();
    const error = new Error('already sent');

    errorHandler(error, req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
