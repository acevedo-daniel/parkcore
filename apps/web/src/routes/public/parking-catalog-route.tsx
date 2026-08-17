import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import type { SyntheticEvent } from 'react';
import { useSearchParams } from 'react-router';

import { ParkingListItem } from '../../components/domain/parking.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { Field, Input } from '../../components/ui/field.js';
import { useDocumentMeta } from '../../lib/document-meta.js';
import { getPublicParkings, type PublicParkingQuery } from '../../lib/api/public-api.js';

function rateToCents(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : undefined;
}

function getFormText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

export function ParkingCatalogRoute() {
  useDocumentMeta({
    description: 'Browse active ParkCore parking facilities by address and hourly rate.',
    title: 'Parkings | ParkCore',
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const query: PublicParkingQuery = {
    limit: 30,
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
    const minRate = getFormText(formData, 'minRate');
    const maxRate = getFormText(formData, 'maxRate');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (rateToCents(minRate) !== undefined) params.set('minRate', minRate);
    if (rateToCents(maxRate) !== undefined) params.set('maxRate', maxRate);
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
            min="0"
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
            min="0"
            step="0.01"
            type="number"
            defaultValue={searchParams.get('maxRate') ?? ''}
            name="maxRate"
          />
        </Field>
        <Button type="submit">Apply filters</Button>
      </form>
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
