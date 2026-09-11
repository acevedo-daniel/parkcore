import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Combobox } from './combobox.js';

const options = [
  { label: 'Central Parking', value: 'central' },
  { label: 'North Garage', value: 'north' },
  { label: 'South Garage', value: 'south' },
];

describe('Combobox', () => {
  it('supports option navigation, active state, selection, and focus restoration', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox label="Facility" onValueChange={onValueChange} options={options} value="central" />,
    );

    const input = screen.getByRole('combobox', { name: 'Facility' });
    await user.click(input);
    expect(screen.getByRole('listbox')).toBeTruthy();

    await user.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toContain('option-north');
    await user.keyboard('{End}');
    expect(input.getAttribute('aria-activedescendant')).toContain('option-south');
    await user.keyboard('{Home}');
    expect(input.getAttribute('aria-activedescendant')).toContain('option-central');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('north', options[1]);
    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).value).toBe('North Garage');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('dismisses on Escape and outside click without losing the selected value', async () => {
    const user = userEvent.setup();
    render(<Combobox defaultValue="central" label="Facility" options={options} />);

    const input = screen.getByRole('combobox', { name: 'Facility' });
    await user.click(input);
    await user.clear(input);
    await user.type(input, 'North');
    await user.keyboard('{Escape}');

    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).value).toBe('Central Parking');
    expect(screen.queryByRole('listbox')).toBeNull();

    await user.click(input);
    expect(screen.getByRole('listbox')).toBeTruthy();
    await user.click(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('exposes option selection state and skips disabled options', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="Facility"
        options={[options[0], { ...options[1], disabled: true }, options[2]]}
      />,
    );

    const input = screen.getByRole('combobox', { name: 'Facility' });
    await user.click(input);
    expect(
      screen.getByRole('option', { name: 'Central Parking' }).getAttribute('aria-selected'),
    ).toBe('false');
    await user.keyboard('{ArrowDown}{Enter}');
    expect((input as HTMLInputElement).value).toBe('South Garage');
  });

  it('opens on a collapsed ArrowDown without skipping the first option', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Facility" options={options} />);

    const input = screen.getByRole('combobox', { name: 'Facility' });
    input.focus();
    await user.keyboard('{Escape}');
    await user.keyboard('{ArrowDown}');

    expect(input.getAttribute('aria-activedescendant')).toContain('option-central');
  });
});
