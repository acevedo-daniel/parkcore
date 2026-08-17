import { describe, expect, it } from 'vitest';

import { ForbiddenError } from '../errors/index.js';

import { createCorsOriginValidator } from './cors.js';

const validateOrigin = (
  nodeEnv: 'development' | 'production' | 'test',
  allowedOrigins: string[],
  origin?: string,
) => {
  const validator = createCorsOriginValidator(nodeEnv, allowedOrigins);

  return new Promise<{ allowed?: boolean; error: Error | null }>((resolve) => {
    validator(origin, (error, allowed) => {
      resolve({ error, allowed });
    });
  });
};

describe('CORS origin validator', () => {
  it('allows an explicitly configured production web origin', async () => {
    await expect(
      validateOrigin('production', ['https://web.example.test'], 'https://web.example.test'),
    ).resolves.toEqual({ allowed: true, error: null });
  });

  it('rejects an unconfigured production browser origin', async () => {
    const result = await validateOrigin(
      'production',
      ['https://web.example.test'],
      'https://untrusted.example.test',
    );

    expect(result.allowed).toBeUndefined();
    expect(result.error).toBeInstanceOf(ForbiddenError);
  });

  it('allows local development browser origins and non-browser requests', async () => {
    await expect(validateOrigin('development', [], 'http://localhost:4173')).resolves.toEqual({
      allowed: true,
      error: null,
    });
    await expect(validateOrigin('production', ['https://web.example.test'])).resolves.toEqual({
      allowed: true,
      error: null,
    });
  });
});
