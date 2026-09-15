import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '../../components/ui/feedback.js';
import { ApiError } from '../../lib/api/api-error.js';
import { parkingFixture } from '../../test/fixtures.js';
import { OwnerEditParkingRoute } from './owner-edit-parking-route.js';

const api = vi.hoisted(() => ({
  getOwnedParkings: vi.fn(),
  updateParking: vi.fn(),
}));

vi.mock('../../lib/api/owner-api.js', () => api);

function renderEditParking() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/app/parkings/:parkingId/edit', element: <OwnerEditParkingRoute /> },
      { path: '/app/parkings/:parkingId', element: <p>Parking overview</p> },
    ],
    { initialEntries: ['/app/parkings/parking-1/edit'] },
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  api.getOwnedParkings.mockReset();
  api.updateParking.mockReset();
});

describe('edit parking workflow', () => {
  it('shows the server active-session count for a rejected capacity reduction', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture({ capacity: 5 })]);
    api.updateParking.mockRejectedValue(
      new ApiError('Capacity conflict', 409, 'CAPACITY_BELOW_ACTIVE', {
        activeSessionCount: 4,
      }),
    );
    renderEditParking();

    await screen.findByLabelText('Capacity');
    await user.clear(screen.getByLabelText('Capacity'));
    await user.type(screen.getByLabelText('Capacity'), '3');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Capacity cannot be reduced: 4 sessions are already active.',
    );
  });

  it('keeps an explicit cancellation available after editing', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([parkingFixture()]);
    renderEditParking();

    await screen.findByLabelText('Name');
    await user.type(screen.getByLabelText('Name'), ' Updated');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('Parking overview')).toBeTruthy();
  });
});
