import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';
import { verifyAccessToken } from '../features/auth/auth.jwt.js';

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
      next(new UnauthorizedError('Demo access has expired'));
      return;
    }

    next();
  } catch {
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
