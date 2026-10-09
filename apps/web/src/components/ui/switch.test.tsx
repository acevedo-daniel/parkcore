import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { FormField } from '../domain/form-field.js';
import { Switch } from './switch.js';

function SwitchHarness() {
  const [checked, setChecked] = useState(false);
  return (
    <FormField
      help="Opening and closing times are not required."
      htmlFor="open"
      label="Open 24 hours"
    >
      <Switch checked={checked} id="open" onCheckedChange={setChecked} />
    </FormField>
  );
}

describe('Switch', () => {
  it('exposes switch semantics, description, and keyboard toggling', async () => {
    const user = userEvent.setup();
    render(<SwitchHarness />);

    const control = screen.getByRole('switch', { name: 'Open 24 hours' });
    expect(control.getAttribute('aria-describedby')).toBe('open-help');
    expect(control.getAttribute('data-state')).toBe('unchecked');

    await user.tab();
    expect(document.activeElement).toBe(control);
    await user.keyboard(' ');
    expect(control.getAttribute('data-state')).toBe('checked');
  });

  it('keeps a disabled switch disabled', () => {
    render(
      <FormField htmlFor="accept" label="Accept new check-ins">
        <Switch disabled id="accept" />
      </FormField>,
    );

    expect(
      screen.getByRole('switch', { name: 'Accept new check-ins' }).hasAttribute('data-disabled'),
    ).toBe(true);
  });
});
