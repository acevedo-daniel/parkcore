import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { OwnerNotFoundRoute } from './owner-not-found-route.js';

function renderNotFound(locale: 'en-US' | 'es-AR', theme?: 'dark' | 'light') {
  window.localStorage.setItem('parkcore-lang', locale);
  if (theme) window.localStorage.setItem('parkcore-theme', theme);

  return render(
    <AppearanceProvider>
      <MemoryRouter initialEntries={['/app/missing']}>
        <OwnerNotFoundRoute />
      </MemoryRouter>
    </AppearanceProvider>,
  );
}

describe('OwnerNotFoundRoute', () => {
  it('provides localized owner recovery in the light theme', () => {
    renderNotFound('en-US', 'light');

    expect(screen.getByRole('heading', { name: 'This view is unavailable.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to overview' }).getAttribute('href')).toBe('/app');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('alert').querySelector('div')?.className).toContain('bg-accent-soft');
    expect(document.title).toBe('ParkCore | Operations');
  });

  it('keeps the same recovery contract in Spanish and dark mode', () => {
    renderNotFound('es-AR', 'dark');

    expect(screen.getByRole('heading', { name: 'Esta vista no está disponible.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ir al resumen' }).getAttribute('href')).toBe('/app');
    expect(document.documentElement.lang).toBe('es-AR');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
