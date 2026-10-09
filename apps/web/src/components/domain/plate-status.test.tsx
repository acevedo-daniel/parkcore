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
    [6, 'success'],
    [7, 'warning'],
    [9, 'destructive'],
  ])('exposes the %s/10 occupancy tone as %s', (active, tone) => {
    render(<OccupancyMeter active={active} capacity={10} />);
    expect(screen.getByRole('progressbar').getAttribute('data-tone')).toBe(tone);
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
