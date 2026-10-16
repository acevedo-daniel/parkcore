import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
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

function renderCalculator(locale: 'en-US' | 'es-AR' = 'es-AR') {
  window.localStorage.setItem('parkcore-lang', locale);
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

    await screen.findByRole('combobox', { name: '¿Dónde vas a estacionar?' });
    expect(screen.getByText(/31,00/)).toBeTruthy();
    const durationGroup = screen.getByRole('radiogroup', { name: 'Estadía estimada' });
    const durationOptions = within(durationGroup).getAllByRole('radio');
    expect(durationOptions.map((option) => option.textContent)).toEqual([
      '1 hora',
      '2 horas',
      '4 horas',
      '8 horas',
      'Personalizado',
    ]);
    expect(screen.getByRole('radio', { name: '2 horas' }).getAttribute('aria-checked')).toBe(
      'true',
    );

    screen.getByRole('radio', { name: '2 horas' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '4 horas' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Personalizado' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByLabelText('Duración en minutos')).toBeTruthy();
    expect(screen.getByText('Elige una duración', { selector: 'legend span' })).toBeTruthy();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('radio', { name: '4 horas' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.queryByLabelText('Duración en minutos')).toBeNull();
    expect(screen.getByText('4 horas', { selector: 'legend span' })).toBeTruthy();

    await user.click(screen.getByRole('radio', { name: 'Personalizado' }));
    expect(screen.getByRole('radio', { name: 'Personalizado' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    const durationInput = screen.getByLabelText('Duración en minutos');
    expect(screen.getByText('Completa la duración para calcular el costo')).toBeTruthy();

    await user.type(durationInput, '61');
    expect(screen.getByText(/31,00/)).toBeTruthy();
    expect(screen.getByText('2 horas facturadas')).toBeTruthy();
    expect(
      screen.getByText(
        'Cálculo según la tarifa actual. El importe final depende de la duración real de la estadía.',
      ),
    ).toBeTruthy();

    await user.clear(durationInput);
    await user.type(durationInput, '0');
    expect(screen.getByText('Usa un número entero de minutos mayor que 0.')).toBeTruthy();
    expect(screen.getByText('Completa la duración para calcular el costo')).toBeTruthy();
  });

  it('shows the English estimated stay options in order', async () => {
    api.getPublicParkings.mockResolvedValue(
      listFixture([publicParkingFixture({ hourlyRateCents: 1550 })]),
    );
    renderCalculator('en-US');

    await screen.findByRole('combobox', { name: 'Where are you parking?' });
    const durationGroup = screen.getByRole('radiogroup', { name: 'Estimated stay' });
    const durationOptions = within(durationGroup).getAllByRole('radio');
    expect(durationOptions.map((option) => option.textContent)).toEqual([
      '1 hour',
      '2 hours',
      '4 hours',
      '8 hours',
      'Custom',
    ]);
    expect(screen.getByRole('radio', { name: '2 hours' }).getAttribute('aria-checked')).toBe(
      'true',
    );
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

    const facilityInput = await screen.findByRole('combobox', { name: '¿Dónde vas a estacionar?' });
    await user.click(facilityInput);
    await user.click(screen.getByRole('option', { name: 'North Garage' }));

    expect(facilityInput.textContent).toContain('North Garage');
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

    const facilityInput = await screen.findByRole('combobox', { name: '¿Dónde vas a estacionar?' });
    await user.click(facilityInput);
    await user.click(screen.getByRole('option', { name: 'North Garage' }));

    queryClient.setQueryData(['public-parkings-widget'], listFixture([first]));

    await waitFor(() => {
      expect(
        screen.getByRole<HTMLButtonElement>('combobox', {
          name: '¿Dónde vas a estacionar?',
        }).textContent,
      ).toContain('Central Parking');
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

    expect(screen.getByRole('status', { name: 'Cargando cocheras' })).toBeTruthy();
  });
});
