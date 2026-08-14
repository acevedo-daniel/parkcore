import { UnauthorizedError } from '../errors/index.js';

interface RequestWithOptionalUser {
  user?: { id: string };
}

export function getAuthenticatedUserId(req: RequestWithOptionalUser): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}
