import { createApiClient } from '@parkcore/api-client';

import { getAccessToken } from '../auth/auth-storage.js';

export const authExpiredEvent = 'parkcore:auth-expired';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

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
