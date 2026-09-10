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
      <AuthProvider>
        <ToastProvider>
          <QueryClientProvider client={new QueryClient()}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ToastProvider>
      </AuthProvider>
    </AppearanceProvider>,
  );
}

describe('application shells', () => {
  it('renders restrained public navigation in a semantic header', () => {
    renderRoute(<PublicLayout />, '/');
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Navegación pública' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ingresar' }).getAttribute('href')).toBe('/login');
    expect(screen.queryByRole('link', { name: 'Get started' })).toBeNull();
  });

  it('opens an accessible compact public navigation when requested', async () => {
    const user = userEvent.setup();
    renderRoute(<PublicLayout />, '/');

    await user.click(screen.getByRole('button', { name: 'Abrir navegación' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('navigation', { name: 'Navegación pública' })).toBeTruthy();
    expect(within(dialog).getByRole('link', { name: 'Cocheras' })).toBeTruthy();
  });

  it('renders owner navigation without fictional product areas', () => {
    renderRoute(<OwnerLayout />, '/app');
    const navigation = screen.getByRole('navigation', { name: 'Navegación de operador' });
    expect(navigation.textContent).toContain('Resumen');
    expect(navigation.textContent).toContain('Cocheras');
    expect(navigation.textContent).not.toContain('Payments');
    expect(document.title).toBe('ParkCore | Operations');
  });
});
