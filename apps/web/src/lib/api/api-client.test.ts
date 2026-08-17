import { describe, expect, it } from 'vitest';

import { resolveApiBaseUrl } from './api-client.js';

describe('resolveApiBaseUrl', () => {
  it('uses the configured public API URL', () => {
    expect(resolveApiBaseUrl(' https://api.example.test ', true)).toBe('https://api.example.test');
  });

  it('uses the local default only outside production', () => {
    expect(resolveApiBaseUrl(undefined, false)).toBe('http://localhost:3000');
  });

  it('fails fast when a production API URL is absent', () => {
    expect(() => resolveApiBaseUrl(undefined, true)).toThrow(
      'VITE_API_URL is required in production.',
    );
  });
});
