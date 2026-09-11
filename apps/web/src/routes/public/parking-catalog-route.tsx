import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { useSearchParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { MonetaryFilterGroup } from '../../components/domain/monetary-filter-group.js';
import { ParkingDiscoveryCard } from '../../components/domain/parking-discovery-card.js';
import { Button } from '../../components/ui/button.js';
import { Sheet } from '../../components/ui/dialog.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { Input } from '../../components/ui/field.js';
import { getPublicParkings, type PublicParkingQuery } from '../../lib/api/public-api.js';
import { publicUrl, useDocumentMeta } from '../../lib/document-meta.js';

function rateToCents(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  const cents = Math.round(parsed * 100);
  return Number.isFinite(parsed) && cents > 0 ? cents : undefined;
}

function pageFromSearchParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getFormText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function currencyFromSearchParams(searchParams: URLSearchParams): 'ARS' | 'USD' | undefined {
  const currency = searchParams.get('currency');
  return currency === 'ARS' || currency === 'USD' ? currency : undefined;
}

export function ParkingCatalogRoute() {
  const { t } = useAppearance();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterError, setFilterError] = useState<string>();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const page = pageFromSearchParams(searchParams);
  const currency = currencyFromSearchParams(searchParams);
  const query: PublicParkingQuery = {
    availableNow: searchParams.get('availableNow') === 'true' ? 'true' : undefined,
    currency,
    limit: 30,
    page,
    maxHourlyRateCents: currency ? rateToCents(searchParams.get('maxRate') ?? '') : undefined,
    minHourlyRateCents: currency ? rateToCents(searchParams.get('minRate') ?? '') : undefined,
    search: searchParams.get('search') ?? undefined,
  };

  useDocumentMeta({
    description: t('public.catalog.metaDescription'),
    publicUrl: publicUrl('/parkings'),
    title: t('public.catalog.metaTitle'),
  });

  const parkingQuery = useQuery({
    queryKey: ['public-parkings', query],
    queryFn: () => getPublicParkings(query),
    placeholderData: (previousData) => previousData,
  });
  const hasFilters = [...searchParams.keys()].some((key) => key !== 'page');

  const applyFilters = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = getFormText(formData, 'search').trim();
    const currency = getFormText(formData, 'currency');
    const minRateText = getFormText(formData, 'minRate');
    const maxRateText = getFormText(formData, 'maxRate');
    const availableNow = formData.get('availableNow') === 'on';
    const minRate = rateToCents(minRateText);
    const maxRate = rateToCents(maxRateText);
    if (
      (minRateText.trim() && minRate === undefined) ||
      (maxRateText.trim() && maxRate === undefined)
    ) {
      setFilterError(t('public.catalog.invalidRate'));
      return;
    }
    if (minRate !== undefined && maxRate !== undefined && minRate > maxRate) {
      setFilterError(t('public.catalog.invalidRange'));
      return;
    }
    if ((minRate !== undefined || maxRate !== undefined) && !currency) {
      setFilterError(t('public.catalog.currencyRequired'));
      return;
    }
    setFilterError(undefined);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (currency === 'ARS' || currency === 'USD') params.set('currency', currency);
    if (minRate !== undefined) params.set('minRate', minRateText);
    if (maxRate !== undefined) params.set('maxRate', maxRateText);
    if (availableNow) params.set('availableNow', 'true');
    setSearchParams(params);
    setMobileFiltersOpen(false);
  };

  const changePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));
    setSearchParams(params);
  };

  const clearMonetaryFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('currency');
    params.delete('minRate');
    params.delete('maxRate');
    params.delete('page');
    setFilterError(undefined);
    setSearchParams(params);
  };

  return (
    <section className="min-h-full bg-canvas pb-20 pt-10 sm:pb-28 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="grid gap-8 border-b border-border-subtle pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="type-label text-foreground-muted">{t('public.catalog.eyebrow')}</p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {t('public.catalog.title')}
            </h1>
          </div>
          <p className="max-w-lg text-base leading-relaxed text-foreground-secondary lg:col-span-4 lg:col-start-9 sm:text-lg">
            {t('public.catalog.description')}
          </p>
        </header>

        <div className="mt-8 md:hidden">
          <Button
            className="w-full rounded-full"
            onClick={() => {
              setMobileFiltersOpen(true);
            }}
            variant="secondary"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            {t('public.catalog.filterAction')}
          </Button>
        </div>

        <div className="mt-8 hidden md:block">
          <CatalogFilters
            filterError={filterError}
            idPrefix="catalog-desktop"
            key={searchParams.toString()}
            onClear={clearMonetaryFilters}
            onSubmit={applyFilters}
            searchParams={searchParams}
            currency={currency}
          />
        </div>

        <Sheet
          description={t('public.catalog.filterDescription')}
          onOpenChange={setMobileFiltersOpen}
          open={mobileFiltersOpen}
          title={t('public.catalog.filterAction')}
        >
          <div className="mt-6">
            <CatalogFilters
              filterError={filterError}
              idPrefix="catalog-mobile"
              key={`mobile-${searchParams.toString()}`}
              onClear={clearMonetaryFilters}
              onSubmit={applyFilters}
              searchParams={searchParams}
              currency={currency}
            />
          </div>
        </Sheet>

        {parkingQuery.isFetching && !parkingQuery.isLoading ? (
          <p className="mt-5 text-sm font-medium text-foreground-secondary" role="status">
            {t('public.catalog.refreshing')}
          </p>
        ) : null}
        {parkingQuery.isLoading ? <CatalogSkeleton /> : null}
        {parkingQuery.isError ? (
          <div className="mt-10">
            <ErrorState
              onRetry={() => {
                void parkingQuery.refetch();
              }}
              title={t('public.catalog.errorTitle')}
            >
              {t('public.catalog.errorDescription')}
            </ErrorState>
          </div>
        ) : null}
        {!parkingQuery.isLoading &&
        !parkingQuery.isError &&
        parkingQuery.data?.data.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              action={
                hasFilters ? (
                  <Button
                    onClick={() => {
                      setSearchParams({});
                    }}
                    variant="secondary"
                  >
                    <X aria-hidden="true" className="size-4" />
                    {t('public.catalog.clearFilters')}
                  </Button>
                ) : undefined
              }
              title={t('public.catalog.emptyTitle')}
            >
              {t('public.catalog.emptyDescription')}
            </EmptyState>
          </div>
        ) : null}
        {!parkingQuery.isLoading && !parkingQuery.isError && parkingQuery.data?.data.length ? (
          <div
            aria-label={t('public.catalog.results')}
            className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {parkingQuery.data.data.map((parking) => (
              <ParkingDiscoveryCard
                key={parking.id}
                parking={parking}
                to={`/parkings/${parking.id}`}
              />
            ))}
          </div>
        ) : null}
        {parkingQuery.data && !parkingQuery.isError ? (
          <nav
            aria-label={t('public.catalog.pagination')}
            className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle pt-7"
          >
            <Button
              disabled={!parkingQuery.data.meta.hasPreviousPage}
              onClick={() => {
                changePage(parkingQuery.data.meta.page - 1);
              }}
              type="button"
              variant="secondary"
            >
              {t('public.catalog.previous')}
            </Button>
            <span aria-live="polite" className="text-sm font-medium text-foreground-secondary">
              {t('public.catalog.page', {
                page: parkingQuery.data.meta.page,
                totalPages: parkingQuery.data.meta.totalPages,
              })}
            </span>
            <Button
              disabled={!parkingQuery.data.meta.hasNextPage}
              onClick={() => {
                changePage(parkingQuery.data.meta.page + 1);
              }}
              type="button"
              variant="secondary"
            >
              {t('public.catalog.next')}
            </Button>
          </nav>
        ) : null}
      </div>
    </section>
  );
}

