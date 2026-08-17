import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from '../../components/ui/feedback.js';
import { parkingFixture } from '../../test/fixtures.js';
import { OwnerCreateParkingRoute } from './owner-create-parking-route.js';

const api = vi.hoisted(() => ({ createParking: vi.fn() }));

vi.mock('../../lib/api/owner-api.js', () => ({ createParking: api.createParking }));

function renderCreateParking() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/app/parkings/new', element: <OwnerCreateParkingRoute /> },
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
    await user.type(screen.getByLabelText('Address'), '202 North Street');
    await user.clear(screen.getByLabelText('Latitude'));
    await user.type(screen.getByLabelText('Latitude'), '-34.61');
    await user.clear(screen.getByLabelText('Longitude'));
    await user.type(screen.getByLabelText('Longitude'), '-58.38');
    await user.clear(screen.getByLabelText('Capacity'));
    await user.type(screen.getByLabelText('Capacity'), '20');
    await user.clear(screen.getByLabelText('Hourly rate (USD)'));
    await user.type(screen.getByLabelText('Hourly rate (USD)'), '18.5');
    await user.click(screen.getByRole('button', { name: 'Create parking' }));

    await waitFor(() => {
      expect(api.createParking.mock.calls[0]?.[0]).toEqual({
        address: '202 North Street',
        capacity: 20,
        currency: 'USD',
        hourlyRateCents: 1850,
        lat: -34.61,
        lng: -58.38,
        title: 'North Garage',
      });
    });
    expect(await screen.findByText('Parking created')).toBeTruthy();
  });
});
