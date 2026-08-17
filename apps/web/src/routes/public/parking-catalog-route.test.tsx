import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { components } from '@parkcore/api-client';
import { parkingFixture } from '../../test/fixtures.js';
import { ParkingCatalogRoute } from './parking-catalog-route.js';

const api = vi.hoisted(() => ({ getPublicParkings: vi.fn() }));

vi.mock('../../lib/api/public-api.js', () => ({ getPublicParkings: api.getPublicParkings }));

type ParkingList = components['schemas']['ParkingListResponse'];

function listFixture(
  data: ParkingList['data'],
  meta: Partial<ParkingList['meta']> = {},
): ParkingList {
  return {
    data,
    meta: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 30,
      page: 1,
      total: data.length,
      totalPages: 1,
      ...meta,
    },
  };
}

function renderCatalog(initialEntry = '/parkings') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
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
    expect(document.title).toBe('Parkings | ParkCore');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Browse active ParkCore parking facilities by address and hourly rate.',
    );
    expect(api.getPublicParkings).toHaveBeenCalledWith({
      limit: 30,
      page: 1,
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

  it('keeps filters in the URL while moving through public parking pages', async () => {
    const user = userEvent.setup();
    api.getPublicParkings
      .mockResolvedValueOnce(listFixture([parkingFixture()], { hasNextPage: true, totalPages: 2 }))
      .mockResolvedValueOnce(
        listFixture([parkingFixture({ id: 'parking-2', title: 'North Garage' })], {
          hasPreviousPage: true,
          page: 2,
          totalPages: 2,
        }),
      );
    renderCatalog('/parkings?search=central&minRate=10&maxRate=20');

    await screen.findByRole('link', { name: 'Open Central Parking' });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('link', { name: 'Open North Garage' })).toBeTruthy();
    expect(api.getPublicParkings).toHaveBeenLastCalledWith({
      limit: 30,
      maxHourlyRateCents: 2000,
      minHourlyRateCents: 1000,
      page: 2,
      search: 'central',
    });
  });

  it('keeps invalid rate combinations at the boundary instead of calling the API', async () => {
    const user = userEvent.setup();
    api.getPublicParkings.mockResolvedValue(listFixture([]));
    renderCatalog();
    await screen.findByText('No active parkings');
    const callsBeforeSubmit = api.getPublicParkings.mock.calls.length;

    await user.type(screen.getByLabelText('Min. rate (USD)'), '20');
    await user.type(screen.getByLabelText('Max. rate (USD)'), '10');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Minimum rate cannot exceed maximum rate.',
    );
    expect(api.getPublicParkings).toHaveBeenCalledTimes(callsBeforeSubmit);
  });
});
