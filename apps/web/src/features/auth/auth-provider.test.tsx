import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { authExpiredEvent } from '../../lib/api/api-client.js';
import { setAccessToken } from '../../lib/auth/auth-storage.js';
import { AuthProvider } from './auth-provider.js';
import { useAuth } from './use-auth.js';

function StatusProbe() {
  const { status } = useAuth();
  return <span data-testid="auth-status">{status}</span>;
}

function SessionErrorProbe() {
  const { sessionErrorKey } = useAuth();
  return <span data-testid="session-error">{sessionErrorKey ?? ''}</span>;
}

function renderAuth(queryClient: QueryClient, children: ReactNode = <StatusProbe />) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AuthProvider', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('clears expired sessions and cached server state after an auth failure', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['demo', 'parking'], { stale: true });
    setAccessToken('expired-demo-token');
    renderAuth(queryClient);

    act(() => {
      window.dispatchEvent(new Event(authExpiredEvent));
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('unauthenticated');
    expect(window.localStorage.getItem('parkcore.access-token')).toBeNull();
    expect(queryClient.getQueryData(['demo', 'parking'])).toBeUndefined();
  });

  it('keeps the demo expiry reason for the localized login recovery', () => {
    const queryClient = new QueryClient();
    setAccessToken('expired-demo-token');
    renderAuth(queryClient, <SessionErrorProbe />);

    act(() => {
      window.dispatchEvent(new CustomEvent(authExpiredEvent, { detail: { code: 'DEMO_EXPIRED' } }));
    });

    expect(screen.getByTestId('session-error').textContent).toBe('api.demoExpired');
    expect(window.localStorage.getItem('parkcore.access-token')).toBeNull();
  });
});
