import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from './form-field.js';
import { Input } from '../ui/input.js';
import { Switch } from '../ui/switch.js';

describe('FormField', () => {
  it('connects an inline error to its control', () => {
    render(
      <FormField error="Use a valid rate." htmlFor="rate" label="Hourly rate">
        <Input />
      </FormField>,
    );

    const input = screen.getByLabelText('Hourly rate');
    const error = screen.getByRole('alert');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('connects help text without marking a valid Radix switch invalid', () => {
    render(
      <FormField
        help="Opening and closing times are not required."
        htmlFor="open"
        label="Open 24 hours"
      >
        <Switch id="open" />
      </FormField>,
    );

    const control = screen.getByRole('switch', { name: 'Open 24 hours' });
    expect(control.getAttribute('aria-describedby')).toBe('open-help');
    expect(control.hasAttribute('aria-invalid')).toBe(false);
  });
});
