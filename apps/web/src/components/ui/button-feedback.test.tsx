import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { Button, IconButton } from './button.js';
import { EmptyState, ErrorState, Skeleton, ToastProvider } from './feedback.js';
import { useToast } from './toast-context.js';

function ToastHarness() {
  const { showToast } = useToast();
  return (
    <Button
      onClick={() => {
        showToast('The parking was updated.');
      }}
    >
      Show notification
    </Button>
  );
}

describe('core UI feedback and actions', () => {
  it('keeps button actions available to keyboard and assistive technology', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Start operation</Button>);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Start operation' }));
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('requires a name for icon-only actions', () => {
    render(
      <IconButton aria-label="Close panel">
        <span aria-hidden="true">x</span>
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Close panel' })).toBeTruthy();
  });

  it('renders clear empty and retryable error states', async () => {
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

  it('marks skeleton feedback as non-interactive busy content', () => {
    const { container } = render(<Skeleton className="h-10" />);
    const skeleton = container.querySelector('[data-slot="skeleton"]');

    expect(skeleton).not.toBeNull();
    expect(skeleton?.getAttribute('aria-busy')).toBe('true');
    expect(skeleton?.getAttribute('aria-hidden')).toBe('true');
  });

  it('uses the selected language in shared feedback states', () => {
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

  it('dismisses toast feedback from the keyboard-accessible close action', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Show notification' }));
    expect(await screen.findByText('The parking was updated.')).toBeTruthy();

    const close = screen.getByRole('button', { name: 'Dismiss notification' });
    close.focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByText('The parking was updated.')).toBeNull();
  });
});
