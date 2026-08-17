import { useQueries, useQuery } from '@tanstack/react-query';

import { getActiveSessions, getOwnedParkings } from '../../lib/api/owner-api.js';

export function useOwnedParkingOperations() {
  const parkingsQuery = useQuery({
    queryKey: ['owned-parkings'],
    queryFn: getOwnedParkings,
  });
  const activeSessionQueries = useQueries({
    queries: (parkingsQuery.data ?? []).map((parking) => ({
      queryKey: ['active-sessions', parking.id],
      queryFn: () => getActiveSessions(parking.id),
    })),
  });

  const parkings = (parkingsQuery.data ?? []).map((parking, index) => ({
    activeSessionCount: activeSessionQueries[index]?.data?.length,
    activeSessions: activeSessionQueries[index]?.data,
    occupancyError: activeSessionQueries[index]?.isError ?? false,
    occupancyLoading: activeSessionQueries[index]?.isLoading ?? true,
    parking,
  }));

  return { activeSessionQueries, parkings, parkingsQuery };
}
