import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { ToastProvider } from '../../components/ui/feedback.js';
import { parkingFixture } from '../../test/fixtures.js';
import { OwnerParkingsRoute } from './owner-parkings-route.js';

const api = vi.hoisted(() => ({ getOwnedParkings: vi.fn() }));

vi.mock('../../lib/api/owner-api.js', () => ({ getOwnedParkings: api.getOwnedParkings }));

function renderParkings(locale: 'es-AR' | 'en-US' = 'en-US') {
  window.localStorage.setItem('parkcore-lang', locale);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: '/app/parkings', element: <OwnerParkingsRoute /> },
      { path: '/app/parkings/:parkingId', element: <p>Operations</p> },
      { path: '/app/parkings/:parkingId/edit', element: <p>Edit</p> },
      { path: '/app/parkings/:parkingId/sessions', element: <p>History</p> },
      { path: '/app/parkings/new', element: <p>Create</p> },
    ],
    { initialEntries: ['/app/parkings'] },
  );

  return render(
    <AppearanceProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </AppearanceProvider>,
  );
}

afterEach(() => {
  api.getOwnedParkings.mockReset();
});

describe('owner parking list', () => {
  it('renders the server snapshot with separate keyboard-reachable actions', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockResolvedValue([
      parkingFixture({
        activeSessionCount: 2,
        availableSpaces: 10,
        availabilityState: 'LIMITED',
        isListed: true,
        occupancyPercent: 25,
      }),
    ]);
    renderParkings();

    expect(await screen.findByRole('heading', { name: 'Facilities, made clear.' })).toBeTruthy();
    expect(screen.getByText('Limited spaces')).toBeTruthy();
    expect(screen.getByText('Visible in directory')).toBeTruthy();
    expect(
      screen.getByRole('progressbar', {
        name: '2 of 12 occupied, 10 open (25%).',
      }),
    ).toBeTruthy();

    const openLink = screen.getByRole('link', { name: 'Open operations for Central Parking' });
    const editLink = screen.getByRole('link', { name: 'Edit Central Parking' });
    const historyLink = screen.getByRole('link', { name: 'View history for Central Parking' });
    expect(openLink.getAttribute('href')).toBe('/app/parkings/parking-1');
    expect(editLink.getAttribute('href')).toBe('/app/parkings/parking-1/edit');
    expect(historyLink.getAttribute('href')).toBe('/app/parkings/parking-1/sessions');

    openLink.focus();
    await user.tab();
    expect(document.activeElement).toBe(editLink);
    await user.tab();
    expect(document.activeElement).toBe(historyLink);
    expect(api.getOwnedParkings).toHaveBeenCalledTimes(1);
  });

  it('keeps empty onboarding and recovery copy localized in Spanish', async () => {
    api.getOwnedParkings.mockResolvedValue([]);
    renderParkings('es-AR');

    expect(await screen.findByRole('heading', { name: 'Todavía no hay cocheras' })).toBeTruthy();
    expect(screen.getByText('Creá la primera para empezar a registrar la operación.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Crear cochera' }).getAttribute('href')).toBe(
      '/app/parkings/new',
    );
  });

  it('offers a typed retry when the facility list cannot be loaded', async () => {
    const user = userEvent.setup();
    api.getOwnedParkings.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce([]);
    renderParkings();

    expect(await screen.findByRole('alert')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'No facilities yet' })).toBeTruthy();
    });
  });
});
