import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { OwnerLayout } from './owner-layout.js';
import { PublicLayout } from './public-layout.js';
import { AppearanceProvider } from '../../app/appearance-provider.js';

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
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </AppearanceProvider>,
  );
}

describe('application shells', () => {
  it('renders restrained public navigation in a semantic header', () => {
    renderRoute(<PublicLayout />, '/');
    const header = screen.getByRole('banner');
    expect(screen.getByRole('navigation', { name: 'Navegación pública' })).toBeTruthy();
    const howItWorks = screen.getByRole('link', { name: 'Cómo funciona' });
    expect(howItWorks.getAttribute('href')).toBe('/#como-funciona');
    expect(howItWorks.getAttribute('aria-current')).toBeNull();
    const signIn = within(header).getByRole('link', { name: 'Ingresar' });
    expect(signIn.getAttribute('href')).toBe('/login');
    expect(signIn.getAttribute('aria-current')).toBeNull();
    expect(signIn.className).toContain('hidden');
    expect(signIn.className).toContain('wide:inline-flex');
    expect(signIn.className).not.toContain('function');
    expect(signIn.className.split(/\s+/)).not.toContain('bg-muted');
    expect(signIn.className.split(/\s+/)).not.toContain('is-active');
    expect(signIn.className).toContain('min-h-11');
    expect(signIn.className).not.toContain('hover:-translate-y-px');
    for (const link of within(header).getAllByRole('link')) {
      expect(link.className).not.toContain('hover:-translate-y-px');
    }
    const demo = within(header).getByRole('button', { name: 'Probar demo' });
    expect(demo.getAttribute('data-variant')).toBe('default');
    expect(demo.className).toContain('min-h-11');
    expect(demo.className).toContain('rounded-full');
    expect(demo.parentElement?.className).toContain('hidden wide:flex');
    expect(screen.queryByRole('link', { name: 'Get started' })).toBeNull();
  });

  it('marks the active public route in both header and compact menu without marking hash links', async () => {
    const user = userEvent.setup();
    renderRoute(<PublicLayout />, '/login');
    const header = screen.getByRole('banner');
    const signIn = within(header).getByRole('link', { name: 'Ingresar' });
    expect(signIn.getAttribute('aria-current')).toBe('page');
    expect(signIn.className).toContain('bg-muted');
    expect(
      within(header).getByRole('link', { name: 'Cómo funciona' }).getAttribute('aria-current'),
    ).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Abrir navegación' }));
    const dialog = await screen.findByRole('dialog');
    const mobileSignIn = within(dialog).getByRole('link', { name: 'Ingresar' });
    expect(mobileSignIn.getAttribute('aria-current')).toBe('page');
    expect(mobileSignIn.className).toContain('aria-[current=page]:bg-muted');
    expect(
      within(dialog).getByRole('link', { name: 'Cómo funciona' }).getAttribute('aria-current'),
    ).toBeNull();
    expect(
      within(dialog).getByRole('button', { name: 'Probar demo' }).getAttribute('data-variant'),
    ).toBe('default');
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
    expect(within(dialog).getByRole('radio', { name: 'Español' })).toBeTruthy();
    expect(within(dialog).getByRole('radiogroup', { name: 'Apariencia' })).toBeTruthy();
    expect(
      dialog
        .querySelector<HTMLElement>('[data-slot="appearance-controls"]')
        ?.getAttribute('data-presentation'),
    ).toBe('compact');
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
    expect(screen.getByRole('complementary').className).toContain('wide:flex');
    const mobileHeader = screen.getByRole('banner');
    expect(mobileHeader.className).toContain('wide:hidden');
    expect(within(mobileHeader).queryByRole('radiogroup')).toBeNull();
    expect(mobileHeader.querySelector('[data-slot="appearance-controls"]')).toBeNull();
    expect(within(mobileHeader).getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Navegación de operador, móvil',
    });
    expect(mobileNavigation.className).toContain('wide:hidden');
    expect(mobileNavigation.className).toContain('owner-mobile-nav');
    for (const link of within(mobileNavigation).getAllByRole('link')) {
      expect(link.className).toContain('text-xs');
      expect(link.className).not.toContain('text-2xs');
    }
    expect(screen.getByRole('main').className).toContain('pb-safe-owner-content');
    expect(screen.getAllByRole('radiogroup', { name: 'Apariencia' })).toHaveLength(1);
    expect(
      Array.from(document.querySelectorAll<HTMLElement>('[data-slot="appearance-controls"]')).map(
        (control) => control.getAttribute('data-presentation'),
      ),
    ).toEqual(['compact']);
    expect(
      Array.from(document.querySelectorAll<HTMLElement>('[data-slot="appearance-controls"]')).map(
        (control) => control.getAttribute('data-layout'),
      ),
    ).toEqual(['stacked']);
    expect(document.title).toBe('ParkCore | Operaciones');
  });

  it('marks facilities active in both owner navs on session detail routes', () => {
    renderRoute(<OwnerLayout />, '/app/sessions/session-1');
    const sidebarNavigation = screen.getByRole('navigation', { name: 'Navegación de operador' });
    const mobileNavigation = screen.getByRole('navigation', {
      name: 'Navegación de operador, móvil',
    });

    expect(
      within(sidebarNavigation)
        .getByRole('link', { name: 'Cocheras' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(
      within(sidebarNavigation).getByRole('link', { name: 'Inicio' }).getAttribute('aria-current'),
    ).toBeNull();
    expect(
      within(mobileNavigation).getByRole('link', { name: 'Cocheras' }).getAttribute('aria-current'),
    ).toBe('page');
    expect(
      within(mobileNavigation).getByRole('link', { name: 'Inicio' }).getAttribute('aria-current'),
    ).toBeNull();
  });
});
