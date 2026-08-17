import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CheckoutSummary, SessionRow } from './session.js';

const activeSession = {
  createdAt: '2026-08-17T09:30:00.000Z',
  currency: 'USD' as const,
  customerName: 'Ada Lovelace',
  customerPhone: null,
  endTime: null,
  hourlyRateCents: 1550,
  id: 'session-1',
  notes: null,
  parkingId: 'parking-1',
  startTime: '2026-08-17T09:30:00.000Z',
  status: 'ACTIVE' as const,
  totalAmountCents: null,
  updatedAt: '2026-08-17T09:30:00.000Z',
  vehicle: {
    brand: 'Toyota',
    id: 'vehicle-1',
    model: 'Corolla',
    plate: 'AB123CD',
    type: 'CAR' as const,
  },
  vehicleId: 'vehicle-1',
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('operational session components', () => {
  it('shows the current checkout calculation for a partial first hour', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T10:00:00.000Z'));
    render(<CheckoutSummary session={activeSession} />);

    expect(screen.getByText('Current calculation')).toBeTruthy();
    expect(screen.getByText('1 hour')).toBeTruthy();
    expect(screen.getByText('$15.50')).toBeTruthy();
  });

  it('keeps the plate and active status prominent in an operational row', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-17T10:00:00.000Z'));
    render(
      <MemoryRouter>
        <SessionRow session={activeSession} to="/app/sessions/session-1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('AB123CD')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Open session for AB123CD' }).getAttribute('href'),
    ).toBe('/app/sessions/session-1');
  });
});
