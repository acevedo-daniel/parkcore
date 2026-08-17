import { createApiClient } from '@parkcore/api-client';

import { getAccessToken } from '../auth/auth-storage.js';

export const authExpiredEvent = 'parkcore:auth-expired';

export const resolveApiBaseUrl = (
  configuredUrl: string | undefined,
  isProduction: boolean,
): string => {
  const baseUrl = configuredUrl?.trim();

  if (baseUrl) {
    return baseUrl;
  }

  if (isProduction) {
    throw new Error('VITE_API_URL is required in production.');
  }

  return 'http://localhost:3000';
};

const baseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.PROD);

export const publicApi = createApiClient({ baseUrl });

export const authenticatedApi = createApiClient({
  baseUrl,
  getAccessToken,
});

authenticatedApi.use({
  onResponse({ response }) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(authExpiredEvent));
    }
    return response;
  },
});
