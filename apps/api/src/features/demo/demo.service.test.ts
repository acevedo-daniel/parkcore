import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth/auth.jwt.js', () => ({ signAccessToken: vi.fn() }));
vi.mock('../user/user.repository.js', () => ({ findById: vi.fn() }));
vi.mock('./demo.repository.js', () => ({
  createDemoSandbox: vi.fn(),
  restoreDemoOwnerData: vi.fn(),
}));
vi.mock('../../lib/logger.js', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import type { User } from '../../../prisma/generated/client.js';
import { ConflictError, ForbiddenError } from '../../errors/index.js';
import * as authJwt from '../auth/auth.jwt.js';
import * as userRepository from '../user/user.repository.js';
import * as demoRepository from './demo.repository.js';
import { getStatus, login, reset } from './demo.service.js';

const demoOwner = (overrides: Partial<User> = {}): User => {
  const now = new Date('2026-01-15T12:00:00.000Z');
  return {
    id: '00000000-0000-4000-8000-000000000010',
    email: null,
    passwordHash: null,
    kind: 'DEMO',
    name: 'Demo',
    lastName: 'Owner',
    phone: null,
    photoUrl: null,
    timezone: 'America/Argentina/Buenos_Aires',
    demoExpiresAt: new Date('2099-01-15T12:00:00.000Z'),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

describe('demo.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports availability without exposing operator details', () => {
    expect(getStatus()).toEqual({ available: true });
  });

  it('creates a session for a new demo sandbox without a password', async () => {
    vi.mocked(demoRepository.createDemoSandbox).mockResolvedValue(demoOwner());
    vi.mocked(authJwt.signAccessToken).mockResolvedValue('demo-token');

    await expect(login()).resolves.toMatchObject({
      accessToken: 'demo-token',
      user: { email: null, id: '00000000-0000-4000-8000-000000000010', kind: 'DEMO' },
    });
    expect(authJwt.signAccessToken).toHaveBeenCalledWith(
      {
        sub: '00000000-0000-4000-8000-000000000010',
        kind: 'DEMO',
        demoExpiresAt: '2099-01-15T12:00:00.000Z',
      },
      { expiresAt: new Date('2099-01-15T12:00:00.000Z') },
    );
    expect(demoRepository.createDemoSandbox).toHaveBeenCalledOnce();
  });

  it('rejects reset attempts from another authenticated account', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(
      demoOwner({ id: 'another-owner-id', kind: 'OWNER' }),
    );

    await expect(reset('another-owner-id')).rejects.toBeInstanceOf(ForbiddenError);
    expect(demoRepository.restoreDemoOwnerData).not.toHaveBeenCalled();
  });

  it('reports a concurrent reset as a conflict', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(demoOwner());
    vi.mocked(demoRepository.restoreDemoOwnerData).mockResolvedValue(false);

    await expect(reset('00000000-0000-4000-8000-000000000010')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('rejects reset for an expired demo sandbox', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(
      demoOwner({ demoExpiresAt: new Date('2020-01-01T00:00:00.000Z') }),
    );

    await expect(reset('00000000-0000-4000-8000-000000000010')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(demoRepository.restoreDemoOwnerData).not.toHaveBeenCalled();
  });

  it('restores canonical data for the demo owner', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(demoOwner());
    vi.mocked(demoRepository.restoreDemoOwnerData).mockResolvedValue(true);

    await expect(reset('00000000-0000-4000-8000-000000000010')).resolves.toEqual({
      restored: true,
    });
    expect(demoRepository.restoreDemoOwnerData).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000010',
    );
  });
});
