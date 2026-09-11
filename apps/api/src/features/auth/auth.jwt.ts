import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../../config/env.js';

export type AccessTokenKind = 'OWNER' | 'DEMO' | 'SHOWCASE';

export interface AccessTokenPayload extends JWTPayload {
  sub: string;
  kind: AccessTokenKind;
  demoExpiresAt?: string;
}

export interface AccessTokenOptions {
  expiresAt?: Date;
}

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const signAccessToken = async (
  payload: AccessTokenPayload,
  options: AccessTokenOptions = {},
): Promise<string> => {
  const { sub, ...claims } = payload;
  const expiration = options.expiresAt
    ? Math.floor(options.expiresAt.getTime() / 1000)
    : env.JWT_EXPIRES_IN;

  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(secret);
};

export const verifyAccessToken = async (
  token: string,
  options: { currentDate?: Date } = {},
): Promise<AccessTokenPayload> => {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ['HS256'],
    currentDate: options.currentDate,
  });

  if (
    typeof payload.sub !== 'string' ||
    payload.sub.length === 0 ||
    !['OWNER', 'DEMO', 'SHOWCASE'].includes(String(payload.kind))
  )
    throw new Error('Invalid access token payload');

  if (payload.kind === 'DEMO') {
    if (
      typeof payload.demoExpiresAt !== 'string' ||
      Number.isNaN(Date.parse(payload.demoExpiresAt))
    ) {
      throw new Error('Invalid demo access token payload');
    }
  } else if (payload.demoExpiresAt !== undefined) {
    throw new Error('Invalid access token payload');
  }

  return payload as AccessTokenPayload;
};
