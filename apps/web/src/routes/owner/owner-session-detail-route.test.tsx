import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '../../components/ui/feedback.js';
import { ApiError } from '../../lib/api/api-error.js';
import { parkingFixture, parkingSessionFixture } from '../../test/fixtures.js';
import { OwnerSessionDetailRoute } from './owner-session-detail-route.js';

const api = vi.hoisted(() => ({
  cancelParkingSession: vi.fn(),
  checkOut: vi.fn(),
  getOwnedParkings: vi.fn(),
  getParkingSession: vi.fn(),
}));

vi.mock('../../lib/api/owner-api.js', () => api);

function renderSessionDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/app/sessions/session-1']}>
          <Routes>
            <Route path="/app/sessions/:sessionId" element={<OwnerSessionDetailRoute />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

function arrangeActiveSession() {
  const session = parkingSessionFixture();
  api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
  api.getParkingSession.mockResolvedValue(session);
  api.checkOut.mockResolvedValue(
    parkingSessionFixture({
      endTime: '2026-08-17T10:30:00.000Z',
      status: 'COMPLETED',
      totalAmountCents: 1550,
    }),
  );
  api.cancelParkingSession.mockResolvedValue(
    parkingSessionFixture({
      endTime: '2026-08-17T13:15:00.000Z',
      status: 'CANCELLED',
      updatedAt: '2026-08-17T13:15:00.000Z',
    }),
  );
}

afterEach(() => {
  Object.values(api).forEach((mock) => mock.mockReset());
});

describe('parking session completion', () => {
  it('shows the checkout calculation before asking the backend to complete an active session', async () => {
    const user = userEvent.setup();
    arrangeActiveSession();
    renderSessionDetail();

    expect(await screen.findByRole('button', { name: 'Check out' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Check out' }));
    const dialog = await screen.findByRole('dialog', { name: 'Complete checkout' });
    expect(dialog).toBeTruthy();
    expect(screen.getByText('Current calculation')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Complete checkout' }));

    await waitFor(() => {
      expect(api.checkOut.mock.calls[0]?.[0]).toBe('session-1');
    });
    expect(screen.getByText('Session checked out.')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Operational receipt' })).toBeTruthy();
  });

  it('requires an explicit destructive cancellation action for an active session', async () => {
    const user = userEvent.setup();
    arrangeActiveSession();
    renderSessionDetail();

    await screen.findByRole('button', { name: 'Cancel session' });
    await user.click(screen.getByRole('button', { name: 'Cancel session' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel active session' });
    expect(dialog).toBeTruthy();
    expect(
      screen.getByText('The parking will be available for a new check-in after cancellation.'),
    ).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel session' }));

    await waitFor(() => {
      expect(api.cancelParkingSession.mock.calls[0]?.[0]).toBe('session-1');
    });
    expect(screen.getByText('Session cancelled.')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Cancelled session' })).toBeTruthy();
    expect(screen.getByText('Aug 17, 10:15 AM')).toBeTruthy();
    expect(screen.getAllByText('No charge')).toHaveLength(2);
  });
});

describe('parking session terminal states', () => {
  it('shows the server total and removes mutation controls after completion', async () => {
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getParkingSession.mockResolvedValue(
      parkingSessionFixture({
        endTime: '2026-08-17T10:00:00.000Z',
        status: 'COMPLETED',
        totalAmountCents: 3100,
      }),
    );
    renderSessionDetail();

    expect(await screen.findByRole('region', { name: 'Operational receipt' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Check out' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel session' })).toBeNull();
    expect(screen.getAllByText('$31.00')).toHaveLength(3);
    expect(screen.getByText('1 hour')).toBeTruthy();
  });

  it('uses the parking timezone for active session timestamps', async () => {
    api.getOwnedParkings.mockResolvedValue([
      parkingFixture({ timezone: 'America/Argentina/Buenos_Aires' }),
    ]);
    api.getParkingSession.mockResolvedValue(
      parkingSessionFixture({ startTime: '2026-08-17T23:30:00.000Z' }),
    );
    renderSessionDetail();

    expect(await screen.findByText('Aug 17, 08:30 PM')).toBeTruthy();
    expect(screen.queryByText('Aug 17, 11:30 PM')).toBeNull();
  });

  it('shows a degraded state instead of formatting with browser time when parking context is missing', async () => {
    api.getOwnedParkings.mockResolvedValue([]);
    api.getParkingSession.mockResolvedValue(parkingSessionFixture());
    renderSessionDetail();

    expect(await screen.findByText('This facility is not available in your account.')).toBeTruthy();
    expect(screen.queryByRole('time')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Check out' })).toBeNull();
  });

  it('shows a localized parking loading error without rendering session timestamps', async () => {
    api.getOwnedParkings.mockRejectedValue(new Error('Facilities unavailable.'));
    api.getParkingSession.mockResolvedValue(parkingSessionFixture());
    renderSessionDetail();

    expect(
      await screen.findByText('We could not load your facilities. Please try again.'),
    ).toBeTruthy();
    expect(screen.queryByRole('time')).toBeNull();
  });

  it('reconciles a checkout race with the authoritative terminal session', async () => {
    const user = userEvent.setup();
    const completedSession = parkingSessionFixture({
      endTime: '2026-08-17T10:00:00.000Z',
      status: 'COMPLETED',
      totalAmountCents: 3100,
    });
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getParkingSession
      .mockResolvedValueOnce(parkingSessionFixture())
      .mockResolvedValueOnce(completedSession);
    api.checkOut.mockRejectedValue(
      new ApiError('The session is no longer active.', 409, 'SESSION_NOT_ACTIVE'),
    );
    renderSessionDetail();

    await user.click(await screen.findByRole('button', { name: 'Check out' }));
    const dialog = await screen.findByRole('dialog', { name: 'Complete checkout' });
    await user.click(within(dialog).getByRole('button', { name: 'Complete checkout' }));

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Operational receipt' })).toBeTruthy();
    });
    expect(screen.queryByRole('button', { name: 'Check out' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel session' })).toBeNull();
    expect(
      screen.getByText('This session was already updated. Review its current state.'),
    ).toBeTruthy();
  });

  it('reconciles a cancellation race with the authoritative cancelled session', async () => {
    const user = userEvent.setup();
    const cancelledSession = parkingSessionFixture({
      endTime: '2026-08-17T13:15:00.000Z',
      status: 'CANCELLED',
      updatedAt: '2026-08-17T13:15:00.000Z',
    });
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getParkingSession
      .mockResolvedValueOnce(parkingSessionFixture())
      .mockResolvedValueOnce(cancelledSession);
    api.cancelParkingSession.mockRejectedValue(
      new ApiError('The session is no longer active.', 409, 'SESSION_NOT_ACTIVE'),
    );
    renderSessionDetail();

    await user.click(await screen.findByRole('button', { name: 'Cancel session' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel active session' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel session' }));

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Cancelled session' })).toBeTruthy();
    });
    expect(screen.queryByRole('button', { name: 'Check out' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel session' })).toBeNull();
    expect(
      screen.getByText('This session was already updated. Review its current state.'),
    ).toBeTruthy();
  });
});
