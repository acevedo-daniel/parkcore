import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { Combobox } from './combobox.js';

const options = [
  { label: 'Central Parking', value: 'central' },
  { label: 'North Garage', value: 'north' },
  { label: 'South Garage', value: 'south' },
];

function renderCombobox(children: ReactNode) {
  return render(<AppearanceProvider>{children}</AppearanceProvider>);
}

describe('Combobox', () => {
  it('filters options, selects a match, and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderCombobox(
      <Combobox
        defaultValue="central"
        label="Facility"
        onValueChange={onValueChange}
        options={options}
      />,
    );

    const trigger = screen.getByRole('combobox', { name: 'Facility' });
    await user.click(trigger);
    await user.type(screen.getByPlaceholderText('Facility'), 'North');
    await user.click(screen.getByRole('option', { name: 'North Garage' }));

    expect(onValueChange).toHaveBeenCalledWith('north', options[1]);
    expect(trigger.textContent).toContain('North Garage');
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('supports keyboard selection and Escape dismissal without losing selection', async () => {
    const user = userEvent.setup();
    renderCombobox(<Combobox defaultValue="central" label="Facility" options={options} />);

    const trigger = screen.getByRole('combobox', { name: 'Facility' });
    await user.click(trigger);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(trigger.textContent).toContain('North Garage');

    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(trigger);
    expect(trigger.textContent).toContain('North Garage');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('skips disabled options and submits the selected value through the form name', async () => {
    const user = userEvent.setup();
    renderCombobox(
      <form aria-label="Facility">
        <Combobox
          label="Facility"
          name="facility"
          options={[options[0], { ...options[1], disabled: true }, options[2]]}
        />
      </form>,
    );

    const trigger = screen.getByRole('combobox', { name: 'Facility' });
    await user.click(trigger);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(trigger.textContent).toContain('South Garage');
    expect(
      new FormData(screen.getByRole<HTMLFormElement>('form', { name: 'Facility' })).get('facility'),
    ).toBe('south');
  });
});
