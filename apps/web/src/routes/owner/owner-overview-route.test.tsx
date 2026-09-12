import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { ToastProvider } from '../../components/ui/feedback.js';
import { parkingFixture, parkingSessionFixture } from '../../test/fixtures.js';
import { OwnerOverviewRoute } from './owner-overview-route.js';

const api = vi.hoisted(() => ({
  getActiveSessions: vi.fn(),
  getAnalyticsRevenue: vi.fn(),
  getAnalyticsSummary: vi.fn(),
  getAnalyticsVolume: vi.fn(),
  getOwnedParkings: vi.fn(),
}));

vi.mock('../../lib/api/owner-api.js', () => api);

const baseSummary = {
  activeVehicles: 3,
  completedToday: 4,
  facilities: [{ isActive: true, parkingId: 'parking-1' }],
  occupancyPercent: 25,
  revenueToday: [{ currency: 'USD', revenueCents: 2_000 }],
  totalCapacity: 12,
};

const baseRevenue = {
  data: [
    {
      date: '2026-09-09',
      revenueByCurrency: [
        { currency: 'USD', revenueCents: 1_000 },
        { currency: 'ARS', revenueCents: 2_000 },
      ],
    },
    {
      date: '2026-09-10',
      revenueByCurrency: [
        { currency: 'USD', revenueCents: 1_500 },
        { currency: 'ARS', revenueCents: 3_000 },
      ],
    },
  ],
  days: 7,
};

const baseVolume = {
  data: [
    { completedSessions: 2, date: '2026-09-09' },
    { completedSessions: 3, date: '2026-09-10' },
  ],
  days: 7,
};

function configureAnalytics() {
  api.getAnalyticsSummary.mockResolvedValue(baseSummary);
  api.getAnalyticsRevenue.mockImplementation((days: 7 | 30) =>
    Promise.resolve({ ...baseRevenue, days }),
  );
  api.getAnalyticsVolume.mockImplementation((days: 7 | 30) =>
    Promise.resolve({ ...baseVolume, days }),
  );
}

function renderOverview(locale: 'es-AR' | 'en-US' = 'en-US') {
  window.localStorage.setItem('parkcore-lang', locale);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <AppearanceProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/app']}>
            <Routes>
              <Route path="/app" element={<OwnerOverviewRoute />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </AppearanceProvider>,
  );
}

afterEach(() => {
  api.getActiveSessions.mockReset();
  api.getAnalyticsRevenue.mockReset();
  api.getAnalyticsSummary.mockReset();
  api.getAnalyticsVolume.mockReset();
  api.getOwnedParkings.mockReset();
});

