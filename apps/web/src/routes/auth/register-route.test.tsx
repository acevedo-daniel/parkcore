import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import type { AuthContextValue } from '../../features/auth/auth-context.js';
import { AuthContext } from '../../features/auth/auth-context.js';
import { RegisterRoute } from './register-route.js';

function renderRegister(initialEntry: string, overrides: Partial<AuthContextValue> = {}) {
  window.localStorage.setItem('parkcore-lang', 'en-US');
  const router = createMemoryRouter(
    [
      { path: '/register', element: <RegisterRoute /> },
      { path: '/app', element: <p>Workspace root</p> },
      { path: '/app/parkings', element: <p>Target workspace</p> },
      { path: '/login', element: <p>Login view</p> },
    ],
    { initialEntries: [initialEntry] },
  );
  const value: AuthContextValue = {
    login: vi.fn().mockResolvedValue(undefined),
    loginDemo: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    register: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    status: 'unauthenticated',
    updateUser: vi.fn(),
    ...overrides,
  };

  render(
    <AppearanceProvider>
      <AuthContext.Provider value={value}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </AppearanceProvider>,
  );

  return { router, value };
}

async function completeRegistration() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('First name'), 'Park');
  await user.type(screen.getByLabelText('Last name'), 'Core');
  await user.type(screen.getByLabelText('Email'), 'owner@example.com');
  await user.type(screen.getByLabelText('Password'), 'password123');
  await user.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterRoute', () => {
  it('renders the real registration form and preserves the safe return target', async () => {
    const { value } = renderRegister('/register?returnTo=%2Fapp%2Fparkings');

    expect(await screen.findByRole('heading', { name: 'Create your account.' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toBe(
      '/login?returnTo=%2Fapp%2Fparkings',
    );

    await completeRegistration();

    await waitFor(() => {
      expect(value.register).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'owner@example.com',
          lastName: 'Core',
          name: 'Park',
          password: 'password123',
        }),
      );
    });
  });

  it('redirects an authenticated registration visit to the safe target', async () => {
    renderRegister('/register?returnTo=%2Fapp%2Fparkings', { status: 'authenticated' });

    expect(await screen.findByText('Target workspace')).toBeTruthy();
  });

  it('rejects an external return target after successful registration', async () => {
    const { router } = renderRegister('/register?returnTo=https%3A%2F%2Fevil.example');

    await completeRegistration();

    expect(await screen.findByText('Workspace root')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/app');
  });
});
