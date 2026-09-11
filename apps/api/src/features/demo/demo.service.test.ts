import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../auth/auth.jwt.js', () => ({ signAccessToken: vi.fn() }));
vi.mock('../user/user.repository.js', () => ({ findByEmail: vi.fn(), findById: vi.fn() }));
vi.mock('./demo.repository.js', () => ({ restoreDemoOwnerData: vi.fn() }));
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
    id: 'demo-owner-id',
    email: 'owner@parkcore.dev',
    passwordHash: 'not-exposed',
    kind: 'OWNER',
    name: 'Demo',
    lastName: 'Owner',
    phone: null,
    photoUrl: null,
    timezone: 'America/Argentina/Buenos_Aires',
    demoExpiresAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

describe('demo.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports availability without exposing operator details', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(getStatus()).resolves.toEqual({ available: false });
    expect(userRepository.findByEmail).toHaveBeenCalledWith('owner@parkcore.dev');
  });

  it('creates a session for the configured demo owner without a password', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(demoOwner());
    vi.mocked(authJwt.signAccessToken).mockResolvedValue('demo-token');

    await expect(login()).resolves.toMatchObject({
      accessToken: 'demo-token',
      user: { email: 'owner@parkcore.dev', id: 'demo-owner-id' },
    });
    expect(authJwt.signAccessToken).toHaveBeenCalledWith({ sub: 'demo-owner-id' });
  });

  it('rejects reset attempts from another authenticated account', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(
      demoOwner({ email: 'another-owner@parkcore.dev' }),
    );

    await expect(reset('another-owner-id')).rejects.toBeInstanceOf(ForbiddenError);
    expect(demoRepository.restoreDemoOwnerData).not.toHaveBeenCalled();
  });

  it('reports a concurrent reset as a conflict', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(demoOwner());
    vi.mocked(demoRepository.restoreDemoOwnerData).mockResolvedValue(false);

    await expect(reset('demo-owner-id')).rejects.toBeInstanceOf(ConflictError);
  });

  it('restores canonical data for the demo owner', async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(demoOwner());
    vi.mocked(demoRepository.restoreDemoOwnerData).mockResolvedValue(true);

    await expect(reset('demo-owner-id')).resolves.toEqual({ restored: true });
    expect(demoRepository.restoreDemoOwnerData).toHaveBeenCalledWith('demo-owner-id');
  });
});
