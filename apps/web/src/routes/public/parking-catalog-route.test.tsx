import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { components } from '@parkcore/api-client';
import { publicParkingFixture } from '../../test/fixtures.js';
import { ParkingCatalogRoute } from './parking-catalog-route.js';
import {
  parseCatalogRate,
  parseParkingCatalogUrlState,
  parkingCatalogSearchParamsFromState,
} from './parking-catalog-query.js';

const api = vi.hoisted(() => ({ getPublicParkings: vi.fn() }));

vi.mock('../../lib/api/public-api.js', () => ({ getPublicParkings: api.getPublicParkings }));

type ParkingList = components['schemas']['PublicParkingListResponse'];

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

function HistoryProbe() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div>
      <output data-testid="location-search">{location.search}</output>
      <button onClick={() => void navigate(-1)} type="button">
        Navigate back
      </button>
      <button onClick={() => void navigate(1)} type="button">
        Navigate forward
      </button>
    </div>
  );
}

function renderCatalog(initialEntry = '/parkings') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ParkingCatalogRoute />
        <HistoryProbe />
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
    api.getPublicParkings.mockResolvedValue(
      listFixture([publicParkingFixture({ isShowcase: true })]),
    );
    renderCatalog();

    expect(await screen.findByRole('link', { name: 'Open Central Parking' })).toBeTruthy();
    expect(screen.getByText('Demo', { exact: true })).toBeTruthy();
    expect(screen.getByText('1 parking found', { exact: true })).toBeTruthy();
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
      .mockResolvedValueOnce(
        listFixture([publicParkingFixture()], { hasNextPage: true, totalPages: 2 }),
      )
      .mockResolvedValueOnce(
        listFixture([publicParkingFixture({ id: 'parking-2', title: 'North Garage' })], {
          hasPreviousPage: true,
          page: 2,
          totalPages: 2,
        }),
      );
    renderCatalog('/parkings?search=central&currency=USD&minRate=10&maxRate=20');

    await screen.findByRole('link', { name: 'Open Central Parking' });
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('link', { name: 'Open North Garage' })).toBeTruthy();
    expect(api.getPublicParkings).toHaveBeenLastCalledWith({
      limit: 30,
      availableNow: undefined,
      currency: 'USD',
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

  it('requires currency before submitting a price bound', async () => {
    const user = userEvent.setup();
    api.getPublicParkings.mockResolvedValue(listFixture([]));
    renderCatalog();
    await screen.findByText('No active parkings');
    const callsBeforeSubmit = api.getPublicParkings.mock.calls.length;

    await user.type(screen.getByLabelText('Min. rate (USD)'), '10');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Choose a currency for rates.',
    );
    expect(api.getPublicParkings).toHaveBeenCalledTimes(callsBeforeSubmit);
  });

  it('normalizes unsafe URL state before requesting the API', async () => {
    api.getPublicParkings.mockResolvedValue(listFixture([]));
    renderCatalog(
      '/parkings?currency=EUR&minRate=20&maxRate=10&availableNow=false&page=0&unexpected=true',
    );

    expect(await screen.findByText('No active parkings')).toBeTruthy();
    expect(api.getPublicParkings).toHaveBeenLastCalledWith({
      availableNow: undefined,
      currency: undefined,
      limit: 30,
      maxHourlyRateCents: undefined,
      minHourlyRateCents: undefined,
      page: 1,
      search: undefined,
    });
    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toBe('');
    });
  });

  it('submits available-now and monetary filters in displayed currency units', async () => {
    const user = userEvent.setup();
    api.getPublicParkings.mockResolvedValue(listFixture([publicParkingFixture()]));
    renderCatalog('/parkings?search=old&page=3');
    await screen.findByRole('link', { name: 'Open Central Parking' });

    await user.clear(screen.getByLabelText('Where are you going?'));
    await user.type(screen.getByLabelText('Where are you going?'), 'central');
    await user.selectOptions(screen.getByLabelText('Currency'), 'USD');
    await user.type(screen.getByLabelText('Min. rate (USD)'), '10');
    await user.type(screen.getByLabelText('Max. rate (USD)'), '20');
    await user.click(screen.getByLabelText('Available now'));
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() => {
      expect(api.getPublicParkings).toHaveBeenLastCalledWith({
        availableNow: 'true',
        currency: 'USD',
        limit: 30,
        maxHourlyRateCents: 2000,
        minHourlyRateCents: 1000,
        page: 1,
        search: 'central',
      });
    });
    expect(screen.getByTestId('location-search').textContent).toBe(
      '?search=central&currency=USD&minRate=10.00&maxRate=20.00&availableNow=true',
    );
  });

  it('clears the monetary group and resets pagination together', async () => {
    const user = userEvent.setup();
    api.getPublicParkings.mockResolvedValue(listFixture([publicParkingFixture()]));
    renderCatalog('/parkings?search=central&currency=USD&minRate=10&maxRate=20&page=3');
    await screen.findByRole('link', { name: 'Open Central Parking' });

    await user.click(screen.getByRole('button', { name: 'Clear rate' }));

    await waitFor(() => {
      expect(api.getPublicParkings).toHaveBeenLastCalledWith({
        availableNow: undefined,
        currency: undefined,
        limit: 30,
        maxHourlyRateCents: undefined,
        minHourlyRateCents: undefined,
        page: 1,
        search: 'central',
      });
    });
    expect(screen.getByTestId('location-search').textContent).toBe('?search=central');
  });

  it('preserves valid query state through pagination and browser history', async () => {
    const user = userEvent.setup();
    const firstPage = listFixture([publicParkingFixture()], {
      hasNextPage: true,
      page: 1,
      total: 2,
      totalPages: 2,
    });
    const secondPage = listFixture(
      [publicParkingFixture({ id: 'parking-2', title: 'North Garage' })],
      { hasPreviousPage: true, page: 2, total: 2, totalPages: 2 },
    );
    api.getPublicParkings.mockImplementation((query: { page?: number }) =>
      Promise.resolve(query.page === 2 ? secondPage : firstPage),
    );
    renderCatalog('/parkings?search=central');
    await screen.findByRole('link', { name: 'Open Central Parking' });

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('link', { name: 'Open North Garage' });
    expect(screen.getByTestId('location-search').textContent).toBe('?search=central&page=2');

    await user.click(screen.getByRole('button', { name: 'Navigate back' }));
    await screen.findByRole('link', { name: 'Open Central Parking' });
    expect(screen.getByTestId('location-search').textContent).toBe('?search=central');

    await user.click(screen.getByRole('button', { name: 'Navigate forward' }));
    await screen.findByRole('link', { name: 'Open North Garage' });
    expect(screen.getByTestId('location-search').textContent).toBe('?search=central&page=2');
  });

  it('contains focus in the mobile filter sheet and restores it on close', async () => {
    const user = userEvent.setup();
    api.getPublicParkings.mockResolvedValue(listFixture([]));
    renderCatalog();
    await screen.findByText('No active parkings');

    const trigger = screen.getByRole('button', { name: 'Filter facilities' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Close Filter facilities' })).toBeTruthy();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('public parking catalog query state', () => {
  it('round trips canonical URL values and converts displayed rates at the boundary', () => {
    const state = parseParkingCatalogUrlState(
      new URLSearchParams(
        'search=%20central%20&currency=USD&minRate=10&maxRate=20&availableNow=true&page=4',
      ),
    );

    expect(state).toEqual({
      availableNow: true,
      currency: 'USD',
      maxRate: { cents: 2000, text: '20.00' },
      minRate: { cents: 1000, text: '10.00' },
      page: 4,
      search: 'central',
    });
    expect(parkingCatalogSearchParamsFromState(state).toString()).toBe(
      'search=central&currency=USD&minRate=10.00&maxRate=20.00&availableNow=true&page=4',
    );
    expect(parseCatalogRate('0.001')).toBeUndefined();
  });
});
