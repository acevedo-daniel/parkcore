import type { components, paths } from '@parkcore/api-client';

import { ApiError, getApiErrorMessage } from './api-error.js';
import { publicApi } from './api-client.js';

export type PublicParkingQuery = NonNullable<paths['/parkings']['get']['parameters']['query']>;
export type PublicParking = components['schemas']['PublicParkingResponse'];
export type ParkingList = components['schemas']['PublicParkingListResponse'];

export { ApiError as PublicApiError };

export async function getPublicParkings(query: PublicParkingQuery): Promise<ParkingList> {
  const { data, error, response } = await publicApi.GET('/parkings', { params: { query } });
  if (data) return data;
  throw new ApiError(getApiErrorMessage(error, 'Unable to reach ParkCore.'), response.status);
}

export async function getPublicParking(parkingId: string): Promise<PublicParking> {
  const { data, error, response } = await publicApi.GET('/parkings/{id}', {
    params: { path: { id: parkingId } },
  });
  if (data) return data;
  throw new ApiError(getApiErrorMessage(error, 'Unable to reach ParkCore.'), response.status);
}
