import createClient from 'openapi-fetch';

import type { paths } from './generated/schema.js';

export type { components, operations, paths } from './generated/schema.js';

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
}

/**
 * Creates a typed client for the published ParkCore OpenAPI contract.
 * Authentication is injected by the caller; this package never stores tokens.
 */
export function createApiClient({ baseUrl, getAccessToken }: ApiClientOptions) {
  const client = createClient<paths>({ baseUrl });

  if (getAccessToken) {
    client.use({
      async onRequest({ request }) {
        const accessToken = await getAccessToken();
        if (accessToken) request.headers.set('Authorization', `Bearer ${accessToken}`);
        return request;
      },
    });
  }

  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
