import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  getCurrentUser,
  login,
  register,
  type LoginRequest,
  type RegisterRequest,
  type User,
} from '../../lib/api/auth-api.js';
import { ApiError } from '../../lib/api/api-error.js';
import { authExpiredEvent } from '../../lib/api/api-client.js';
import { clearAccessToken, getAccessToken, setAccessToken } from '../../lib/auth/auth-storage.js';
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context.js';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    getAccessToken() ? 'loading' : 'unauthenticated',
  );
  const [user, setUser] = useState<User>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const clearSession = useCallback(() => {
    clearAccessToken();
    setUser(undefined);
    setErrorMessage(undefined);
    setStatus('unauthenticated');
  }, []);

  const restore = useCallback(async () => {
    if (!getAccessToken()) {
      clearSession();
      return;
    }

    setStatus('loading');
    setErrorMessage(undefined);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus('authenticated');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        return;
      }
      setUser(undefined);
      setErrorMessage('Unable to restore your session. Check your connection and try again.');
      setStatus('unavailable');
    }
  }, [clearSession]);

  useEffect(() => {
    if (!getAccessToken()) return;
    const timeout = window.setTimeout(() => {
      void restore();
    }, 0);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [restore]);

  useEffect(() => {
    window.addEventListener(authExpiredEvent, clearSession);
    return () => {
      window.removeEventListener(authExpiredEvent, clearSession);
    };
  }, [clearSession]);

  const completeAuthentication = useCallback((response: { accessToken: string; user: User }) => {
    setAccessToken(response.accessToken);
    setUser(response.user);
    setErrorMessage(undefined);
    setStatus('authenticated');
  }, []);

  const loginUser = useCallback(
    async (input: LoginRequest) => {
      completeAuthentication(await login(input));
    },
    [completeAuthentication],
  );

  const registerUser = useCallback(
    async (input: RegisterRequest) => {
      completeAuthentication(await register(input));
    },
    [completeAuthentication],
  );

  const updateUser = useCallback((currentUser: User) => {
    setUser(currentUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      errorMessage,
      login: loginUser,
      logout: clearSession,
      register: registerUser,
      restore,
      status,
      updateUser,
      user,
    }),
    [clearSession, errorMessage, loginUser, registerUser, restore, status, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
