import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Field, Input } from './field.js';

describe('Field', () => {
  it('connects an inline error to its control', () => {
    render(
      <Field error="Use a valid rate." htmlFor="rate" label="Hourly rate">
        <Input id="rate" />
      </Field>,
    );

    const input = screen.getByLabelText('Hourly rate');
    const error = screen.getByRole('alert');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('connects field help without marking a valid control invalid', () => {
    render(
      <Field help="Enter USD cents." htmlFor="rate" label="Hourly rate">
        <Input id="rate" />
      </Field>,
    );

    const input = screen.getByLabelText('Hourly rate');
    expect(input.getAttribute('aria-describedby')).toBe('rate-help');
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });
});
