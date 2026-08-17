import type { components } from '@parkcore/api-client';

import { ApiError, getApiErrorMessage } from './api-error.js';
import { authenticatedApi, publicApi } from './api-client.js';

export type AuthResponse = components['schemas']['AuthResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type User = components['schemas']['UserResponse'];

export async function login(input: LoginRequest): Promise<AuthResponse> {
  const { data, error, response } = await publicApi.POST('/auth/login', { body: input });
  if (data) return data;
  throw new ApiError(getApiErrorMessage(error, 'Unable to sign in.'), response.status);
}

export async function register(input: RegisterRequest): Promise<AuthResponse> {
  const { data, error, response } = await publicApi.POST('/auth/register', { body: input });
  if (data) return data;
  throw new ApiError(getApiErrorMessage(error, 'Unable to create your account.'), response.status);
}

export async function getCurrentUser(): Promise<User> {
  const { data, error, response } = await authenticatedApi.GET('/users/me');
  if (data) return data;
  throw new ApiError(getApiErrorMessage(error, 'Unable to restore your session.'), response.status);
}
