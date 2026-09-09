import { describe, expect, it } from 'vitest';

import { normalizePlate } from './plate.js';

describe('normalizePlate', () => {
  it('matches the API normalization contract', () => {
    expect(normalizePlate(' ab-123 cd ')).toBe('AB123CD');
  });
});
