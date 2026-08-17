import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/index.js';
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
    };

    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
