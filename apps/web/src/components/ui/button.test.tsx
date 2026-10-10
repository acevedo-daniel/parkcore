import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button.js';

describe('Button', () => {
  it('keeps actions available to keyboard and assistive technology', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Start operation</Button>);

    expect(screen.getByRole('button', { name: 'Start operation' }).className).toContain('min-h-11');
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Start operation' }));
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('requires a name for icon-only actions', () => {
    render(
      <Button aria-label="Close panel" size="icon">
        <span aria-hidden="true">x</span>
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Close panel' })).toBeTruthy();
  });
});
