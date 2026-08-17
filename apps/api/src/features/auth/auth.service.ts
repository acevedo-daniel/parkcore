import { hashPassword, verifyPassword } from './auth.password.js';
import { Prisma } from '../../../prisma/generated/client.js';
import { UnauthorizedError, ConflictError } from '../../errors/index.js';
import { signAccessToken } from './auth.jwt.js';
import * as userRepository from '../user/user.repository.js';
import { type Register, type Login, type AuthResponse } from './auth.schema.js';
import { toUserResponse } from '../user/user.schema.js';

const isUniqueEmailError = (error: unknown): boolean => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }

  const target = error.meta?.target;
  return Array.isArray(target) && target.includes('email');
};

export const register = async (dto: Register): Promise<AuthResponse> => {
  const existing = await userRepository.findByEmail(dto.email);
  if (existing) {
    throw new ConflictError('Email already in use');
  }

  const passwordHash = await hashPassword(dto.password);

  let user;
  try {
    user = await userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });
  } catch (error) {
    if (isUniqueEmailError(error)) {
      throw new ConflictError('Email already in use');
    }
    throw error;
  }

  const accessToken = await signAccessToken({ sub: user.id });

  return {
    user: toUserResponse(user),
    accessToken,
  };
};

export const login = async (dto: Login): Promise<AuthResponse> => {
  const user = await userRepository.findByEmail(dto.email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isValidPassword = await verifyPassword(user.passwordHash, dto.password);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const accessToken = await signAccessToken({ sub: user.id });

  return {
    user: toUserResponse(user),
    accessToken,
  };
};
