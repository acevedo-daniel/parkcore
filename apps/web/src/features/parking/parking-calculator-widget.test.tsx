import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { components } from '@parkcore/api-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { publicParkingFixture } from '../../test/fixtures.js';
import { ParkingCalculatorWidget } from './parking-calculator-widget.js';

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

function renderCalculator() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <AppearanceProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ParkingCalculatorWidget />
        </MemoryRouter>
      </QueryClientProvider>
    </AppearanceProvider>,
  );
  return queryClient;
}

afterEach(() => {
  api.getPublicParkings.mockReset();
});

describe('ParkingCalculatorWidget', () => {
  it('supports custom minutes and keeps the started-hour estimate advisory', async () => {
    const user = userEvent.setup();
    api.getPublicParkings.mockResolvedValue(
      listFixture([publicParkingFixture({ hourlyRateCents: 1550 })]),
    );
    renderCalculator();

    await screen.findByRole('combobox', { name: '¿A qué cochera vas?' });
    expect(screen.getByText(/31,00/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '1 hora' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '2 horas' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '4 horas' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '8 horas' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Personalizado' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Personalizado' }));
    const durationInput = screen.getByLabelText('Duración en minutos');
    expect(screen.getByText('Completá la duración para estimar')).toBeTruthy();

    await user.type(durationInput, '61');
    expect(screen.getByText(/31,00/)).toBeTruthy();
    expect(screen.getByText('2 horas facturadas')).toBeTruthy();
    expect(
      screen.getByText(
        'Estimación según la tarifa actual. El importe final depende de la duración real de la estadía.',
      ),
    ).toBeTruthy();

    await user.clear(durationInput);
    await user.type(durationInput, '0');
    expect(screen.getByText('Usá un número entero de minutos mayor que 0.')).toBeTruthy();
    expect(screen.getByText('Completá la duración para estimar')).toBeTruthy();
  });

  it('updates the rate and estimate when the selected facility changes', async () => {
    const user = userEvent.setup();
    api.getPublicParkings.mockResolvedValue(
      listFixture([
        publicParkingFixture({ hourlyRateCents: 1550 }),
        publicParkingFixture({ id: 'parking-2', title: 'North Garage', hourlyRateCents: 2000 }),
      ]),
    );
    renderCalculator();

    const facilityInput = await screen.findByRole('combobox', { name: '¿A qué cochera vas?' });
    await user.click(facilityInput);
    await user.click(screen.getByRole('option', { name: 'North Garage' }));

    expect((facilityInput as HTMLInputElement).value).toBe('North Garage');
    expect(screen.getByText(/40,00/)).toBeTruthy();
  });

  it('recovers a stale facility selection when refreshed data removes it', async () => {
    const user = userEvent.setup();
    const first = publicParkingFixture({ hourlyRateCents: 1550 });
    const second = publicParkingFixture({
      id: 'parking-2',
      title: 'North Garage',
      hourlyRateCents: 2000,
    });
    api.getPublicParkings.mockResolvedValue(listFixture([first, second]));
    const queryClient = renderCalculator();

    const facilityInput = await screen.findByRole('combobox', { name: '¿A qué cochera vas?' });
    await user.click(facilityInput);
    await user.click(screen.getByRole('option', { name: 'North Garage' }));

    queryClient.setQueryData(['public-parkings-widget'], listFixture([first]));

    await waitFor(() => {
      expect(screen.getByRole<HTMLInputElement>('combobox').value).toBe('Central Parking');
    });
    expect(screen.getByText(/31,00/)).toBeTruthy();
  });

  it('offers retry and intentional empty states for public API outcomes', async () => {
    const user = userEvent.setup();
    api.getPublicParkings
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(listFixture([]));
    renderCalculator();

    expect(await screen.findByRole('alert')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Sin cocheras disponibles')).toBeTruthy();
  });

  it('renders a deliberate loading state while public facilities are pending', () => {
    api.getPublicParkings.mockReturnValue(new Promise(() => undefined));
    renderCalculator();

    expect(screen.getByLabelText('Cargando cocheras')).toBeTruthy();
  });
});
