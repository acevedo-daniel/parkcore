import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '../../components/ui/feedback.js';
import { ApiError } from '../../lib/api/api-error.js';
import { parkingFixture } from '../../test/fixtures.js';
import { OwnerCreateParkingRoute } from './owner-create-parking-route.js';

const api = vi.hoisted(() => ({ createParking: vi.fn() }));

vi.mock('../../lib/api/owner-api.js', () => ({ createParking: api.createParking }));
vi.mock('../../features/auth/use-auth.js', () => ({
  useAuth: () => ({ user: { timezone: 'America/Argentina/Buenos_Aires' } }),
}));

function renderCreateParking() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/app/parkings/new', element: <OwnerCreateParkingRoute /> },
      { path: '/app/parkings', element: <p>Parking list</p> },
      { path: '/app/parkings/:parkingId', element: <p>Parking created</p> },
    ],
    { initialEntries: ['/app/parkings/new'] },
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
  api.createParking.mockReset();
});

describe('create parking workflow', () => {
  it('submits the validated parking form through the API and opens the new operation', async () => {
    const user = userEvent.setup();
    api.createParking.mockResolvedValue(parkingFixture({ id: 'parking-2', title: 'North Garage' }));
    renderCreateParking();

    await user.type(screen.getByLabelText('Name'), 'North Garage');
    await user.type(screen.getByLabelText('Neighborhood'), 'Downtown');
    await user.type(screen.getByLabelText('Address'), '202 North Street');
    await user.clear(screen.getByLabelText('Latitude'));
    await user.type(screen.getByLabelText('Latitude'), '-34.61');
    await user.clear(screen.getByLabelText('Longitude'));
    await user.type(screen.getByLabelText('Longitude'), '-58.38');
    await user.clear(screen.getByLabelText('Capacity'));
    await user.type(screen.getByLabelText('Capacity'), '20');
    await user.clear(screen.getByLabelText('Hourly rate (ARS)'));
    await user.type(screen.getByLabelText('Hourly rate (ARS)'), '18.5');
    await user.click(screen.getByRole('button', { name: 'Create parking' }));

    await waitFor(() => {
      expect(api.createParking.mock.calls[0]?.[0]).toEqual({
        address: '202 North Street',
        capacity: 20,
        closesAt: null,
        currency: 'ARS',
        hourlyRateCents: 1850,
        is24Hours: true,
        isListed: false,
        lat: -34.61,
        lng: -58.38,
        neighborhood: 'Downtown',
        opensAt: null,
        title: 'North Garage',
        timezone: 'America/Argentina/Buenos_Aires',
      });
    });
    expect(await screen.findByText('Parking created')).toBeTruthy();
  });

  it('shows the active-session count when the API rejects a capacity reduction', async () => {
    const user = userEvent.setup();
    api.createParking.mockRejectedValue(
      new ApiError('Capacity conflict', 409, 'CAPACITY_BELOW_ACTIVE', {
        activeSessionCount: 3,
      }),
    );
    renderCreateParking();

    await user.type(screen.getByLabelText('Name'), 'North Garage');
    await user.type(screen.getByLabelText('Neighborhood'), 'Downtown');
    await user.type(screen.getByLabelText('Address'), '202 North Street');
    await user.type(screen.getByLabelText('Latitude'), '-34.61');
    await user.type(screen.getByLabelText('Longitude'), '-58.38');
    await user.click(screen.getByRole('button', { name: 'Create parking' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Capacity cannot be reduced: 3 sessions are already active.',
    );
  });

  it('allows explicit cancellation after editing without showing the dirty prompt', async () => {
    const user = userEvent.setup();
    renderCreateParking();

    await user.type(screen.getByLabelText('Name'), 'North Garage');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('Parking list')).toBeTruthy();
    expect(screen.queryByText('You have unsaved changes')).toBeNull();
  });

  it('blocks browser unload after the form becomes dirty', async () => {
    const user = userEvent.setup();
    renderCreateParking();

    await user.type(screen.getByLabelText('Name'), 'North Garage');
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
