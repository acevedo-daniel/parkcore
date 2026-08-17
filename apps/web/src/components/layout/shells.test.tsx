import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { OwnerLayout } from './owner-layout.js';
import { PublicLayout } from './public-layout.js';
import { AuthProvider } from '../../features/auth/auth-provider.js';

function renderRoute(element: ReactNode, path: string) {
  const router = createMemoryRouter(
    [{ path, element, children: [{ index: true, element: <p>Route content</p> }] }],
    { initialEntries: [path] },
  );
  return render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
}

describe('application shells', () => {
  it('renders restrained public navigation in a semantic header', () => {
    renderRoute(<PublicLayout />, '/');
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Public navigation' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Get started' }).getAttribute('href')).toBe(
      '/register',
    );
  });

  it('renders owner navigation without fictional product areas', () => {
    renderRoute(<OwnerLayout />, '/app');
    const navigation = screen.getByRole('navigation', { name: 'Owner navigation' });
    expect(navigation.textContent).toContain('Overview');
    expect(navigation.textContent).toContain('Parkings');
    expect(navigation.textContent).not.toContain('Payments');
  });
});
