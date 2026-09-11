import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Checkbox, Field, Input, Select, Textarea } from './field.js';

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

  it('keeps native control refs and disabled behavior available', () => {
    const inputRef = createRef<HTMLInputElement>();
    render(
      <>
        <Input ref={inputRef} />
        <Textarea aria-label="Notes" />
        <Select aria-label="Currency">
          <option value="USD">USD</option>
        </Select>
        <Checkbox disabled label="Available now" />
      </>,
    );

    expect(inputRef.current).toBe(screen.getByRole('textbox', { name: '' }));
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Currency' })).toBeTruthy();
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Available now' }).disabled).toBe(
      true,
    );
  });
});
