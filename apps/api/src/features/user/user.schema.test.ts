import { describe, expect, it } from 'vitest';

import { updateProfileSchema } from './user.schema.js';

describe('updateProfileSchema', () => {
  it('accepts and trims a valid IANA timezone update', () => {
    expect(
      updateProfileSchema.parse({
        lastName: ' Smith ',
        timezone: ' Europe/Madrid ',
      }),
    ).toEqual({ lastName: 'Smith', timezone: 'Europe/Madrid' });
  });

  it('rejects an invalid IANA timezone update', () => {
    expect(() => updateProfileSchema.parse({ timezone: 'Mars/Olympus' })).toThrow(
      'Invalid IANA timezone',
    );
  });
});
