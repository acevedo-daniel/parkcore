import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppearanceProvider, useAppearance } from '../../app/appearance-provider.js';
import type { AuthContextValue } from './auth-context.js';
import { AuthContext } from './auth-context.js';
import { LoginForm, RegisterForm } from './auth-forms.js';
import { ApiError } from '../../lib/api/api-error.js';

afterEach(cleanup);

function LanguageSwitch() {
  const { setLanguage } = useAppearance();
  return (
    <button
      type="button"
      onClick={() => {
        setLanguage('es-AR');
      }}
    >
      Español
    </button>
  );
}

function renderWithAuth(
  children: React.ReactNode,
  overrides: Partial<AuthContextValue> = {},
  locale: 'en-US' | 'es-AR' = 'en-US',
) {
  const { loginDemo, ...otherOverrides } = overrides;
  window.localStorage.setItem('parkcore-lang', locale);
  const value: AuthContextValue = {
    login: vi.fn().mockResolvedValue(undefined),
    loginDemo: loginDemo ?? vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    register: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    status: 'unauthenticated',
    updateUser: vi.fn(),
    ...otherOverrides,
  };
  return {
    ...render(
      <AppearanceProvider>
        <MemoryRouter>
          <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
        </MemoryRouter>
      </AppearanceProvider>,
    ),
    value,
  };
}

describe('authentication forms', () => {
  it('keeps login validation inline before calling the backend', async () => {
    const user = userEvent.setup();
    const { value } = renderWithAuth(<LoginForm onSuccess={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect((await screen.findByText('Enter a valid email address.')).textContent).toContain(
      'Enter a valid email address.',
    );
    expect(value.login).not.toHaveBeenCalled();
  });

  it('submits validated credentials and redirects only after authentication succeeds', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const login = vi.fn().mockResolvedValue(undefined);
    renderWithAuth(<LoginForm onSuccess={onSuccess} />, { login });

    await user.type(screen.getByLabelText('Email'), ' owner@example.com ');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: 'owner@example.com', password: 'password123' });
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it('shows an explicit duplicate-email message during registration', async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockRejectedValue(new ApiError('Email taken', 409));
    renderWithAuth(<RegisterForm onSuccess={vi.fn()} />, { register });

    await user.type(screen.getByLabelText('First name'), 'Park');
    await user.type(screen.getByLabelText('Last name'), 'Core');
    await user.type(screen.getByLabelText('Email'), 'owner@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      (await screen.findByText('An account with this email already exists.')).textContent,
    ).toContain('An account with this email already exists.');
    expect(screen.getByLabelText('First name')).toHaveProperty('value', 'Park');
    expect(screen.getByLabelText('Last name')).toHaveProperty('value', 'Core');
    expect(screen.getByLabelText('Email')).toHaveProperty('value', 'owner@example.com');
  });

  it('reveals and hides passwords without changing the entered value', async () => {
    const user = userEvent.setup();
    renderWithAuth(<LoginForm onSuccess={vi.fn()} />);

    const password = screen.getByLabelText('Password');
    await user.type(password, 'password123');
    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(password).toHaveProperty('type', 'text');
    expect(password).toHaveProperty('value', 'password123');
    expect(screen.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed')).toBe(
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveProperty('type', 'password');
  });

  it('omits an unavailable browser timezone and keeps registration values after failure', async () => {
    const user = userEvent.setup();
    const register = vi.fn().mockRejectedValue(new ApiError('Too many attempts', 429));
    const browserFormatter = new Intl.DateTimeFormat();
    const browserOptions = browserFormatter.resolvedOptions();
    vi.spyOn(browserFormatter, 'resolvedOptions').mockReturnValue({
      ...browserOptions,
      timeZone: undefined as unknown as string,
    });
    const dateTimeFormat = vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue(browserFormatter);

    try {
      const { value } = renderWithAuth(<RegisterForm onSuccess={vi.fn()} />, { register });
      await user.type(screen.getByLabelText('First name'), 'Park');
      await user.type(screen.getByLabelText('Last name'), 'Core');
      await user.type(screen.getByLabelText('Email'), 'owner@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Create account' }));

      expect(await screen.findByText(/too many attempts/i)).toBeTruthy();
      expect(value.register).toHaveBeenCalledWith({
        email: 'owner@example.com',
        lastName: 'Core',
        name: 'Park',
        password: 'password123',
      });
      expect(screen.getByLabelText('First name')).toHaveProperty('value', 'Park');
      expect(screen.getByLabelText('Email')).toHaveProperty('value', 'owner@example.com');
    } finally {
      dateTimeFormat.mockRestore();
    }
  });

  it('prevents duplicate registration submissions while pending', async () => {
    const user = userEvent.setup();
    let resolveRegistration: () => void = () => undefined;
    const register = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRegistration = resolve;
        }),
    );
    const onSuccess = vi.fn();
    renderWithAuth(<RegisterForm onSuccess={onSuccess} />, { register });

    await user.type(screen.getByLabelText('First name'), 'Park');
    await user.type(screen.getByLabelText('Last name'), 'Core');
    await user.type(screen.getByLabelText('Email'), 'owner@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    const submit = screen.getByRole('button', { name: /Creating account/ });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(register).toHaveBeenCalledOnce();

    resolveRegistration();
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it('shows an explicit invalid-credentials message during login', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new ApiError('Invalid credentials', 401));
    renderWithAuth(<LoginForm onSuccess={vi.fn()} />, { login });

    await user.type(screen.getByLabelText('Email'), 'owner@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect((await screen.findByText('The email or password is incorrect.')).textContent).toContain(
      'The email or password is incorrect.',
    );
  });

  it('localizes validation, labels, and server feedback in Spanish', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new ApiError('Invalid credentials', 401));
    renderWithAuth(<LoginForm onSuccess={vi.fn()} />, { login }, 'es-AR');

    expect(screen.getByLabelText('Contraseña')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Ingresá un email válido.')).toBeTruthy();

    await user.type(screen.getByLabelText('Email'), 'owner@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('El email o la contraseña no son correctos.')).toBeTruthy();
  });

  it('changes shared copy without losing entered form state', async () => {
    const user = userEvent.setup();
    renderWithAuth(
      <>
        <LanguageSwitch />
        <LoginForm onSuccess={vi.fn()} />
      </>,
    );

    await user.type(screen.getByLabelText('Email'), 'owner@example.com');
    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getByLabelText('Email')).toHaveProperty('value', 'owner@example.com');
    expect(screen.getByLabelText('Contraseña')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeTruthy();
  });
});
