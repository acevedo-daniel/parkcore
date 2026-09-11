import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { components } from '@parkcore/api-client';
import { parkingFixture, parkingSessionFixture } from '../../test/fixtures.js';
import { OwnerParkingHistoryRoute } from './owner-parking-history-route.js';

const api = vi.hoisted(() => ({
  getOwnedParkings: vi.fn(),
  getParkingSessionsCsv: vi.fn(),
  getParkingSessions: vi.fn(),
}));

vi.mock('../../lib/api/owner-api.js', () => api);

type SessionList = components['schemas']['ParkingSessionListResponse'];

function sessionList(
  data: SessionList['data'],
  meta: Partial<SessionList['meta']> = {},
): SessionList {
  return {
    data,
    meta: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 20,
      page: 1,
      total: data.length,
      totalPages: 1,
      ...meta,
    },
    aggregate: {
      totalSessions: data.length,
      activeSessions: data.filter((session) => session.status === 'ACTIVE').length,
      completedSessions: data.filter((session) => session.status === 'COMPLETED').length,
      cancelledSessions: data.filter((session) => session.status === 'CANCELLED').length,
      revenueByCurrency: [],
    },
    timezone: 'America/Argentina/Buenos_Aires',
  };
}

function renderHistory(initialEntry = '/app/parkings/parking-1/sessions') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/app/parkings/:parkingId/sessions" element={<OwnerParkingHistoryRoute />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  api.getOwnedParkings.mockReset();
  api.getParkingSessionsCsv.mockReset();
  api.getParkingSessions.mockReset();
});

describe('parking session history pagination', () => {
  it('uses the normalized plate from URL state when loading history', async () => {
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getParkingSessions.mockResolvedValue(sessionList([parkingSessionFixture()]));
    renderHistory('/app/parkings/parking-1/sessions?plate=%20ab-123%20cd%20');

    await screen.findByRole('link', { name: 'Open session for AB123CD' });
    expect(api.getParkingSessions).toHaveBeenLastCalledWith('parking-1', {
      page: 1,
      plate: 'AB123CD',
      period: '30d',
    });
  });

  it('preserves the status filter while moving to the next page', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getParkingSessions
      .mockResolvedValueOnce(
        sessionList([parkingSessionFixture({ status: 'COMPLETED', totalAmountCents: 1550 })], {
          hasNextPage: true,
          totalPages: 2,
        }),
      )
      .mockResolvedValueOnce(
        sessionList(
          [
            parkingSessionFixture({
              id: 'session-2',
              status: 'COMPLETED',
              totalAmountCents: 3100,
            }),
          ],
          { hasPreviousPage: true, page: 2, totalPages: 2 },
        ),
      );
    renderHistory('/app/parkings/parking-1/sessions?status=COMPLETED');

    await screen.findByRole('link', { name: 'Open session for AB123CD' });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('$31.00')).toBeTruthy();
    expect(api.getParkingSessions).toHaveBeenLastCalledWith('parking-1', {
      page: 2,
      status: 'COMPLETED',
      period: '30d',
    });
  });

  it('returns to the first page when the status filter changes', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getParkingSessions
      .mockResolvedValueOnce(
        sessionList([parkingSessionFixture({ status: 'COMPLETED' })], {
          hasPreviousPage: true,
          page: 2,
          totalPages: 2,
        }),
      )
      .mockResolvedValueOnce(sessionList([]));
    renderHistory('/app/parkings/parking-1/sessions?page=2&status=COMPLETED');

    await screen.findByRole('link', { name: 'Open session for AB123CD' });
    await user.selectOptions(screen.getByLabelText('Status'), 'CANCELLED');

    expect(await screen.findByText('No sessions found')).toBeTruthy();
    expect(api.getParkingSessions).toHaveBeenLastCalledWith('parking-1', {
      page: 1,
      status: 'CANCELLED',
      period: '30d',
    });
  });
});
