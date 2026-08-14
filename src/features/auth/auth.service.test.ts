import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth.password.js', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('./auth.jwt.js', () => ({
  signAccessToken: vi.fn(),
}));

vi.mock('../user/user.repository.js', () => ({
  findByEmail: vi.fn(),
  create: vi.fn(),
}));

import { Prisma, type User } from '../../../prisma/generated/client.js';
import { buildLoginDto, buildRegisterDto } from '../../../tests/helpers/builders.js';
import { ConflictError, UnauthorizedError } from '../../errors/index.js';
import * as userRepository from '../user/user.repository.js';
import * as authJwt from './auth.jwt.js';
import * as authPassword from './auth.password.js';
import { login, register } from './auth.service.js';

const buildUser = (overrides?: Partial<User>): User => {
  const now = new Date('2026-02-21T00:00:00.000Z');

  return {
    id: 'user-1',
    email: 'user@parkcore.test',
    passwordHash: 'hash-1',
    name: 'Test',
    lastName: null,
    phone: null,
    photoUrl: null,
    createdAt: now,
    updatedAt: now,
    ...(overrides ?? {}),
  };
};

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a user and returns access token', async () => {
    const dto = buildRegisterDto({ email: 'new@parkcore.test', password: 'Passw0rd!123' });
    const createdUser = buildUser({ email: dto.email, name: dto.name });

    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(authPassword.hashPassword).mockResolvedValue('hashed-password');
    vi.mocked(userRepository.create).mockResolvedValue(createdUser);
    vi.mocked(authJwt.signAccessToken).mockResolvedValue('token-123');

    const result = await register(dto);

    const expectedUser = {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      lastName: createdUser.lastName,
      phone: createdUser.phone,
      photoUrl: createdUser.photoUrl,
      createdAt: createdUser.createdAt.toISOString(),
      updatedAt: createdUser.updatedAt.toISOString(),
    };

    expect(userRepository.findByEmail).toHaveBeenCalledWith(dto.email);
    expect(authPassword.hashPassword).toHaveBeenCalledWith(dto.password);
    expect(userRepository.create).toHaveBeenCalledWith({
      email: dto.email,
      passwordHash: 'hashed-password',
      name: dto.name,
    });
    expect(authJwt.signAccessToken).toHaveBeenCalledWith({ sub: createdUser.id });
    expect(result).toEqual({
      user: expectedUser,
      accessToken: 'token-123',
    });
  });

  it('throws ConflictError when email already exists on register', async () => {
    const dto = buildRegisterDto({ email: 'existing@parkcore.test' });

    vi.mocked(userRepository.findByEmail).mockResolvedValue(buildUser({ email: dto.email }));

    const promise = register(dto);

    await expect(promise).rejects.toBeInstanceOf(ConflictError);
    await expect(promise).rejects.toThrow('Email already in use');

    expect(authPassword.hashPassword).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(authJwt.signAccessToken).not.toHaveBeenCalled();
  });

  it('throws ConflictError when register hits unique email constraint', async () => {
    const dto = buildRegisterDto({ email: 'race@parkcore.test' });
    const uniqueEmailError = Object.assign(
      Object.create(Prisma.PrismaClientKnownRequestError.prototype),
      { code: 'P2002', meta: { target: ['email'] } },
    ) as Prisma.PrismaClientKnownRequestError;

    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(authPassword.hashPassword).mockResolvedValue('hashed-password');
    vi.mocked(userRepository.create).mockRejectedValue(uniqueEmailError);

    const promise = register(dto);

    await expect(promise).rejects.toBeInstanceOf(ConflictError);
    await expect(promise).rejects.toThrow('Email already in use');

    expect(authJwt.signAccessToken).not.toHaveBeenCalled();
  });

  it('logs in and returns access token', async () => {
    const dto = buildLoginDto({ email: 'user@parkcore.test', password: 'Passw0rd!123' });
    const existingUser = buildUser({ email: dto.email, passwordHash: 'hash-2' });

    vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);
    vi.mocked(authPassword.verifyPassword).mockResolvedValue(true);
    vi.mocked(authJwt.signAccessToken).mockResolvedValue('token-456');

    const result = await login(dto);
    const expectedUser = {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      lastName: existingUser.lastName,
      phone: existingUser.phone,
      photoUrl: existingUser.photoUrl,
      createdAt: existingUser.createdAt.toISOString(),
      updatedAt: existingUser.updatedAt.toISOString(),
    };

    expect(userRepository.findByEmail).toHaveBeenCalledWith(dto.email);
    expect(authPassword.verifyPassword).toHaveBeenCalledWith(
      existingUser.passwordHash,
      dto.password,
    );
    expect(authJwt.signAccessToken).toHaveBeenCalledWith({ sub: existingUser.id });
    expect(result).toEqual({
      user: expectedUser,
      accessToken: 'token-456',
    });
  });

  it('throws UnauthorizedError when user does not exist on login', async () => {
    const dto = buildLoginDto({ email: 'missing@parkcore.test' });

    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    const promise = login(dto);

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(promise).rejects.toThrow('Invalid email or password');

    expect(authPassword.verifyPassword).not.toHaveBeenCalled();
    expect(authJwt.signAccessToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when password is invalid on login', async () => {
    const dto = buildLoginDto({ email: 'user@parkcore.test', password: 'wrong-password' });
    const existingUser = buildUser({ email: dto.email, passwordHash: 'hash-3' });

    vi.mocked(userRepository.findByEmail).mockResolvedValue(existingUser);
    vi.mocked(authPassword.verifyPassword).mockResolvedValue(false);

    const promise = login(dto);

    await expect(promise).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(promise).rejects.toThrow('Invalid email or password');

    expect(authJwt.signAccessToken).not.toHaveBeenCalled();
  });
});
