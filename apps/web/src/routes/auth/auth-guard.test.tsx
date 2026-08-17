import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { AuthContext, type AuthContextValue } from '../../features/auth/auth-context.js';
import { RequireAuthentication } from './auth-guard.js';

function renderGuard(status: AuthContextValue['status']) {
  const router = createMemoryRouter(
    [
      {
        path: '/app',
        element: <RequireAuthentication />,
        children: [{ index: true, element: <p>Owner content</p> }],
      },
      { path: '/login', element: <p>Login route</p> },
    ],
    { initialEntries: ['/app/'] },
  );
  const value: AuthContextValue = {
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    register: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    status,
    updateUser: vi.fn(),
  };
  return render(
    <AuthContext.Provider value={value}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
}

describe('RequireAuthentication', () => {
  it('does not render owner content while restoring a session', () => {
    renderGuard('loading');
    expect(screen.getByLabelText('Restoring session')).toBeTruthy();
    expect(screen.queryByText('Owner content')).toBeNull();
  });

  it('redirects unauthenticated visitors to login', async () => {
    renderGuard('unauthenticated');
    expect(await screen.findByText('Login route')).toBeTruthy();
    expect(screen.queryByText('Owner content')).toBeNull();
  });

  it('renders owner content only after authentication completes', () => {
    renderGuard('authenticated');
    expect(screen.getByText('Owner content')).toBeTruthy();
  });
});
