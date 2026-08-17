import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button, IconButton } from './button.js';
import { EmptyState, ErrorState } from './feedback.js';

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
    expect(screen.getByRole('alert').textContent).toContain('The operation could not be loaded.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
