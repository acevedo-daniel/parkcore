import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { components } from '@parkcore/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { AuthProvider } from '../../features/auth/auth-provider.js';
import { publicParkingFixture } from '../../test/fixtures.js';
import { LandingRoute } from './landing-route.js';

const api = vi.hoisted(() => ({ getPublicParkings: vi.fn() }));

vi.mock('../../lib/api/public-api.js', () => ({ getPublicParkings: api.getPublicParkings }));

type ParkingList = components['schemas']['PublicParkingListResponse'];

function listFixture(data: ParkingList['data']): ParkingList {
  return {
    data,
    meta: {
      hasNextPage: false,
      hasPreviousPage: false,
      limit: 10,
      page: 1,
      total: data.length,
      totalPages: 1,
    },
  };
}

function renderLanding() {
  render(
    <AppearanceProvider>
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <AuthProvider>
          <MemoryRouter>
            <LandingRoute />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </AppearanceProvider>,
  );
}

afterEach(() => {
  api.getPublicParkings.mockReset();
});

describe('public landing route', () => {
  it('uses public API facilities and labels operations proof as demonstration data', async () => {
    api.getPublicParkings.mockResolvedValue(
      listFixture([publicParkingFixture({ isShowcase: true })]),
    );
    renderLanding();

    expect(await screen.findByRole('link', { name: 'Abrir Central Parking' })).toBeTruthy();
    expect(screen.getByText('Demo', { exact: true })).toBeTruthy();
    expect(screen.getByText('Datos de demostración')).toBeTruthy();
    expect(screen.getByText('No es actividad en tiempo real.')).toBeTruthy();
    expect(api.getPublicParkings).toHaveBeenCalledWith({ limit: 10 });
    expect(api.getPublicParkings).toHaveBeenCalledWith({ limit: 6 });
  });

  it('keeps the demonstration disclosure and estimator controls localized in English', async () => {
    window.localStorage.setItem('parkcore-lang', 'en-US');
    api.getPublicParkings.mockResolvedValue(
      listFixture([publicParkingFixture({ isShowcase: true })]),
    );
    renderLanding();

    expect(await screen.findByRole('button', { name: 'Custom' })).toBeTruthy();
    expect(screen.getByText('Demonstration data')).toBeTruthy();
    expect(screen.getByText('This is not real-time activity.')).toBeTruthy();
  });

  it('keeps the landing featured region intentional when the public API has no facilities', async () => {
    api.getPublicParkings.mockResolvedValue(listFixture([]));
    renderLanding();

    expect(await screen.findByText('Todavía no hay cocheras')).toBeTruthy();
    expect(screen.getByText('Sin cocheras disponibles')).toBeTruthy();
  });
});
