import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { EmptyState, ErrorState } from './feedback.js';

describe('shared feedback states', () => {
  it('renders empty and retryable error states with their live-region semantics', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <>
        <EmptyState title="No active sessions">Check in a vehicle to begin.</EmptyState>
        <ErrorState onRetry={onRetry}>The operation could not be loaded.</ErrorState>
      </>,
    );

    expect(screen.getByText('No active sessions')).toBeTruthy();
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
    expect(screen.getByRole('alert').textContent).toContain('The operation could not be loaded.');
    expect(screen.getByRole('alert').getAttribute('aria-atomic')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('supports a compact empty state without the default card framing', () => {
    render(
      <EmptyState compactLayout="split" title="No facilities yet" variant="compact">
        The directory will fill in as facilities become available.
      </EmptyState>,
    );

    const emptyState = screen.getByRole('status');
    expect(emptyState.getAttribute('data-slot')).toBe('empty-state');
    expect(emptyState.getAttribute('data-variant')).toBe('compact');
    expect(emptyState.getAttribute('data-layout')).toBe('split');
    expect(emptyState.className).not.toContain('min-h-56');
    expect(screen.queryByRole('heading', { name: 'No facilities yet' })).toBeNull();
  });

  it('uses the selected language in the retry action and error eyebrow', () => {
    window.localStorage.setItem('parkcore-lang', 'es');
    render(
      <AppearanceProvider>
        <ErrorState onRetry={() => undefined}>No se pudo cargar la operación.</ErrorState>
      </AppearanceProvider>,
    );

    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
    expect(screen.getByText('Necesita atención')).toBeTruthy();
    window.localStorage.removeItem('parkcore-lang');
  });
});
