import { Prisma, type User } from '../../../prisma/generated/client.js';
import { env } from '../../config/env.js';
import { ConflictError, ForbiddenError } from '../../errors/index.js';
import { logger } from '../../lib/logger.js';
import { signAccessToken } from '../auth/auth.jwt.js';
import { toUserResponse } from '../user/user.schema.js';
import * as userRepository from '../user/user.repository.js';
import * as demoRepository from './demo.repository.js';
import type { DemoLoginResponse, DemoResetResponse, DemoStatusResponse } from './demo.schema.js';

const isActiveDemo = (user: User | null): user is User =>
  user?.kind === 'DEMO' && user.demoExpiresAt !== null && user.demoExpiresAt.getTime() > Date.now();

export async function getStatus(): Promise<DemoStatusResponse> {
  const user = await userRepository.findById(env.DEMO_USER_ID);
  return { available: isActiveDemo(user) };
}

export async function login(): Promise<DemoLoginResponse> {
  const user = await userRepository.findById(env.DEMO_USER_ID);
  if (!isActiveDemo(user)) {
    throw new ConflictError('Demo access is temporarily unavailable');
  }
  const demoExpiresAt = user.demoExpiresAt;
  if (!demoExpiresAt) {
    throw new ConflictError('Demo access is temporarily unavailable');
  }

  return {
    user: toUserResponse(user),
    accessToken: await signAccessToken(
      {
        sub: user.id,
        kind: user.kind,
        demoExpiresAt: demoExpiresAt.toISOString(),
      },
      { expiresAt: demoExpiresAt },
    ),
  };
}

export async function reset(userId: string): Promise<DemoResetResponse> {
  const user = await userRepository.findById(userId);
  if (user?.id !== env.DEMO_USER_ID || !isActiveDemo(user)) {
    logger.warn({ userId }, 'Rejected demo reset request');
    throw new ForbiddenError('Demo reset is not available for this account');
  }

  try {
    const restored = await demoRepository.restoreDemoOwnerData(user.id);
    if (!restored) {
      logger.info({ userId: user.id }, 'Demo reset already in progress');
      throw new ConflictError('Demo reset is already in progress');
    }

    logger.info({ userId: user.id }, 'Demo data restored');
    return { restored: true };
  } catch (error) {
    if (error instanceof ConflictError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      throw new ConflictError('Demo reset is already in progress');
    }
    logger.error({ err: error, userId: user.id }, 'Demo reset failed');
    throw error;
  }
}
