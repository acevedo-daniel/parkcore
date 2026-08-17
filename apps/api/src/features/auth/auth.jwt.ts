import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../../config/env.js';

interface AccessTokenPayload extends JWTPayload {
  sub: string;
}

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const signAccessToken = async (payload: AccessTokenPayload): Promise<string> => {
  const { sub, ...claims } = payload;

  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
};

export const verifyAccessToken = async (token: string): Promise<AccessTokenPayload> => {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ['HS256'],
  });

  if (typeof payload.sub !== 'string' || payload.sub.length === 0)
    throw new Error('Invalid access token payload');

  return payload as AccessTokenPayload;
};
