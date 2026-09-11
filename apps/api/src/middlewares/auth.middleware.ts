import type { NextFunction, Request, Response } from 'express';
import { decodeJwt } from 'jose';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';
import { verifyAccessToken } from '../features/auth/auth.jwt.js';
import * as userRepository from '../features/user/user.repository.js';

const DEMO_EXPIRED_CODE = 'DEMO_EXPIRED';

const expiredDemoError = () => new UnauthorizedError('Demo access has expired', DEMO_EXPIRED_CODE);

const isExpiredJwt = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'ERR_JWT_EXPIRED';

const isDemoToken = (token: string): boolean => {
  try {
    return decodeJwt(token).kind === 'DEMO';
  } catch {
    return false;
  }
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const header = req.headers.authorization;
  const [scheme, token, ...extra] = header?.trim().split(/\s+/) ?? [];

  if (scheme !== 'Bearer' || !token || extra.length > 0) {
    next(new UnauthorizedError('Missing token'));
    return;
  }

  try {
    const payload = await verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      kind: payload.kind,
      demoExpiresAt: payload.demoExpiresAt ?? null,
    };

    if (
      payload.kind === 'DEMO' &&
      (!payload.demoExpiresAt || new Date(payload.demoExpiresAt).getTime() <= Date.now())
    ) {
      next(expiredDemoError());
      return;
    }

    if (payload.kind === 'DEMO') {
      const user = await userRepository.findById(payload.sub);
      if (user?.kind !== 'DEMO' || (user.demoExpiresAt?.getTime() ?? 0) <= Date.now()) {
        next(expiredDemoError());
        return;
      }
    }

    next();
  } catch (error: unknown) {
    if (isExpiredJwt(error) && isDemoToken(token)) {
      next(expiredDemoError());
      return;
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const requireOperator = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new UnauthorizedError('Missing token'));
    return;
  }

  if (req.user.kind === 'SHOWCASE') {
    next(new ForbiddenError('This account cannot operate parking facilities'));
    return;
  }

  next();
};

export const requireDemo = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new UnauthorizedError('Missing token'));
    return;
  }

  if (req.user.kind !== 'DEMO') {
    next(new ForbiddenError('Demo reset is not available for this account'));
    return;
  }

  next();
};
