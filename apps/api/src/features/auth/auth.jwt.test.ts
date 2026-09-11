import { describe, expect, it } from 'vitest';
import { signAccessToken, verifyAccessToken } from './auth.jwt.js';

describe('access token expiry', () => {
  it('uses the demo expiration as the JWT expiration boundary', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const token = await signAccessToken(
      {
        sub: 'demo-user',
        kind: 'DEMO',
        demoExpiresAt: expiresAt.toISOString(),
      },
      { expiresAt },
    );

    await expect(
      verifyAccessToken(token, { currentDate: new Date(expiresAt.getTime() - 1_000) }),
    ).resolves.toMatchObject({ sub: 'demo-user', kind: 'DEMO' });

    await expect(
      verifyAccessToken(token, { currentDate: new Date(expiresAt.getTime() + 1_000) }),
    ).rejects.toThrow();
  });
});
