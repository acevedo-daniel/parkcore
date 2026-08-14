import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./user.repository.js', () => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  update: vi.fn(),
}));

import type { User } from '../../../prisma/generated/client.js';
import { NotFoundError } from '../../errors/index.js';
import type { UpdateProfile } from './user.schema.js';
import * as userRepository from './user.repository.js';
import { getById, updateProfile } from './user.service.js';

const buildUser = (overrides?: Partial<User>): User => {
  const now = new Date('2026-02-21T12:00:00.000Z');

  return {
    id: 'user-1',
    email: 'user@parkcore.test',
    passwordHash: 'hashed-secret',
    name: 'John',
    lastName: 'Doe',
    phone: '1234567890',
    photoUrl: null,
    createdAt: now,
    updatedAt: now,
    ...(overrides ?? {}),
  };
};

describe('user.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('returns user response without passwordHash', async () => {
      const user = buildUser();
      vi.mocked(userRepository.findById).mockResolvedValue(user);

      const result = await getById('user-1');

      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        phone: user.phone,
        photoUrl: user.photoUrl,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws NotFoundError when user does not exist', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);
      const promise = getById('missing-user');

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('updates profile and returns sanitized user response', async () => {
      const updateData: UpdateProfile = {
        name: 'Jane',
        phone: '0987654321',
      };
      const updatedUser = buildUser({
        name: 'Jane',
        phone: '0987654321',
      });
      vi.mocked(userRepository.update).mockResolvedValue(updatedUser);

      const result = await updateProfile('user-1', updateData);

      expect(userRepository.update).toHaveBeenCalledWith('user-1', updateData);
      expect(result).toEqual({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        photoUrl: updatedUser.photoUrl,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      });
      expect(result).not.toHaveProperty('passwordHash');
    });
  });
});
