import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ParkingForm } from './parking-form.js';

afterEach(cleanup);

describe('ParkingForm', () => {
  it('keeps validation inline and submits the hourly rate as integer cents', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ParkingForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Create parking' }));
    expect((await screen.findAllByText('Use at least 5 characters.')).length).toBe(2);
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Name'), 'Central Parking');
    await user.type(screen.getByLabelText('Address'), '123 Main Street');
    await user.clear(screen.getByLabelText('Latitude'));
    await user.type(screen.getByLabelText('Latitude'), '-34.6037');
    await user.clear(screen.getByLabelText('Longitude'));
    await user.type(screen.getByLabelText('Longitude'), '-58.3816');
    await user.clear(screen.getByLabelText('Hourly rate (USD)'));
    await user.type(screen.getByLabelText('Hourly rate (USD)'), '15.55');
    await user.click(screen.getByRole('button', { name: 'Create parking' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        address: '123 Main Street',
        capacity: 1,
        currency: 'USD',
        hourlyRateCents: 1555,
        lat: -34.6037,
        lng: -58.3816,
        title: 'Central Parking',
      });
    });
  });

  it('requires explicit coordinates when creating a parking', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ParkingForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText<HTMLInputElement>('Latitude').value).toBe('');
    expect(screen.getByLabelText<HTMLInputElement>('Longitude').value).toBe('');
    await user.click(screen.getByRole('button', { name: 'Create parking' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
