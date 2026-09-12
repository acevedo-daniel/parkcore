import { useQuery } from '@tanstack/react-query';

import { getOwnedParkings } from '../../lib/api/owner-api.js';

export function useOwnedParkingOperations() {
  const parkingsQuery = useQuery({
    queryKey: ['owned-parkings'],
    queryFn: getOwnedParkings,
  });
  const parkings = (parkingsQuery.data ?? []).map((parking) => ({
    activeSessionCount: parking.activeSessionCount,
    parking,
  }));

  return { parkings, parkingsQuery };
}
