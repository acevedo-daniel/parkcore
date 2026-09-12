import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { publicParkingFixture } from '../../test/fixtures.js';
import { ParkingDetailRoute } from './parking-detail-route.js';

const api = vi.hoisted(() => ({
  PublicApiError: class MockPublicApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.name = 'PublicApiError';
      this.status = status;
    }
  },
  getPublicParking: vi.fn(),
  getPublicParkings: vi.fn(),
}));

vi.mock('../../lib/api/public-api.js', () => ({
  PublicApiError: api.PublicApiError,
  getPublicParking: api.getPublicParking,
  getPublicParkings: api.getPublicParkings,
}));

function renderParkingDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/parkings/parking-1']}>
        <Routes>
          <Route element={<ParkingDetailRoute />} path="/parkings/:parkingId" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  api.getPublicParking.mockReset();
});

describe('public parking detail images', () => {
  it('discloses fictional data for showcase facilities', async () => {
    api.getPublicParking.mockResolvedValue(publicParkingFixture({ isShowcase: true }));
    renderParkingDetail();

    expect(
      await screen.findByText('Fictional parking with demonstration data for exploring ParkCore.'),
    ).toBeTruthy();
  });

  it('renders a stable, asynchronously decoded primary parking image', async () => {
    api.getPublicParking.mockResolvedValue(
      publicParkingFixture({ image: 'https://images.example.test/central-parking.jpg' }),
    );
    renderParkingDetail();

    const image = await screen.findByRole('img', { name: 'Central Parking parking facility' });
    expect(image.getAttribute('decoding')).toBe('async');
    expect(image.getAttribute('fetchpriority')).toBe('high');
  });

  it('replaces an unavailable external image with the deliberate fallback', async () => {
    api.getPublicParking.mockResolvedValue(
      publicParkingFixture({ image: 'https://images.example.test/missing.jpg' }),
    );
    renderParkingDetail();

    fireEvent.error(await screen.findByRole('img', { name: 'Central Parking parking facility' }));
    expect(await screen.findByLabelText('Parking image not available')).toBeTruthy();
  });

  it('uses the same fallback when a parking has no image', async () => {
    api.getPublicParking.mockResolvedValue(publicParkingFixture());
    renderParkingDetail();

    expect(await screen.findByLabelText('Parking image not available')).toBeTruthy();
  });

  it('renders a configured schedule and handles missing schedule values', async () => {
    api.getPublicParking.mockResolvedValue(
      publicParkingFixture({ is24Hours: false, opensAt: '08:00', closesAt: '20:00' }),
    );
    renderParkingDetail();

    expect(await screen.findByText('08:00 to 20:00')).toBeTruthy();

    api.getPublicParking.mockResolvedValue(
      publicParkingFixture({ is24Hours: false, opensAt: null, closesAt: null }),
    );
    renderParkingDetail();

    expect(await screen.findByText('Schedule unavailable')).toBeTruthy();
  });
});

describe('public parking detail', () => {
  it('shows Google Maps directions with the facility coordinates', async () => {
    api.getPublicParking.mockResolvedValue(publicParkingFixture());
    renderParkingDetail();

    const directions = await screen.findByRole('link', {
      name: 'Get directions to Central Parking',
    });
    expect(directions.getAttribute('href')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-34.6037,-58.3816',
    );
    expect(directions.getAttribute('target')).toBe('_blank');
    expect(directions.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('keeps availability states and next opening information distinct', async () => {
    api.getPublicParking.mockResolvedValue(
      publicParkingFixture({
        availabilityState: 'CLOSED',
        isOpen: false,
        nextOpeningAt: '2026-09-11T11:00:00.000Z',
      }),
    );
    renderParkingDetail();

    expect(await screen.findByText(/Closed now/)).toBeTruthy();
    expect(screen.getByText(/Next opening/)).toBeTruthy();
  });

  it('renders the reusable estimator with the detail rate and currency', async () => {
    api.getPublicParking.mockResolvedValue(
      publicParkingFixture({ currency: 'ARS', hourlyRateCents: 1550 }),
    );
    renderParkingDetail();

    expect(await screen.findByRole('combobox', { name: 'Where are you parking?' })).toBeTruthy();
    expect(screen.getByText(/31\.00/)).toBeTruthy();
    expect(api.getPublicParkings).not.toHaveBeenCalled();
  });

  it('shows a useful fallback when the public description is missing', async () => {
    api.getPublicParking.mockResolvedValue(publicParkingFixture({ description: null }));
    renderParkingDetail();

    expect(
      await screen.findByText(
        'This facility has not added a public description yet. Its rate, address, and capacity are available above.',
      ),
    ).toBeTruthy();
  });

  it('renders a localized public not-found state and no-index metadata', async () => {
    api.getPublicParking.mockRejectedValue(new api.PublicApiError('Not found', 404));
    renderParkingDetail();

    expect(await screen.findByText('No parking here')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Return to directory' })).toBeTruthy();
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex',
    );
  });

  it('offers retry for a public detail request error', async () => {
    const user = userEvent.setup();
    api.getPublicParking
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(publicParkingFixture());
    renderParkingDetail();

    expect(await screen.findByText('Unable to load parking')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Central Parking' })).toBeTruthy();
  });

  it('keeps successful detail metadata localized and indexable', async () => {
    api.getPublicParking.mockResolvedValue(publicParkingFixture());
    renderParkingDetail();

    await screen.findByRole('heading', { name: 'Central Parking' });
    expect(document.title).toBe('Central Parking | ParkCore');
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://parkcore-app.vercel.app/parkings/parking-1',
    );
  });

  it('keeps a loading state while the public detail request is pending', () => {
    api.getPublicParking.mockReturnValue(new Promise(() => undefined));
    renderParkingDetail();

    expect(screen.getByLabelText('Loading parking')).toBeTruthy();
  });
});
