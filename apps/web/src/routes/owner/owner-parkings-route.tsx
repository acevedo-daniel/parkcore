import { Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { PageHeader } from '../../components/domain/page-header.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { OwnerParkingPanel } from '../../features/parking/owner-parking-panel.js';
import { useOwnedParkingOperations } from '../../features/parking/use-owned-parking-operations.js';
import { cn } from '../../lib/cn.js';

export function OwnerParkingsRoute() {
  const { t } = useAppearance();
  const { parkings, parkingsQuery } = useOwnedParkingOperations();
  const activeVehicles = parkings.reduce(
    (total, { parking }) => total + parking.activeSessionCount,
    0,
  );
  const totalCapacity = parkings.reduce((total, { parking }) => total + parking.capacity, 0);

  if (parkingsQuery.isLoading) return <OwnerParkingsSkeleton />;
  if (parkingsQuery.isError) {
    return (
      <ErrorState onRetry={() => void parkingsQuery.refetch()}>{t('api.loadParkings')}</ErrorState>
    );
  }

  return (
    <section className="owner-page space-y-8" aria-labelledby="owner-parkings-title">
      <PageHeader
        actions={
          <>
            <Button
              aria-label={t('ownerParkings.refresh')}
              disabled={parkingsQuery.isFetching}
              onClick={() => void parkingsQuery.refetch()}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn('size-3.5', parkingsQuery.isFetching && 'animate-spin')}
              />
              {t('ownerParkings.refresh')}
            </Button>
            <Button asChild size="sm">
              <Link to="/app/parkings/new">
                <Plus aria-hidden="true" className="size-4" />
                {t('ownerParkings.newFacility')}
              </Link>
            </Button>
          </>
        }
        description={t('ownerParkings.description')}
        eyebrow={t('ownerParkings.eyebrow')}
        id="owner-parkings-title"
        title={t('ownerParkings.title')}
      />

      {parkings.length === 0 ? (
        <EmptyState
          action={
            <Button asChild variant="primary">
              <Link to="/app/parkings/new">
                <Plus aria-hidden="true" className="size-4" />
                {t('ownerParkings.createFacility')}
              </Link>
            </Button>
          }
          title={t('ownerParkings.emptyTitle')}
        >
          {t('ownerParkings.emptyDescription')}
        </EmptyState>
      ) : (
        <>
          <div
            aria-label={t('ownerParkings.networkSummary')}
            className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-3"
          >
            <NetworkMetric
              label={t('ownerParkings.facilityCount')}
              value={String(parkings.length)}
            />
            <NetworkMetric label={t('ownerParkings.capacity')} value={String(totalCapacity)} />
            <NetworkMetric
              label={t('ownerParkings.activeVehicles')}
              value={String(activeVehicles)}
            />
          </div>

          {parkingsQuery.isFetching ? (
            <p className="type-label text-foreground-muted" role="status">
              {t('ownerParkings.refreshing')}
            </p>
          ) : null}

          <section aria-labelledby="owner-facility-list-title">
            <h2 className="visually-hidden" id="owner-facility-list-title">
              {t('ownerParkings.facilityList')}
            </h2>
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
              {parkings.map(({ parking }, index) => (
                <div className="border-b border-border-subtle last:border-b-0" key={parking.id}>
                  <OwnerParkingPanel identifier={index + 1} parking={parking} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function NetworkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-5 text-foreground">
      <p className="type-label text-foreground-muted">{label}</p>
      <p className="mt-3 type-metric">{value}</p>
    </div>
  );
}

function OwnerParkingsSkeleton() {
  const { t } = useAppearance();
  return (
    <div className="space-y-8" aria-label={t('ownerParkings.refreshing')}>
      <div className="space-y-4 border-b border-border-strong pb-7">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-12 w-3/4 rounded-[var(--radius-md)]" />
        <Skeleton className="h-5 w-full max-w-xl rounded-full" />
      </div>
      <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-24 rounded-none border-0" key={index} />
        ))}
      </div>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="grid gap-6 border-b border-border-subtle p-5 last:border-b-0 sm:p-6 md:grid-cols-[minmax(0,1.4fr)_minmax(12rem,1fr)] lg:grid-cols-[minmax(14rem,1.4fr)_minmax(12rem,1fr)_minmax(10rem,0.8fr)_auto]"
            key={index}
          >
            <Skeleton className="h-24 rounded-[var(--radius-md)]" />
            <Skeleton className="h-20 rounded-[var(--radius-md)]" />
            <Skeleton className="h-16 rounded-[var(--radius-md)]" />
            <Skeleton className="h-20 rounded-[var(--radius-md)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
