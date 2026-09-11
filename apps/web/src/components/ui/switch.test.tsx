import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Switch } from './switch.js';

function SwitchHarness() {
  const [checked, setChecked] = useState(false);
  return (
    <Switch
      checked={checked}
      description="Opening and closing times are not required."
      label="Open 24 hours"
      onChange={(event) => {
        setChecked(event.currentTarget.checked);
      }}
    />
  );
}

describe('Switch', () => {
  it('exposes switch semantics, description, and keyboard toggling', async () => {
    const user = userEvent.setup();
    render(<SwitchHarness />);

    const control = screen.getByRole<HTMLInputElement>('switch', { name: 'Open 24 hours' });
    expect(control.getAttribute('aria-describedby')).toBe(`${control.id}-description`);
    expect(control.checked).toBe(false);

    await user.tab();
    expect(document.activeElement).toBe(control);
    await user.keyboard(' ');
    expect(control.checked).toBe(true);
  });

  it('does not expose a disabled switch as an interactive control', () => {
    render(<Switch disabled label="Accept new check-ins" />);

    const control = screen.getByRole<HTMLInputElement>('switch', {
      name: 'Accept new check-ins',
    });
    expect(control.disabled).toBe(true);
  });
});
