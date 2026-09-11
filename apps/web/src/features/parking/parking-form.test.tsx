import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { ParkingForm } from './parking-form.js';

function renderForm(
  locale: 'en-US' | 'es-AR',
  props: Partial<React.ComponentProps<typeof ParkingForm>> = {},
) {
  window.localStorage.setItem('parkcore-lang', locale);
  const { onSubmit = vi.fn(), ...rest } = props;
  return render(
    <AppearanceProvider>
      <ParkingForm {...rest} onSubmit={onSubmit} />
    </AppearanceProvider>,
  );
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Name|Nombre/), 'Central Parking');
  await user.type(screen.getByLabelText(/Neighborhood|Barrio/), 'Centro');
  await user.type(screen.getByLabelText(/Address|Dirección/), 'Av. Corrientes 1234');
  await user.type(screen.getByLabelText(/Latitude|Latitud/), '-34.6037');
  await user.type(screen.getByLabelText(/Longitude|Longitud/), '-58.3816');
}

describe('ParkingForm', () => {
  it('shows localized required and cross-field validation in Spanish', async () => {
    const user = userEvent.setup();
    renderForm('es-AR');

    expect(screen.getByRole('button', { name: 'Crear cochera' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Crear cochera' }));
    expect(await screen.findAllByText('Usá al menos 5 caracteres.')).not.toHaveLength(0);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('switch', { name: 'Abierta las 24 horas' }));
    await user.click(screen.getByRole('button', { name: 'Crear cochera' }));

    expect(await screen.findByText('Completá los horarios de apertura y cierre.')).toBeTruthy();
  });

  it('keeps the English submit state and submits valid values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm('en-US', { onSubmit });

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create parking' }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          address: 'Av. Corrientes 1234',
          capacity: 1,
          hourlyRateCents: 100,
          is24Hours: true,
          title: 'Central Parking',
        }),
      );
    });
  });

  it('exposes localized loading and server feedback states', () => {
    renderForm('en-US', {
      error: 'We could not create this facility. Review the details and try again.',
      isSubmitting: true,
    });

    expect(screen.getByRole('button', { name: 'Saving…' }).getAttribute('disabled')).not.toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('We could not create this facility.');
  });
});
