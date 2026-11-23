import { describe, expect, it } from 'vitest';

import { cn } from './cn.js';

describe('cn', () => {
  it('lets a type role replace inherited size, leading, tracking, weight, and family classes', () => {
    expect(
      cn('text-sm font-medium leading-tight tracking-wide font-sans', 'type-section-title'),
    ).toBe('type-section-title');
  });

  it('keeps layout and color classes next to a type role', () => {
    expect(cn('mt-4 text-foreground', 'type-heading')).toBe('mt-4 text-foreground type-heading');
  });

  it('leaves operational and code styles combinable with a size', () => {
    expect(cn('text-sm', 'type-operational')).toBe('text-sm type-operational');
    expect(cn('text-sm', 'type-code')).toBe('text-sm type-code');
  });
});
