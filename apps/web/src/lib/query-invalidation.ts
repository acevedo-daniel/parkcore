import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { Parking } from './api/owner-api.js';

export interface OwnerMutationInvalidationInput {
  parking?: Pick<Parking, 'id' | 'isActive' | 'isListed'>;
  parkingId: string;
  sessionId?: string;
}

export async function invalidateOwnerMutationQueries(
  queryClient: QueryClient,
  { parking, parkingId, sessionId }: OwnerMutationInvalidationInput,
) {
  const queryKeys: QueryKey[] = [
    ['owned-parkings'],
    ['active-sessions', parkingId],
    ['parking-sessions', parkingId],
    ['analytics-summary'],
    ['analytics-revenue'],
    ['analytics-volume'],
  ];

  if (sessionId) {
    queryKeys.push(['parking-session', sessionId]);
  }

  if (parking?.isListed && parking.isActive) {
    queryKeys.push(
      ['public-parking', parking.id],
      ['public-parkings'],
      ['public-parkings-landing'],
      ['public-parkings-widget'],
    );
  }

  await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
