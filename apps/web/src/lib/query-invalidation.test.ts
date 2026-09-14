import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { parkingFixture } from '../test/fixtures.js';
import { invalidateOwnerMutationQueries } from './query-invalidation.js';

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe('owner mutation invalidation', () => {
  it('refreshes affected owner, session, analytics, and eligible public caches', async () => {
    const queryClient = createQueryClient();
    const keys = [
      ['owned-parkings'],
      ['active-sessions', 'parking-1', 'plate', 'AB123CD'],
      ['parking-sessions', 'parking-1', 'ALL'],
      ['parking-session', 'session-1'],
      ['analytics-summary'],
      ['analytics-revenue', 7],
      ['analytics-volume', 7],
      ['public-parking', 'parking-1'],
      ['public-parkings', { page: 1 }],
      ['public-parkings-landing'],
      ['public-parkings-widget'],
    ] as const;
    keys.forEach((key) => queryClient.setQueryData(key, {}));

    await invalidateOwnerMutationQueries(queryClient, {
      parking: parkingFixture({ isActive: true, isListed: true }),
      parkingId: 'parking-1',
      sessionId: 'session-1',
    });

    keys.forEach((key) => {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    });
    queryClient.clear();
  });

  it('does not invalidate public availability for an unlisted or paused parking', async () => {
    const queryClient = createQueryClient();
    const publicKey = ['public-parking', 'parking-1'] as const;
    const catalogKey = ['public-parkings', { page: 1 }] as const;
    queryClient.setQueryData(publicKey, {});
    queryClient.setQueryData(catalogKey, {});

    await invalidateOwnerMutationQueries(queryClient, {
      parking: parkingFixture({ isActive: false, isListed: true }),
      parkingId: 'parking-1',
      sessionId: 'session-1',
    });

    expect(queryClient.getQueryState(publicKey)?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(catalogKey)?.isInvalidated).toBe(false);
    queryClient.clear();
  });
});
