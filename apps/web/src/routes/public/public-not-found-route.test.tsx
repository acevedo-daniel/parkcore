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

    expect(screen.getByRole('heading', { name: 'We could not find this facility.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore facilities' }).getAttribute('href')).toBe(
      '/parkings',
    );
    expect(document.title).toBe('Facility not found | ParkCore');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex',
    );
  });
});
