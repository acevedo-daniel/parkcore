import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CheckInPanel } from './check-in-panel.js';
import { OccupancyMeter } from './parking.js';

describe('CheckInPanel', () => {
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
});

describe('OccupancyMeter', () => {
  it('exposes the numerical occupancy to assistive technology', () => {
    render(<OccupancyMeter active={7} capacity={10} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('7');
    expect(screen.getByLabelText('7 of 10 spaces occupied')).toBeTruthy();
  });
});
