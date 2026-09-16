import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
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

let restoreDownloadMocks: (() => void) | undefined;

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
  vi.restoreAllMocks();
  restoreDownloadMocks?.();
  restoreDownloadMocks = undefined;
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
    renderHistory('/app/parkings/parking-1/sessions?plate=ab-123&period=7d&status=COMPLETED');

    await screen.findByRole('link', { name: 'Open session for AB123CD' });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('$31.00')).toBeTruthy();
    expect(api.getParkingSessions).toHaveBeenLastCalledWith('parking-1', {
      page: 2,
      plate: 'AB123',
      status: 'COMPLETED',
      period: '7d',
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
    renderHistory(
      '/app/parkings/parking-1/sessions?page=2&plate=ab-123&period=7d&status=COMPLETED',
    );

    await screen.findByRole('link', { name: 'Open session for AB123CD' });
    await user.selectOptions(screen.getByLabelText('Status'), 'CANCELLED');

    expect(await screen.findByText('No sessions found')).toBeTruthy();
    expect(api.getParkingSessions).toHaveBeenLastCalledWith('parking-1', {
      page: 1,
      plate: 'AB123',
      status: 'CANCELLED',
      period: '7d',
    });
  });

  it('shows the filtered aggregate in separate currencies and the parking timezone', async () => {
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    const response = sessionList([
      parkingSessionFixture({ status: 'CANCELLED', totalAmountCents: null }),
    ]);
    response.aggregate = {
      totalSessions: 3,
      activeSessions: 1,
      completedSessions: 1,
      cancelledSessions: 1,
      revenueByCurrency: [
        { currency: 'ARS', revenueCents: 2500 },
        { currency: 'USD', revenueCents: 1550 },
      ],
    };
    api.getParkingSessions.mockResolvedValue(response);

    renderHistory('/app/parkings/parking-1/sessions?period=today');

    expect(await screen.findByText('Filtered summary')).toBeTruthy();
    expect(screen.getByText('America/Argentina/Buenos_Aires')).toBeTruthy();
    expect(screen.getByText(/ARS.*25\.00/)).toBeTruthy();
    expect(screen.getByText(/\$15\.50/).classList.contains('whitespace-nowrap')).toBe(true);
    expect(screen.getByText('No charge')).toBeTruthy();
  });

  it('keeps cached history visible and offers a retry after a refresh error', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getParkingSessions
      .mockResolvedValueOnce(sessionList([parkingSessionFixture()]))
      .mockRejectedValueOnce(new Error('history unavailable'))
      .mockResolvedValueOnce(sessionList([parkingSessionFixture({ id: 'session-2' })]));
    renderHistory();

    await screen.findByRole('link', { name: 'Open session for AB123CD' });
    await user.click(screen.getByRole('button', { name: 'Refresh history' }));

    const staleAlert = await screen.findByRole('alert');
    expect(staleAlert.textContent).toContain('This history may be out of date.');
    expect(screen.getByRole('link', { name: 'Open session for AB123CD' })).toBeTruthy();

    await user.click(within(staleAlert).getByRole('button', { name: 'Refresh history' }));
    await waitFor(() => {
      expect(api.getParkingSessions).toHaveBeenCalledTimes(3);
    });
    expect(screen.queryByText('This history may be out of date.')).toBeNull();
  });

  it('exports the same normalized filters and announces the completed download', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getParkingSessions.mockResolvedValue(sessionList([parkingSessionFixture()]));
    api.getParkingSessionsCsv.mockResolvedValue('plate,status\r\nAB123CD,COMPLETED');
    const downloadMocks = mockDownload();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    renderHistory('/app/parkings/parking-1/sessions?plate=ab-123&period=7d&status=COMPLETED');
    await screen.findByRole('link', { name: 'Open session for AB123CD' });

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(await screen.findByText('Filtered history downloaded.')).toBeTruthy();
    expect(api.getParkingSessionsCsv).toHaveBeenCalledWith('parking-1', {
      plate: 'AB123',
      period: '7d',
      status: 'COMPLETED',
    });
    expect(downloadMocks.createObjectUrl).toHaveBeenCalledTimes(1);
    expect(downloadMocks.revokeObjectUrl).toHaveBeenCalledWith('blob:history');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('announces an export error and retries the same filtered request', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getParkingSessions.mockResolvedValue(sessionList([parkingSessionFixture()]));
    api.getParkingSessionsCsv
      .mockRejectedValueOnce(new Error('export failed'))
      .mockResolvedValueOnce('plate,status\r\nAB123CD,COMPLETED');
    mockDownload();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    renderHistory('/app/parkings/parking-1/sessions?plate=ab-123&period=7d&status=COMPLETED');
    await screen.findByRole('link', { name: 'Open session for AB123CD' });

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'We could not export this filtered history. Try again.',
    );

    await user.click(screen.getByRole('button', { name: 'Retry export' }));
    expect(await screen.findByText('Filtered history downloaded.')).toBeTruthy();
    expect(api.getParkingSessionsCsv).toHaveBeenCalledTimes(2);
    expect(api.getParkingSessionsCsv).toHaveBeenLastCalledWith('parking-1', {
      plate: 'AB123',
      period: '7d',
      status: 'COMPLETED',
    });
  });
});

function mockDownload() {
  const createObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  const revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  const createObjectUrl = vi.fn(() => 'blob:history');
  const revokeObjectUrl = vi.fn();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createObjectUrl,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectUrl,
  });
  restoreDownloadMocks = () => {
    if (createObjectUrlDescriptor) {
      Object.defineProperty(URL, 'createObjectURL', createObjectUrlDescriptor);
    } else {
      Reflect.deleteProperty(URL, 'createObjectURL');
    }
    if (revokeObjectUrlDescriptor) {
      Object.defineProperty(URL, 'revokeObjectURL', revokeObjectUrlDescriptor);
    } else {
      Reflect.deleteProperty(URL, 'revokeObjectURL');
    }
  };
  return { createObjectUrl, revokeObjectUrl };
}
