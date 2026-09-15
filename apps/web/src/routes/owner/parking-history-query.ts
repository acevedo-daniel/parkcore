import { normalizePlate } from '../../lib/plate.js';

export const PARKING_HISTORY_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export const PARKING_HISTORY_PERIODS = ['today', '7d', '30d'] as const;

export type ParkingHistoryStatus = (typeof PARKING_HISTORY_STATUSES)[number];
export type ParkingHistoryPeriod = (typeof PARKING_HISTORY_PERIODS)[number];

export interface ParkingHistoryUrlState {
  page: number;
  period: ParkingHistoryPeriod;
  plate?: string;
  status?: ParkingHistoryStatus;
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function parseStatus(value: string | null): ParkingHistoryStatus | undefined {
  return PARKING_HISTORY_STATUSES.includes(value as ParkingHistoryStatus)
    ? (value as ParkingHistoryStatus)
    : undefined;
}

function parsePeriod(value: string | null): ParkingHistoryPeriod {
  return PARKING_HISTORY_PERIODS.includes(value as ParkingHistoryPeriod)
    ? (value as ParkingHistoryPeriod)
    : '30d';
}

export function parseParkingHistoryUrlState(searchParams: URLSearchParams): ParkingHistoryUrlState {
  const normalizedPlate = normalizePlate(searchParams.get('plate') ?? '');
  const status = parseStatus(searchParams.get('status'));
  return {
    page: parsePage(searchParams.get('page')),
    period: parsePeriod(searchParams.get('period')),
    ...(normalizedPlate ? { plate: normalizedPlate } : {}),
    ...(status ? { status } : {}),
  };
}

export function parkingHistorySearchParamsFromState(
  state: ParkingHistoryUrlState,
): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (state.plate) searchParams.set('plate', normalizePlate(state.plate));
  if (state.status) searchParams.set('status', state.status);
  if (state.period !== '30d') searchParams.set('period', state.period);
  if (state.page > 1) searchParams.set('page', String(state.page));
  return searchParams;
}
