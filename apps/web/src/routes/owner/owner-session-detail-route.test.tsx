import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '../../components/ui/feedback.js';
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
  api.cancelParkingSession.mockResolvedValue(parkingSessionFixture({ status: 'CANCELLED' }));
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
  });

  it('requires an explicit destructive cancellation action for an active session', async () => {
    const user = userEvent.setup();
    arrangeActiveSession();
    renderSessionDetail();

    await screen.findByRole('button', { name: 'Cancel session' });
    await user.click(screen.getByRole('button', { name: 'Cancel session' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel active session' });
    expect(dialog).toBeTruthy();
    expect(screen.getByText('The parking will be available for a new check-in after cancellation.'))
      .toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel session' }));

    await waitFor(() => {
      expect(api.cancelParkingSession.mock.calls[0]?.[0]).toBe('session-1');
    });
    expect(screen.getByText('Session cancelled.')).toBeTruthy();
  });
});
