import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { PublicNotFoundRoute } from './public-not-found-route.js';

describe('PublicNotFoundRoute', () => {
  it('provides a localized, semantic recovery path to the directory', () => {
    window.localStorage.setItem('parkcore-lang', 'en-US');
    render(
      <AppearanceProvider>
        <MemoryRouter>
          <PublicNotFoundRoute />
        </MemoryRouter>
      </AppearanceProvider>,
    );

    expect(screen.getByRole('heading', { name: 'We could not find this page.' })).toBeTruthy();
    expect(
      screen.getByText(
        'This address does not exist or has changed. Browse the listed facilities to continue.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore facilities' }).getAttribute('href')).toBe(
      '/parkings',
    );
    expect(document.title).toBe('Page not found | ParkCore');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex',
    );
  });

  it('renders the Spanish page-not-found copy', () => {
    window.localStorage.setItem('parkcore-lang', 'es-AR');
    render(
      <AppearanceProvider>
        <MemoryRouter>
          <PublicNotFoundRoute />
        </MemoryRouter>
      </AppearanceProvider>,
    );

    expect(screen.getByRole('heading', { name: 'No encontramos esta página.' })).toBeTruthy();
    expect(
      screen.getByText(
        'La dirección no existe o cambió. Explora las cocheras publicadas para seguir.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ver cocheras' }).getAttribute('href')).toBe(
      '/parkings',
    );
    expect(document.title).toBe('Página no encontrada | ParkCore');
    window.localStorage.removeItem('parkcore-lang');
  });
});
