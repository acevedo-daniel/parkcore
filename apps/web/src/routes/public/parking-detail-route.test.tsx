import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { parkingFixture } from '../../test/fixtures.js';
import { ParkingDetailRoute } from './parking-detail-route.js';

const api = vi.hoisted(() => ({ getPublicParking: vi.fn() }));

vi.mock('../../lib/api/public-api.js', () => ({
  PublicApiError: class PublicApiError extends Error {},
  getPublicParking: api.getPublicParking,
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
  it('renders a stable, asynchronously decoded primary parking image', async () => {
    api.getPublicParking.mockResolvedValue(
      parkingFixture({ image: 'https://images.example.test/central-parking.jpg' }),
    );
    renderParkingDetail();

    const image = await screen.findByRole('img', { name: 'Central Parking parking facility' });
    expect(image.getAttribute('decoding')).toBe('async');
    expect(image.getAttribute('fetchpriority')).toBe('high');
  });

  it('replaces an unavailable external image with the deliberate fallback', async () => {
    api.getPublicParking.mockResolvedValue(
      parkingFixture({ image: 'https://images.example.test/missing.jpg' }),
    );
    renderParkingDetail();

    fireEvent.error(await screen.findByRole('img', { name: 'Central Parking parking facility' }));
    expect(await screen.findByLabelText('Parking image not available')).toBeTruthy();
  });

  it('uses the same fallback when a parking has no image', async () => {
    api.getPublicParking.mockResolvedValue(parkingFixture());
    renderParkingDetail();

    expect(await screen.findByLabelText('Parking image not available')).toBeTruthy();
  });
});
