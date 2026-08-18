import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { useSearchParams } from 'react-router';

import { ParkingListItem } from '../../components/domain/parking.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { Field, Input } from '../../components/ui/field.js';
import { publicUrl, useDocumentMeta } from '../../lib/document-meta.js';
import { getPublicParkings, type PublicParkingQuery } from '../../lib/api/public-api.js';

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

export function ParkingCatalogRoute() {
  useDocumentMeta({
    description: 'Browse active ParkCore parking facilities by address and hourly rate.',
    publicUrl: publicUrl('/parkings'),
    title: 'Parkings | ParkCore',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterError, setFilterError] = useState<string>();
  const page = pageFromSearchParams(searchParams);
  const query: PublicParkingQuery = {
    limit: 30,
    page,
    maxHourlyRateCents: rateToCents(searchParams.get('maxRate') ?? ''),
    minHourlyRateCents: rateToCents(searchParams.get('minRate') ?? ''),
    search: searchParams.get('search') ?? undefined,
  };
  const parkingQuery = useQuery({
    queryKey: ['public-parkings', query],
    queryFn: () => getPublicParkings(query),
    placeholderData: (previousData) => previousData,
  });

  const applyFilters = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = getFormText(formData, 'search').trim();
    const minRateText = getFormText(formData, 'minRate');
    const maxRateText = getFormText(formData, 'maxRate');
    const minRate = rateToCents(minRateText);
    const maxRate = rateToCents(maxRateText);
    if (
      (minRateText.trim() && minRate === undefined) ||
      (maxRateText.trim() && maxRate === undefined)
    ) {
      setFilterError('Rates must be greater than 0.');
      return;
    }
    if (minRate !== undefined && maxRate !== undefined && minRate > maxRate) {
      setFilterError('Minimum rate cannot exceed maximum rate.');
      return;
    }
    setFilterError(undefined);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (minRate !== undefined) params.set('minRate', minRateText);
    if (maxRate !== undefined) params.set('maxRate', maxRateText);
    setSearchParams(params);
  };

  const changePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));
    setSearchParams(params);
  };

  return (
    <section className="public-catalog stack-landing" aria-labelledby="catalog-title">
      <header className="catalog-header">
        <p className="type-label">Public catalog</p>
        <h1 className="type-page-title" id="catalog-title">
          Parkings
        </h1>
        <p className="landing-intro">Find an active facility by address or rate.</p>
      </header>
      <form className="catalog-filters" key={searchParams.toString()} onSubmit={applyFilters}>
        <Field htmlFor="parking-search" label="Search">
          <div className="search-control">
            <Search aria-hidden="true" size={17} />
            <Input
              id="parking-search"
              defaultValue={searchParams.get('search') ?? ''}
              name="search"
              placeholder="Name or address"
            />
          </div>
        </Field>
        <Field htmlFor="min-rate" label="Min. rate (USD)">
          <Input
            id="min-rate"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            type="number"
            defaultValue={searchParams.get('minRate') ?? ''}
            name="minRate"
          />
        </Field>
        <Field htmlFor="max-rate" label="Max. rate (USD)">
          <Input
            id="max-rate"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            type="number"
            defaultValue={searchParams.get('maxRate') ?? ''}
            name="maxRate"
          />
        </Field>
        <Button type="submit">Apply filters</Button>
      </form>
      {filterError ? (
        <p className="field-error" role="alert">
          {filterError}
        </p>
      ) : null}
      {parkingQuery.isLoading ? <CatalogSkeleton /> : null}
      {parkingQuery.isFetching && !parkingQuery.isLoading ? (
        <p className="query-status" role="status">
          Refreshing parkings…
        </p>
      ) : null}
      {parkingQuery.isError ? (
        <ErrorState
          onRetry={() => {
            void parkingQuery.refetch();
          }}
        >
          We could not load active parkings.
        </ErrorState>
      ) : null}
      {parkingQuery.data?.data.length === 0 ? (
        <EmptyState title="No active parkings">Try a different address or rate range.</EmptyState>
      ) : null}
      {parkingQuery.data?.data.map((parking, index) => (
        <ParkingListItem
          key={parking.id}
          identifier={index + 1}
          parking={parking}
          to={`/parkings/${parking.id}`}
        />
      ))}
      {parkingQuery.data ? (
        <nav aria-label="Parking catalog pagination" className="pagination-controls">
          <Button
            disabled={!parkingQuery.data.meta.hasPreviousPage}
            type="button"
            variant="secondary"
            onClick={() => {
              changePage(parkingQuery.data.meta.page - 1);
            }}
          >
            Previous
          </Button>
          <span className="type-operational" aria-live="polite">
            Page {parkingQuery.data.meta.page} of {parkingQuery.data.meta.totalPages}
          </span>
          <Button
            disabled={!parkingQuery.data.meta.hasNextPage}
            type="button"
            variant="secondary"
            onClick={() => {
              changePage(parkingQuery.data.meta.page + 1);
            }}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </section>
  );
}

function CatalogSkeleton() {
  return (
    <div className="catalog-skeleton" aria-label="Loading parkings">
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </div>
  );
}
