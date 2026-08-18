import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { Button } from './button.js';
import { Dialog } from './dialog.js';

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
      <Dialog onOpenChange={setOpen} open={open} title="Complete checkout">
        <Button>Complete checkout</Button>
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('moves focus into the dialog and restores it to the trigger when closed', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole('button', { name: 'Open checkout' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Complete checkout' });
    expect(dialog).toBeTruthy();
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
});
