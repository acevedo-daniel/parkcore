import { describe, expect, it } from 'vitest';

import { getAuthPath, getReturnTo } from './auth-redirect.js';

describe('auth return targets', () => {
  it('keeps internal app paths with their query and hash', () => {
    const target = '/app/parkings/parking-1?tab=sessions&status=active#history';

    expect(getReturnTo(`?returnTo=${encodeURIComponent(target)}`)).toBe(target);
    expect(getAuthPath('/register', target)).toBe(
      '/register?returnTo=%2Fapp%2Fparkings%2Fparking-1%3Ftab%3Dsessions%26status%3Dactive%23history',
    );
  });

  it('falls back to the workspace root for external return targets', () => {
    expect(getReturnTo('?returnTo=https%3A%2F%2Fevil.example')).toBe('/app');
    expect(getReturnTo('?returnTo=%2F%2Fevil.example')).toBe('/app');
    expect(getAuthPath('/login', 'https://evil.example')).toBe('/login?returnTo=%2Fapp');
  });
});
