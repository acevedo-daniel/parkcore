import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '../../components/ui/feedback.js';
import { ApiError } from '../../lib/api/api-error.js';
import { parkingFixture, parkingSessionFixture } from '../../test/fixtures.js';
import { OwnerParkingOverviewRoute } from './owner-parking-overview-route.js';

const api = vi.hoisted(() => ({
  checkIn: vi.fn(),
  getActiveSessions: vi.fn(),
  getOwnedParkings: vi.fn(),
  lookupVehicle: vi.fn(),
}));

vi.mock('../../lib/api/owner-api.js', () => api);

function renderOverview() {
  api.lookupVehicle.mockResolvedValue({ vehicle: null });
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/app/parkings/parking-1']}>
          <Routes>
            <Route path="/app/parkings/:parkingId" element={<OwnerParkingOverviewRoute />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  api.checkIn.mockReset();
  api.getActiveSessions.mockReset();
  api.getOwnedParkings.mockReset();
  api.lookupVehicle.mockReset();
});

describe('parking operations', () => {
  it('shows an empty operation and starts a typed check-in from the parking overview', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getActiveSessions.mockResolvedValue([]);
    api.checkIn.mockResolvedValue(parkingSessionFixture());
    renderOverview();

    expect(await screen.findByText('No active sessions')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Check in' }));
    expect(await screen.findByRole('dialog', { name: 'Check in vehicle' })).toBeTruthy();
    await user.type(screen.getByLabelText('Plate'), ' ab-123 cd ');
    await user.click(screen.getByRole('button', { name: 'Start session' }));

    await waitFor(() => {
      expect(api.checkIn.mock.calls[0]?.slice(0, 2)).toEqual([
        'parking-1',
        {
          brand: undefined,
          customerName: undefined,
          customerPhone: undefined,
          model: undefined,
          notes: undefined,
          plate: 'AB123CD',
          type: 'CAR',
        },
      ]);
    });
    expect(screen.getByText('AB123CD checked in.')).toBeTruthy();
  });

  it('keeps active sessions scan-friendly in the parking operation', async () => {
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getActiveSessions.mockResolvedValue([parkingSessionFixture()]);
    renderOverview();

    expect(await screen.findByRole('link', { name: 'Open session for AB123CD' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open session for AB123CD' }).textContent).toContain(
      'Active',
    );
  });

  it('keeps capacity based on all active sessions while filtering by plate', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([
      parkingFixture({
        activeSessionCount: 1,
        availableSpaces: 11,
        occupancyPercent: 8.333333333333334,
      }),
    ]);
    api.getActiveSessions
      .mockResolvedValueOnce([parkingSessionFixture()])
      .mockResolvedValueOnce([]);
    renderOverview();

    await screen.findByRole('link', { name: 'Open session for AB123CD' });
    await user.type(screen.getByRole('textbox', { name: 'Search plate' }), 'zzzz');

    expect(await screen.findByText('No matching active sessions')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: '1 of 12 spaces occupied' })).toBeTruthy();
    expect(api.getActiveSessions).toHaveBeenLastCalledWith('parking-1', { plate: 'ZZZZ' });
  });

  it('does not expose any check-in path for an inactive parking', async () => {
    api.getOwnedParkings.mockResolvedValue([
      parkingFixture({ availabilityState: 'PAUSED', isActive: false }),
    ]);
    api.getActiveSessions.mockResolvedValue([]);
    renderOverview();

    const checkIn = await screen.findByRole('button', { name: /^Check in$/ });
    expect((checkIn as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Check in vehicle' })).toBeNull();
    expect(
      screen.getByText('This facility is paused. Reactivate it before accepting new check-ins.'),
    ).toBeTruthy();
  });

  it.each([
    ['AVAILABLE', 'Available', true, 'Ready for the next vehicle.'],
    ['LIMITED', 'Limited spaces', true, 'Limited spaces available'],
    ['FULL', 'Full', false, 'No spaces available'],
    ['CLOSED', 'Closed now', false, 'Closed right now'],
    ['PAUSED', 'Paused', false, 'Parking paused'],
  ] as const)(
    'renders the authoritative %s operation state',
    async (state, label, enabled, title) => {
      api.getOwnedParkings.mockResolvedValue([
        parkingFixture({
          availabilityState: state,
          isActive: state !== 'PAUSED',
          isOpen: state !== 'CLOSED',
          ...(state === 'CLOSED' ? { nextOpeningAt: '2026-08-18T11:00:00.000Z' } : {}),
        }),
      ]);
      api.getActiveSessions.mockResolvedValue([]);
      renderOverview();

      expect(await screen.findByText(state === 'CLOSED' ? new RegExp(label) : label)).toBeTruthy();
      expect(screen.getByRole('heading', { name: title })).toBeTruthy();
      expect(screen.getByRole('button', { name: /^Check in$/ })).toHaveProperty(
        'disabled',
        !enabled,
      );
    },
  );

  it('keeps snapshot occupancy visible when the active-session list fails', async () => {
    api.getOwnedParkings.mockResolvedValue([
      parkingFixture({ activeSessionCount: 4, availableSpaces: 8, occupancyPercent: 33.333 }),
    ]);
    api.getActiveSessions.mockRejectedValue(new Error('active list unavailable'));
    renderOverview();

    expect(
      await screen.findByText('We could not load active stays. Please try again.'),
    ).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: '4 of 12 spaces occupied' })).toBeTruthy();
  });

  it('keeps stale active-session data visible after a refresh failure', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getActiveSessions
      .mockResolvedValueOnce([parkingSessionFixture()])
      .mockRejectedValueOnce(new Error('active list unavailable'));
    renderOverview();

    expect(await screen.findByRole('link', { name: 'Open session for AB123CD' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Refresh active stays' }));

    expect(await screen.findByText('The active-stay list may be out of date.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open session for AB123CD' })).toBeTruthy();
  });

  it.each([
    [
      'VEHICLE_ALREADY_ACTIVE',
      'This plate already has an active stay here. Open it from the active list.',
    ],
    ['CHECK_IN_RACE', 'The operation changed while you checked in. Refresh and try again.'],
  ] as const)('preserves form values for a %s check-in conflict', async (code, message) => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getActiveSessions.mockResolvedValue([]);
    api.checkIn.mockRejectedValue(new ApiError('conflict', 409, code));
    renderOverview();

    await screen.findByText('No active sessions');
    await user.click(screen.getByRole('button', { name: 'Check in' }));
    await screen.findByRole('dialog', { name: 'Check in vehicle' });
    await user.type(screen.getByLabelText('Plate'), 'ab-123 cd');
    await user.type(screen.getByLabelText('Brand'), 'Toyota');
    await user.click(screen.getByRole('button', { name: 'Start session' }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(readInputValue('Plate')).toBe('ab-123 cd');
    expect(readInputValue('Brand')).toBe('Toyota');
    expect(screen.getByRole('dialog', { name: 'Check in vehicle' })).toBeTruthy();
  });

  it('sorts active sessions oldest first', async () => {
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getActiveSessions.mockResolvedValue([
      parkingSessionFixture({
        id: 'newer-session',
        startTime: '2026-08-17T10:30:00.000Z',
        vehicle: { ...parkingSessionFixture().vehicle, plate: 'CD456EF' },
      }),
      parkingSessionFixture({
        id: 'older-session',
        startTime: '2026-08-17T09:30:00.000Z',
      }),
    ]);
    renderOverview();

    const sessions = await screen.findAllByRole('link', { name: /Open session for/ });
    expect(sessions.map((session) => session.getAttribute('href'))).toEqual([
      '/app/sessions/older-session',
      '/app/sessions/newer-session',
    ]);
  });
});

function readInputValue(label: string) {
  const element = screen.getByLabelText(label);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`${label} did not resolve to an input`);
  }
  return element.value;
}
