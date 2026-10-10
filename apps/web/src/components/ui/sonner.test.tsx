import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { toast } from 'sonner';

import { Button } from './button.js';
import { Toaster } from './sonner.js';

function ToastHarness() {
  return (
    <Button onClick={() => toast.success('The parking was updated.')}>Show notification</Button>
  );
}

describe('Sonner notifications', () => {
  afterEach(() => {
    toast.dismiss();
  });

  it('renders notifications in the labeled live region', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Toaster
          containerAriaLabel="Notifications"
          duration={Infinity}
          position="bottom-right"
          theme="dark"
        />
        <ToastHarness />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Show notification' }));
    expect(await screen.findByText('The parking was updated.')).toBeTruthy();
    expect(screen.getByLabelText(/Notifications/)).toBeTruthy();
    expect(document.querySelector('[data-sonner-toast]')).not.toBeNull();
  });
});
