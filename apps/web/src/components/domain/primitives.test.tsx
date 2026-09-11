import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AttentionItem } from './attention-item.js';
import { AvailabilityIndicator } from './availability-indicator.js';
import { CheckInSuccess } from './check-in-success.js';
import { OccupancyMeter } from './parking.js';
import { PageHeader } from './page-header.js';
import { OperationalReceipt } from './session.js';
import { parkingSessionFixture } from '../../test/fixtures.js';

describe('domain primitives', () => {
  it('keeps availability and occupancy meanings visible beyond color', () => {
    render(
      <>
        <AvailabilityIndicator
          nextOpeningAt="2026-08-18T11:00:00.000Z"
          state="CLOSED"
          timezone="America/Argentina/Buenos_Aires"
        />
        <OccupancyMeter active={9} capacity={10} />
      </>,
    );

    expect(screen.getByText(/Closed now/)).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: '9 of 10 spaces occupied' })).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe(
      '9 of 10 occupied, 1 available (90%).',
    );
  });

  it('renders attention, page, check-in, and receipt structures with semantic actions', () => {
    const session = parkingSessionFixture({
      endTime: '2026-08-17T11:30:00.000Z',
      status: 'COMPLETED',
      totalAmountCents: 3100,
    });
    render(
      <MemoryRouter>
        <PageHeader eyebrow="Operations" id="page-title" title="Overview" />
        <ul>
          <AttentionItem
            description="No spaces remain."
            parkingTitle="Central Parking"
            state="FULL"
            to="/app/parkings/parking-1"
          />
        </ul>
        <CheckInSuccess
          onCheckInAnother={() => undefined}
          parkingTitle="Central Parking"
          session={session}
          to="/app/sessions/session-1"
        />
        <OperationalReceipt
          historyHref="/app/parkings/parking-1/sessions"
          parkingHref="/app/parkings/parking-1"
          parkingTitle="Central Parking"
          session={session}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByText('Full')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open context' })).toBeTruthy();
    expect(screen.getByRole('status', { name: 'Check-in confirmation' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to parking' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'View history' })).toBeTruthy();
    expect(screen.getByText('2 hours')).toBeTruthy();
  });
});
