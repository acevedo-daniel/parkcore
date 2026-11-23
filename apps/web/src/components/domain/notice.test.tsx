import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Notice } from './notice.js';

describe('Notice', () => {
  it('renders a warning message with the passed role and an action slot', () => {
    render(
      <Notice action={<button type="button">Refresh</button>} role="alert">
        Facility data may be out of date.
      </Notice>,
    );

    const notice = screen.getByRole('alert');
    expect(notice.textContent).toContain('Facility data may be out of date.');
    expect(notice.getAttribute('data-tone')).toBe('warning');
    expect(notice.className).toContain('bg-warning-soft');
    expect(notice.className).toContain('rounded-lg');
    expect(notice.className).toContain('sm:flex-row');
    expect(
      screen.getByRole('button', { name: 'Refresh' }).closest('[data-slot="notice-action"]'),
    ).toBeTruthy();
  });

  it('renders the destructive tone and keeps a stacked layout without an action', () => {
    render(
      <Notice aria-live="assertive" role="status" tone="destructive">
        The export failed.
      </Notice>,
    );

    const notice = screen.getByRole('status');
    expect(notice.getAttribute('data-tone')).toBe('destructive');
    expect(notice.getAttribute('aria-live')).toBe('assertive');
    expect(notice.className).toContain('bg-destructive-soft');
    expect(notice.className).toContain('text-destructive-soft-foreground');
    expect(notice.className).not.toContain('sm:flex-row');
    expect(notice.querySelector('[data-slot="notice-action"]')).toBeNull();
  });
});
