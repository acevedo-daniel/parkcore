import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { CheckInPanel } from './check-in-panel.js';
import { OccupancyMeter } from './parking.js';

const api = vi.hoisted(() => ({ lookupVehicle: vi.fn() }));

vi.mock('../../lib/api/owner-api.js', () => api);

function fieldValue(label: string): string {
  const field = screen.getByLabelText(label);
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLSelectElement ||
    field instanceof HTMLTextAreaElement
  ) {
    return field.value;
  }
  throw new Error(`Expected ${label} to be a form control`);
}

afterEach(() => {
  api.lookupVehicle.mockReset();
  window.localStorage.removeItem('parkcore-lang');
});

describe('CheckInPanel', () => {
  it('waits for five normalized characters before looking up a vehicle', async () => {
    const user = userEvent.setup();
    api.lookupVehicle.mockResolvedValue({ vehicle: null });
    render(<CheckInPanel onSubmit={vi.fn()} parkingId="parking-1" />);

    const plateInput = screen.getByLabelText('Plate');
    await user.type(plateInput, 'ab-12');
    await new Promise((resolve) => window.setTimeout(resolve, 350));

    expect(api.lookupVehicle).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toContain(
      'Enter at least 5 alphanumeric characters to look up a registered vehicle.',
    );

    await user.type(plateInput, '3');
    await waitFor(() => {
      expect(api.lookupVehicle).toHaveBeenCalledWith('parking-1', 'AB123');
    });
  });

  it('prefills stable vehicle data without reusing visit fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    api.lookupVehicle.mockResolvedValue({
      vehicle: {
        id: 'vehicle-1',
        plate: 'AB123CD',
        type: 'MOTORCYCLE',
        brand: 'Honda',
        model: 'CB500',
      },
    });
    render(<CheckInPanel onSubmit={onSubmit} parkingId="parking-1" />);

    await user.type(screen.getByLabelText('Plate'), 'ab-123 cd');
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toContain(
        'A previously registered vehicle was found. Review its details before starting the stay.',
      );
    });

    expect(fieldValue('Type')).toBe('MOTORCYCLE');
    expect(fieldValue('Brand')).toBe('Honda');
    expect(fieldValue('Model')).toBe('CB500');
    expect(fieldValue('Name')).toBe('');
    expect(fieldValue('Phone')).toBe('');
    expect(fieldValue('Notes')).toBe('');

    await user.clear(screen.getByLabelText('Brand'));
    await user.type(screen.getByLabelText('Brand'), 'Toyota');
    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Phone'), '+1234567890');
    await user.type(screen.getByLabelText('Notes'), 'New stay');
    await user.click(screen.getByRole('button', { name: 'Start session' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        brand: 'Toyota',
        customerName: 'Jane Doe',
        customerPhone: '+1234567890',
        model: 'CB500',
        notes: 'New stay',
        plate: 'AB123CD',
        type: 'MOTORCYCLE',
      });
    });
  });

  it('ignores stale lookup responses and clears a prior prefill after a plate change', async () => {
    const pending = new Map<string, (result: { vehicle: unknown }) => void>();
    api.lookupVehicle.mockImplementation(
      (_parkingId: string, plate: string) =>
        new Promise((resolve) => {
          pending.set(plate, resolve);
        }),
    );
    render(<CheckInPanel onSubmit={vi.fn()} parkingId="parking-1" />);

    const plateInput = screen.getByLabelText('Plate');
    fireEvent.change(plateInput, { target: { value: 'AB123CD' } });
    await waitFor(() => {
      expect(api.lookupVehicle).toHaveBeenCalledWith('parking-1', 'AB123CD');
    });

    fireEvent.change(plateInput, { target: { value: 'XY456ZZ' } });
    await waitFor(() => {
      expect(api.lookupVehicle).toHaveBeenCalledWith('parking-1', 'XY456ZZ');
    });

    pending.get('XY456ZZ')?.({
      vehicle: {
        id: 'vehicle-2',
        plate: 'XY456ZZ',
        type: 'MOTORCYCLE',
        brand: 'Honda',
        model: 'CB500',
      },
    });
    await waitFor(() => {
      expect(fieldValue('Brand')).toBe('Honda');
    });

    fireEvent.change(plateInput, { target: { value: 'ZZ999ZZ' } });
    await waitFor(() => {
      expect(fieldValue('Type')).toBe('CAR');
      expect(fieldValue('Brand')).toBe('');
      expect(fieldValue('Model')).toBe('');
    });

    pending.get('AB123CD')?.({
      vehicle: {
        id: 'vehicle-1',
        plate: 'AB123CD',
        type: 'CAR',
        brand: 'Toyota',
        model: 'Corolla',
      },
    });
    await new Promise((resolve) => window.setTimeout(resolve, 25));

    expect(fieldValue('Brand')).toBe('');
    expect(fieldValue('Model')).toBe('');
  });

  it('keeps validation inline and normalizes a plate before submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CheckInPanel onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Start session' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Enter a vehicle plate.');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Plate'), ' ab-123 cd ');
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'MOTORCYCLE' } });
    await user.click(screen.getByRole('button', { name: 'Start session' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ plate: 'AB123CD', type: 'MOTORCYCLE' });
    });
  });

  it('rejects a plate that remains invalid after normalization', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CheckInPanel onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Plate'), 'a-1');
    await user.click(screen.getByRole('button', { name: 'Start session' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Use 4 to 10 alphanumeric characters.',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('localizes validation and controls in Spanish', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    window.localStorage.setItem('parkcore-lang', 'es-AR');
    render(
      <AppearanceProvider>
        <CheckInPanel onSubmit={onSubmit} />
      </AppearanceProvider>,
    );

    expect(screen.getByLabelText('Patente')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Iniciar estadía' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Iniciar estadía' }));

    expect(await screen.findByText('Ingresa una patente.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('OccupancyMeter', () => {
  it('exposes the numerical occupancy to assistive technology', () => {
    render(<OccupancyMeter active={7} capacity={10} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('7');
    expect(screen.getByLabelText('7 of 10 spaces occupied')).toBeTruthy();
  });
});