function CatalogFilters({
  currency,
  filterError,
  idPrefix,
  onClear,
  onSubmit,
  searchParams,
}: {
  currency?: 'ARS' | 'USD';
  filterError?: string;
  idPrefix: string;
  onClear: () => void;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  searchParams: URLSearchParams;
}) {
  const { t } = useAppearance();
  return (
    <form
      className="grid gap-4 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-xs lg:grid-cols-12 lg:items-end lg:p-6"
      noValidate
      onSubmit={onSubmit}
    >
      <div className="lg:col-span-6">
        <label
          className="mb-2 block text-xs font-bold text-foreground"
          htmlFor={`${idPrefix}-search`}
        >
          {t('public.catalog.searchLabel')}
        </label>
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-subtle px-3 focus-within:border-primary focus-within:bg-surface">
          <Search aria-hidden="true" className="size-4 shrink-0 text-foreground-muted" />
          <Input
            className="h-12 border-0 bg-transparent px-0 focus:bg-transparent"
            defaultValue={searchParams.get('search') ?? ''}
            id={`${idPrefix}-search`}
            name="search"
            placeholder={t('public.catalog.searchPlaceholder')}
          />
        </div>
      </div>
      <MonetaryFilterGroup
        className="lg:col-span-5"
        currency={currency}
        defaultMax={searchParams.get('maxRate') ?? ''}
        defaultMin={searchParams.get('minRate') ?? ''}
        idPrefix={idPrefix}
        onClear={onClear}
      />
      <div className="flex items-center lg:col-span-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-subtle px-3.5 py-3 text-sm font-semibold text-foreground">
          <input
            className="size-4 rounded border-border accent-primary focus-visible:ring-2 focus-visible:ring-focus-ring"
            defaultChecked={searchParams.get('availableNow') === 'true'}
            id={`${idPrefix}-available-now`}
            name="availableNow"
            type="checkbox"
          />
          <span>{t('public.catalog.availableNow')}</span>
        </label>
      </div>
      <Button className="rounded-full lg:col-span-3" type="submit">
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        {t('public.catalog.applyFilters')}
      </Button>
      {filterError ? (
        <p className="text-sm font-medium text-danger-text lg:col-span-full" role="alert">
          {filterError}
        </p>
      ) : null}
    </form>
  );
}

function CatalogSkeleton() {
  const { t } = useAppearance();
  return (
    <div
      aria-label={t('public.catalog.loading')}
      className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface"
          key={index}
        >
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-4 p-6">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
