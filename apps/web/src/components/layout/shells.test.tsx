import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { OwnerLayout } from './owner-layout.js';
import { PublicLayout } from './public-layout.js';
import { AppearanceProvider } from '../../app/appearance-provider.js';
import { ToastProvider } from '../ui/feedback.js';
import { AuthProvider } from '../../features/auth/auth-provider.js';

function renderRoute(element: ReactNode, path: string) {
  const router = createMemoryRouter(
    [{ path, element, children: [{ index: true, element: <p>Route content</p> }] }],
    { initialEntries: [path] },
  );
  return render(
    <AppearanceProvider>
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppearanceProvider>,
  );
}

describe('application shells', () => {
  it('renders restrained public navigation in a semantic header', () => {
    renderRoute(<PublicLayout />, '/');
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Navegación pública' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Cómo funciona' }).getAttribute('href')).toBe(
      '/#como-funciona',
    );
    expect(screen.getByRole('link', { name: 'Ingresar' }).getAttribute('href')).toBe('/login');
    expect(screen.getByRole('button', { name: 'Probar demo' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Get started' })).toBeNull();
  });

  it('opens an accessible compact public navigation when requested', async () => {
    const user = userEvent.setup();
    renderRoute(<PublicLayout />, '/');

    await user.click(screen.getByRole('button', { name: 'Abrir navegación' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('navigation', { name: 'Navegación pública' })).toBeTruthy();
    expect(
      within(dialog)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Cocheras', 'Cómo funciona', 'Ingresar']);
    expect(within(dialog).getByRole('button', { name: 'Probar demo' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Español' })).toBeTruthy();
    expect(within(dialog).getByRole('combobox', { name: 'Apariencia' })).toBeTruthy();
  });

  it('returns focus to the compact menu trigger after dismissal', async () => {
    const user = userEvent.setup();
    renderRoute(<PublicLayout />, '/');

    const trigger = screen.getByRole('button', { name: 'Abrir navegación' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar navegación' }));

    expect(document.activeElement).toBe(trigger);
  });

  it('keeps the public shell names complete in English', () => {
    window.localStorage.setItem('parkcore-lang', 'en-US');
    renderRoute(<PublicLayout />, '/');

    expect(screen.getByRole('navigation', { name: 'Public navigation' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'How it works' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try the demo' })).toBeTruthy();
  });

  it('renders owner navigation without fictional product areas', () => {
    renderRoute(<OwnerLayout />, '/app');
    const navigation = screen.getByRole('navigation', { name: 'Navegación de operador' });
    expect(navigation.textContent).toContain('Inicio');
    expect(navigation.textContent).toContain('Cocheras');
    expect(navigation.textContent).not.toContain('Payments');
    expect(screen.getByRole('complementary').className).toContain('xl:flex');
    expect(screen.getByRole('banner').className).toContain('xl:hidden');
    expect(screen.getByRole('navigation', { name: 'Navegación de operador, móvil' })).toBeTruthy();
    expect(screen.getAllByRole('combobox', { name: 'Apariencia' })).toHaveLength(2);
    expect(document.title).toBe('ParkCore | Operaciones');
  });
});
