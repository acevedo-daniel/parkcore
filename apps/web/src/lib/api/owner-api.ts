import type { components, paths } from '@parkcore/api-client';

import { ApiError, getApiErrorMessage } from './api-error.js';
import { authenticatedApi } from './api-client.js';

export type Parking = components['schemas']['ParkingResponse'];
export type ParkingSession = components['schemas']['ParkingSessionResponse'];
export type CreateParkingRequest = components['schemas']['CreateParkingRequest'];
export type UpdateParkingRequest = components['schemas']['UpdateParkingRequest'];
export type UpdateProfileRequest =
  paths['/users/me']['patch']['requestBody']['content']['application/json'];
function ownerError(error: unknown, response: Response, fallback: string): never {
  throw new ApiError(getApiErrorMessage(error, fallback), response.status);
}

export async function getOwnedParkings(): Promise<Parking[]> {
  const { data, error, response } = await authenticatedApi.GET('/parkings/me');
  if (data) return data;
  return ownerError(error, response, 'Unable to load your parkings.');
}

export async function createParking(input: CreateParkingRequest): Promise<Parking> {
  const { data, error, response } = await authenticatedApi.POST('/parkings', { body: input });
  if (data) return data;
  return ownerError(error, response, 'Unable to create this parking.');
}

export async function updateParking(
  parkingId: string,
  input: UpdateParkingRequest,
): Promise<Parking> {
  const { data, error, response } = await authenticatedApi.PATCH('/parkings/{id}', {
    body: input,
    params: { path: { id: parkingId } },
  });
  if (data) return data;
  return ownerError(error, response, 'Unable to update this parking.');
}

export async function getActiveSessions(parkingId: string): Promise<ParkingSession[]> {
  const { data, error, response } = await authenticatedApi.GET(
    '/parkings/{parkingId}/sessions/active',
    { params: { path: { parkingId } } },
  );
  if (data) return data;
  return ownerError(error, response, 'Unable to load active sessions.');
}

export async function checkIn(parkingId: string, input: components['schemas']['CheckInRequest']) {
  const { data, error, response } = await authenticatedApi.POST(
    '/parkings/{parkingId}/sessions/check-in',
    { body: input, params: { path: { parkingId } } },
  );
  if (data) return data;
  return ownerError(error, response, 'Unable to start this session.');
}

export async function getParkingSessions(parkingId: string, status?: ParkingSession['status']) {
  const { data, error, response } = await authenticatedApi.GET('/parkings/{parkingId}/sessions', {
    params: { path: { parkingId }, query: { limit: 50, ...(status ? { status } : {}) } },
  });
  if (data) return data;
  return ownerError(error, response, 'Unable to load parking sessions.');
}

export async function getParkingSession(sessionId: string): Promise<ParkingSession> {
  const { data, error, response } = await authenticatedApi.GET('/sessions/{sessionId}', {
    params: { path: { sessionId } },
  });
  if (data) return data;
  return ownerError(error, response, 'Unable to load this parking session.');
}

export async function checkOut(sessionId: string): Promise<ParkingSession> {
  const { data, error, response } = await authenticatedApi.POST('/sessions/{sessionId}/check-out', {
    params: { path: { sessionId } },
  });
  if (data) return data;
  return ownerError(error, response, 'Unable to check out this session.');
}

export async function cancelParkingSession(sessionId: string): Promise<ParkingSession> {
  const { data, error, response } = await authenticatedApi.PATCH('/sessions/{sessionId}/cancel', {
    params: { path: { sessionId } },
  });
  if (data) return data;
  return ownerError(error, response, 'Unable to cancel this session.');
}

export async function updateProfile(input: UpdateProfileRequest) {
  const { data, error, response } = await authenticatedApi.PATCH('/users/me', { body: input });
  if (data) return data;
  return ownerError(error, response, 'Unable to update your profile.');
}
