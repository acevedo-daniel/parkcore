import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppearanceProvider } from '../../app/appearance-provider.js';
import { ToastProvider } from '../../components/ui/feedback.js';
import { ApiError } from '../../lib/api/api-error.js';
import type { User } from '../../lib/api/auth-api.js';
import { userFixture } from '../../test/fixtures.js';
import { OwnerProfileRoute } from './owner-profile-route.js';

const auth = vi.hoisted(() => ({
  logout: vi.fn(),
  updateUser: vi.fn(),
  user: undefined as User | undefined,
}));

const api = vi.hoisted(() => ({
  updateProfile: vi.fn(),
}));

const demoApi = vi.hoisted(() => ({
  resetDemo: vi.fn(),
}));

vi.mock('../../features/auth/use-auth.js', () => ({
  useAuth: () => auth,
}));

vi.mock('../../lib/api/owner-api.js', () => api);
vi.mock('../../lib/api/auth-api.js', () => demoApi);

function renderProfile(user: User | undefined) {
  auth.user = user;
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  const view = render(
    <AppearanceProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/app/profile']}>
            <Routes>
              <Route path="/app/profile" element={<OwnerProfileRoute />} />
              <Route path="/app" element={<p>Overview</p>} />
              <Route path="/login" element={<p>Login</p>} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </AppearanceProvider>,
  );

  return { queryClient, ...view };
}

beforeEach(() => {
  window.localStorage.setItem('parkcore-lang', 'en-US');
  auth.logout.mockReset();
  auth.updateUser.mockReset();
  auth.user = undefined;
  api.updateProfile.mockReset();
  demoApi.resetDemo.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('owner profile route', () => {
  it('shows a loading skeleton while the authenticated user is unavailable', () => {
    renderProfile(undefined);

    expect(document.querySelector('[data-slot="skeleton"]')).toBeTruthy();
  });

  it('saves OWNER identity and timezone changes while keeping email read-only', async () => {
    const user = userEvent.setup();
    const owner = userFixture({
      lastName: 'Lovelace',
      name: 'Ada',
      timezone: 'America/Argentina/Buenos_Aires',
    });
    const updated = userFixture({
      ...owner,
      lastName: 'Hopper',
      name: 'Grace',
      timezone: 'Europe/Madrid',
      updatedAt: '2026-09-14T12:00:00.000Z',
    });
    api.updateProfile.mockResolvedValue(updated);
    renderProfile(owner);

    const name = screen.getByLabelText<HTMLInputElement>('Name');
    const lastName = screen.getByLabelText<HTMLInputElement>('Last name');
    const email = screen.getByLabelText<HTMLInputElement>('Email');
    await user.clear(name);
    await user.type(name, 'Grace');
    await user.clear(lastName);
    await user.type(lastName, 'Hopper');
    await user.click(screen.getByRole('combobox', { name: 'Timezone' }));
    await user.click(screen.getByRole('option', { name: 'Europe/Madrid' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(api.updateProfile.mock.calls[0]?.[0]).toEqual({
        lastName: 'Hopper',
        name: 'Grace',
        timezone: 'Europe/Madrid',
      });
    });
    expect(auth.updateUser).toHaveBeenCalledWith(updated);
    expect(email.readOnly).toBe(true);
    expect(email.getAttribute('aria-readonly')).toBe('true');
    expect((await screen.findByRole('status')).textContent).toContain('Your profile was updated.');
    expect(screen.queryByRole('button', { name: 'Restore demo data' })).toBeNull();
  });

  it('preserves dirty values while language and appearance change immediately', async () => {
    const user = userEvent.setup();
    const owner = userFixture({ lastName: 'Lovelace', name: 'Ada' });
    renderProfile(owner);

    const name = screen.getByLabelText<HTMLInputElement>('Name');
    await user.clear(name);
    await user.type(name, 'Grace');
    await user.click(screen.getByRole('button', { name: 'Spanish' }));

    expect(screen.getByLabelText<HTMLInputElement>('Nombre').value).toBe('Grace');
    expect(screen.getByRole('heading', { name: 'Perfil' })).toBeTruthy();

    const theme = screen.getByRole('combobox', { name: 'Apariencia' });
    await user.selectOptions(theme, 'dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByLabelText<HTMLInputElement>('Nombre').value).toBe('Grace');
  });

  it('shows localized save errors inline', async () => {
    const user = userEvent.setup();
    api.updateProfile.mockRejectedValue(new ApiError('invalid', 400));
    renderProfile(userFixture({ lastName: 'Owner' }));

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Grace');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'We could not update your details.',
    );
  });
});

describe('DEMO profile controls', () => {
  it('discloses the isolated session and restores only the current sandbox', async () => {
    const user = userEvent.setup();
    const demo = userFixture({
      demoExpiresAt: '2099-01-15T18:30:00.000Z',
      email: null,
      kind: 'DEMO',
      lastName: 'Visitor',
      name: 'Demo',
    });
    demoApi.resetDemo.mockResolvedValue({ restored: true });
    const { queryClient } = renderProfile(demo);
    queryClient.setQueryData(['owned-parkings'], { stale: false });

    expect(screen.getByRole('heading', { name: 'Demo session' })).toBeTruthy();
    expect(screen.getByText('Available until')).toBeTruthy();
    expect(screen.queryByLabelText('Email')).toBeNull();
    expect(screen.queryByLabelText('Name')).toBeNull();
    expect(screen.queryByLabelText('Last name')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Restore demo data' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Restore demo data' }));

    await waitFor(() => {
      expect(demoApi.resetDemo).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryState(['owned-parkings'])?.isInvalidated).toBe(true);
    });
    expect(await screen.findByText('Overview')).toBeTruthy();
  });

  it('keeps reset errors in the confirmation dialog', async () => {
    const user = userEvent.setup();
    demoApi.resetDemo.mockRejectedValue(new ApiError('reset failed', 400));
    renderProfile(userFixture({ email: null, kind: 'DEMO' }));

    await user.click(screen.getByRole('button', { name: 'Restore demo data' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Restore demo data' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'We could not restore the demo data. Please try again.',
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
