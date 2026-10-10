import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Button } from '../ui/button.js';
import { AppDialog, AppSheet } from './app-dialog.js';

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open checkout
      </Button>
      <AppDialog
        description="Review the total before completing the checkout."
        onOpenChange={setOpen}
        open={open}
        title="Complete checkout"
      >
        <Button>Complete checkout</Button>
      </AppDialog>
    </>
  );
}

function SheetHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open filters
      </Button>
      <AppSheet
        description="Choose which facilities should be visible."
        onOpenChange={setOpen}
        open={open}
        title="Filter facilities"
      >
        <Button>Apply filters</Button>
      </AppSheet>
    </>
  );
}

describe('app dialogs and sheets', () => {
  it('moves focus into the dialog, traps it, and restores it to the trigger', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole('button', { name: 'Open checkout' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Complete checkout' });
    expect(dialog.getAttribute('aria-describedby')).not.toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Close Complete checkout' }),
      );
    });
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Complete checkout' }));
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Close Complete checkout' }),
    );

    await user.click(screen.getByRole('button', { name: 'Close Complete checkout' }));
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('dismisses a sheet with Escape and restores focus to its trigger', async () => {
    const user = userEvent.setup();
    render(<SheetHarness />);

    const trigger = screen.getByRole('button', { name: 'Open filters' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Filter facilities' });
    expect(dialog.getAttribute('aria-describedby')).not.toBeNull();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Filter facilities' })).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });
});
