import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './skeleton.js';

describe('Skeleton', () => {
  it('keeps busy placeholders hidden from assistive technology by default', () => {
    const { container } = render(<Skeleton className="h-10" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');

    expect(skeleton).not.toBeNull();
    expect(skeleton?.getAttribute('aria-busy')).toBe('true');
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
  });
});
