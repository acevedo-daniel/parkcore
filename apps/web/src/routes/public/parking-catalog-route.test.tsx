import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { components } from '@parkcore/api-client';
import { parkingFixture } from '../../test/fixtures.js';
import { ParkingCatalogRoute } from './parking-catalog-route.js';

const api = vi.hoisted(() => ({ getPublicParkings: vi.fn() }));

vi.mock('../../lib/api/public-api.js', () => ({ getPublicParkings: api.getPublicParkings }));

type ParkingList = components['schemas']['ParkingListResponse'];

function listFixture(data: ParkingList['data']): ParkingList {
  return {
    data,
    meta: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 30,
      page: 1,
      total: data.length,
      totalPages: 1,
    },
  };
}

function renderCatalog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/parkings']}>
        <ParkingCatalogRoute />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  api.getPublicParkings.mockReset();
});

describe('public parking catalog', () => {
  it('renders a structural loading state before active parkings arrive', () => {
    api.getPublicParkings.mockReturnValue(new Promise(() => undefined));
    renderCatalog();

    expect(screen.getByLabelText('Loading parkings')).toBeTruthy();
  });

  it('renders active parkings returned by the typed API boundary', async () => {
    api.getPublicParkings.mockResolvedValue(listFixture([parkingFixture()]));
    renderCatalog();

    expect(await screen.findByRole('link', { name: 'Open Central Parking' })).toBeTruthy();
    expect(api.getPublicParkings).toHaveBeenCalledWith({
      limit: 30,
      maxHourlyRateCents: undefined,
      minHourlyRateCents: undefined,
      search: undefined,
    });
  });

  it('shows deliberate empty and error outcomes for API responses', async () => {
    api.getPublicParkings.mockResolvedValueOnce(listFixture([]));
    const { unmount } = renderCatalog();
    expect(await screen.findByText('No active parkings')).toBeTruthy();
    unmount();

    api.getPublicParkings.mockRejectedValueOnce(new Error('Offline'));
    renderCatalog();
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('We could not load active parkings.');
    });
  });
});
