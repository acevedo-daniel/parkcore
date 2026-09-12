export const PARKING_CATALOG_PAGE_SIZE = 30;

export type CatalogCurrency = 'ARS' | 'USD';

export interface ParkingCatalogUrlState {
  availableNow: boolean;
  currency?: CatalogCurrency;
  maxRate?: CatalogRate;
  minRate?: CatalogRate;
  page: number;
  search?: string;
}

export interface CatalogRate {
  cents: number;
  text: string;
}

const ratePattern = /^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/;

export function parseCatalogRate(value: string | null | undefined): CatalogRate | undefined {
  const normalized = value?.trim() ?? '';
  if (!normalized || !ratePattern.test(normalized)) return undefined;

  const parsed = Number(normalized);
  const cents = Math.round(parsed * 100);
  if (!Number.isFinite(parsed) || !Number.isSafeInteger(cents) || cents <= 0) return undefined;

  return { cents, text: (cents / 100).toFixed(2) };
}

function parseCatalogPage(value: string | null) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function parseCatalogCurrency(value: string | null): CatalogCurrency | undefined {
  return value === 'ARS' || value === 'USD' ? value : undefined;
}

export function parseParkingCatalogUrlState(searchParams: URLSearchParams): ParkingCatalogUrlState {
  const currency = parseCatalogCurrency(searchParams.get('currency'));
  let minRate = parseCatalogRate(searchParams.get('minRate'));
  let maxRate = parseCatalogRate(searchParams.get('maxRate'));

  if (minRate && maxRate && minRate.cents > maxRate.cents) {
    minRate = undefined;
    maxRate = undefined;
  }

  if (!currency) {
    minRate = undefined;
    maxRate = undefined;
  }

  const normalizedSearch = searchParams.get('search')?.trim();
  const search = normalizedSearch === '' ? undefined : normalizedSearch;

  return {
    availableNow: searchParams.get('availableNow') === 'true',
    currency,
    maxRate,
    minRate,
    page: parseCatalogPage(searchParams.get('page')),
    search,
  };
}

export function parkingCatalogSearchParamsFromState(
  state: ParkingCatalogUrlState,
): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (state.search) searchParams.set('search', state.search);
  if (state.currency) searchParams.set('currency', state.currency);
  if (state.minRate) searchParams.set('minRate', state.minRate.text);
  if (state.maxRate) searchParams.set('maxRate', state.maxRate.text);
  if (state.availableNow) searchParams.set('availableNow', 'true');
  if (state.page > 1) searchParams.set('page', String(state.page));
  return searchParams;
}
