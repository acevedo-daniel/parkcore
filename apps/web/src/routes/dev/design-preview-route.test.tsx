import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DesignPreviewRoute } from './design-preview-route.js';

describe('DesignPreviewRoute', () => {
  it('renders the design token and component sections', () => {
    render(<DesignPreviewRoute />);

    expect(screen.getByRole('main').getAttribute('data-slot')).toBe('design-preview');

    for (const heading of [
      'PageHeader',
      'type-scale',
      'color-registry',
      'Button',
      'FormField',
      'Card',
      'Table',
      'ParkingStatus / SessionStatus / Plate',
      'CapacityGauge',
      'EmptyState',
      'ErrorState',
    ]) {
      expect(screen.getByRole('heading', { name: heading })).toBeTruthy();
    }
  });
});
