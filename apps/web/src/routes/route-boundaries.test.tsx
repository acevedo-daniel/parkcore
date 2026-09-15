import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppearanceProvider } from '../app/appearance-provider.js';
import { OwnerRouteErrorBoundary, PublicRouteErrorBoundary } from './route-boundaries.js';

describe('PublicRouteErrorBoundary', () => {
  it('hides raw route errors and provides localized metadata and recovery', async () => {
    window.localStorage.setItem('parkcore-lang', 'en-US');
    const router = createMemoryRouter(
      [
        {
          path: '/',
          loader: () => {
            throw new Error('raw backend failure');
          },
          element: <p>Route content</p>,
          errorElement: <PublicRouteErrorBoundary />,
        },
      ],
      { initialEntries: ['/'] },
    );

    render(
      <AppearanceProvider>
        <RouterProvider router={router} />
      </AppearanceProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'We could not open this view.' }),
    ).toBeTruthy();
    expect(screen.queryByText('raw backend failure')).toBeNull();
    expect(screen.getByRole('link', { name: 'Go home' }).getAttribute('href')).toBe('/');
    expect(document.title).toBe('View unavailable | ParkCore');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex',
    );
  });
});

describe('OwnerRouteErrorBoundary', () => {
  it('uses the owner recovery composition without exposing raw errors', async () => {
    window.localStorage.setItem('parkcore-lang', 'en-US');
    const router = createMemoryRouter(
      [
        {
          path: '/app',
          loader: () => {
            throw new Error('raw owner failure');
          },
          element: <p>Route content</p>,
          errorElement: <OwnerRouteErrorBoundary />,
        },
      ],
      { initialEntries: ['/app'] },
    );

    render(
      <AppearanceProvider>
        <RouterProvider router={router} />
      </AppearanceProvider>,
    );

    expect(
      await screen.findByRole('heading', { name: 'We could not open this view.' }),
    ).toBeTruthy();
    expect(screen.queryByText('raw owner failure')).toBeNull();
    expect(screen.getByRole('link', { name: 'Go to overview' }).getAttribute('href')).toBe('/app');
    expect(screen.getByRole('link', { name: 'View parkings' }).getAttribute('href')).toBe(
      '/app/parkings',
    );
    expect(screen.getByRole('alert').querySelector('div')?.className).toContain('bg-accent-soft');
  });
});
