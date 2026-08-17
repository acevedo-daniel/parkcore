import { createContext } from 'react';

import type { LoginRequest, RegisterRequest, User } from '../../lib/api/auth-api.js';

export type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated' | 'unavailable';

export interface AuthContextValue {
  errorMessage?: string;
  login: (input: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (input: RegisterRequest) => Promise<void>;
  restore: () => Promise<void>;
  status: AuthStatus;
  updateUser: (user: User) => void;
  user?: User;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
