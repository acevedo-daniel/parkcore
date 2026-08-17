import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OccupancyMeter } from './parking.js';
import { Plate } from './plate.js';
import { ParkingStatus, SessionStatus } from './status.js';

describe('operational domain indicators', () => {
  it('renders vehicle plates with an explicit accessible identity', () => {
    render(<Plate plate="AB123CD" />);
    expect(screen.getByLabelText('Vehicle plate AB123CD').textContent).toBe('AB123CD');
  });

  it.each([
    [6, 'neutral'],
    [7, 'warning'],
    [9, 'critical'],
  ])('applies the %s/10 occupancy threshold as %s', (active, threshold) => {
    const { container } = render(<OccupancyMeter active={active} capacity={10} />);
    expect(container.firstElementChild?.getAttribute('class')).toContain(`occupancy-${threshold}`);
  });

  it('communicates parking and session states in plain language', () => {
    render(
      <>
        <ParkingStatus isActive={false} />
        <SessionStatus status="COMPLETED" />
        <SessionStatus status="CANCELLED" />
      </>,
    );

    expect(screen.getByText('Inactive')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('Cancelled')).toBeTruthy();
  });
});
