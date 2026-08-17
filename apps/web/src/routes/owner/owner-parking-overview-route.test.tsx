import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '../../components/ui/feedback.js';
import { parkingFixture, parkingSessionFixture } from '../../test/fixtures.js';
import { OwnerParkingOverviewRoute } from './owner-parking-overview-route.js';

const api = vi.hoisted(() => ({
  checkIn: vi.fn(),
  getActiveSessions: vi.fn(),
  getOwnedParkings: vi.fn(),
}));

vi.mock('../../lib/api/owner-api.js', () => api);

function renderOverview() {
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
});