describe('owner overview briefing', () => {
  it('shows a localized loading composition while the network is loading', () => {
    api.getOwnedParkings.mockImplementation(() => new Promise(() => undefined));
    renderOverview('es-AR');

    expect(screen.getByLabelText('Cargando el resumen de la operación')).toBeTruthy();
  });

  it('keeps no-facility onboarding localized', async () => {
    api.getOwnedParkings.mockResolvedValue([]);
    configureAnalytics();
    renderOverview('es-AR');

    expect(
      await screen.findByRole('heading', { name: 'Tu operación empieza con una cochera' }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Cuando crees la primera, vas a ver la ocupación, los ingresos y las estadías desde acá.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Nueva cochera' }).getAttribute('href')).toBe(
      '/app/parkings/new',
    );
  });

  it('renders server counts, ordered attention links, and separate currency totals', async () => {
    const longRunningParking = parkingFixture({
      activeSessionCount: 1,
      availableSpaces: 11,
      id: 'long-running',
      title: 'Long-running Parking',
    });
    const parkings = [
      parkingFixture({
        activeSessionCount: 12,
        availabilityState: 'FULL',
        availableSpaces: 0,
        id: 'full',
        title: 'Full Parking',
      }),
      parkingFixture({
        activeSessionCount: 10,
        availabilityState: 'LIMITED',
        availableSpaces: 2,
        id: 'limited',
        title: 'Nearly Full Parking',
      }),
      longRunningParking,
      parkingFixture({
        availabilityState: 'PAUSED',
        id: 'paused',
        isActive: false,
        title: 'Paused Parking',
      }),
    ];
    api.getOwnedParkings.mockResolvedValue(parkings);
    api.getActiveSessions.mockImplementation((parkingId: string) =>
      Promise.resolve(
        parkingId === longRunningParking.id
          ? [
              parkingSessionFixture({
                id: 'long-session',
                parkingId,
                startTime: '2026-09-11T00:00:00.000Z',
              }),
            ]
          : [],
      ),
    );
    configureAnalytics();
    api.getAnalyticsSummary.mockResolvedValue({
      ...baseSummary,
      facilities: parkings.map(({ activeSessionCount, id, isActive }) => ({
        activeVehicles: activeSessionCount,
        isActive,
        parkingId: id,
      })),
      totalCapacity: 48,
    });
    renderOverview();

    expect(
      await screen.findByRole('heading', { name: '3 vehicles are parked right now.' }),
    ).toBeTruthy();
    expect(
      screen.getByText('3 of 4 facilities have vehicles inside · 45 spaces open.'),
    ).toBeTruthy();
    expect(screen.getByText('Vehicles inside')).toBeTruthy();
    expect(screen.getByText('Completed stays today')).toBeTruthy();
    expect(screen.getByText('3 active')).toBeTruthy();
    expect(screen.getByText('1 paused')).toBeTruthy();
    expect(screen.getByText('Revenue today')).toBeTruthy();
    expect(screen.getByText('Revenue in 7 days (USD)')).toBeTruthy();
    expect(screen.getByText('Revenue in 7 days (ARS)')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('Nearly full')).toBeTruthy();
      expect(screen.getByText('Long-running stay')).toBeTruthy();
      expect(screen.getByText('Paused')).toBeTruthy();
    });
    const attentionLinks = screen.getAllByRole('link', { name: 'Open context' });
    expect(attentionLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/app/parkings/full',
      '/app/parkings/limited',
      '/app/sessions/long-session',
      '/app/parkings/paused',
    ]);
  });

  it('switches the activity period with accessible controls', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getActiveSessions.mockResolvedValue([]);
    configureAnalytics();
    renderOverview();

    await screen.findByRole('heading', { name: 'Everything important, in view.' });
    const periodButton = screen.getByRole('button', { name: 'View 30 days of activity' });
    await user.click(periodButton);

    await waitFor(() => {
      expect(api.getAnalyticsRevenue).toHaveBeenCalledWith(30);
      expect(api.getAnalyticsVolume).toHaveBeenCalledWith(30);
    });
    expect(periodButton.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('list', { name: 'Daily activity data' })).toBeTruthy();
  });

  it('keeps the operational briefing usable when summary analytics fail', async () => {
    api.getOwnedParkings.mockResolvedValue([parkingFixture({ activeSessionCount: 2 })]);
    api.getActiveSessions.mockResolvedValue([]);
    api.getAnalyticsSummary.mockRejectedValue(new Error('summary unavailable'));
    api.getAnalyticsRevenue.mockResolvedValue(baseRevenue);
    api.getAnalyticsVolume.mockResolvedValue(baseVolume);
    renderOverview('es-AR');

    expect(
      await screen.findByRole('heading', { name: '2 vehículos están estacionados ahora.' }),
    ).toBeTruthy();
    expect(screen.getAllByText('N/D').length).toBeGreaterThan(0);
    expect(screen.getByRole('alert').textContent).toContain(
      'Algunos datos de analítica no están disponibles ahora. La operación sigue visible.',
    );
    expect(screen.getByRole('button', { name: 'Reintentar analítica' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Cocheras en operación' })).toBeTruthy();
  });

  it('keeps attention context visible when active stay details fail', async () => {
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getActiveSessions.mockRejectedValue(new Error('active stays unavailable'));
    configureAnalytics();
    renderOverview();

    expect((await screen.findByRole('alert')).textContent).toContain(
      'We could not review active stays for every facility.',
    );
    expect(screen.getByRole('button', { name: 'Retry attention' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Operating facilities' })).toBeTruthy();
  });

  it('degrades the activity panel independently and provides a local retry', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    api.getActiveSessions.mockResolvedValue([]);
    api.getAnalyticsSummary.mockResolvedValue(baseSummary);
    api.getAnalyticsRevenue
      .mockRejectedValueOnce(new Error('revenue unavailable'))
      .mockResolvedValue(baseRevenue);
    api.getAnalyticsVolume.mockResolvedValue(baseVolume);
    renderOverview();

    expect((await screen.findByRole('alert')).textContent).toContain('We could not load activity.');
    expect(screen.getByRole('heading', { name: 'Operating facilities' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Retry activity' }));

    await waitFor(() => {
      expect(api.getAnalyticsRevenue).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('list', { name: 'Daily activity data' })).toBeTruthy();
    });
  });
});
