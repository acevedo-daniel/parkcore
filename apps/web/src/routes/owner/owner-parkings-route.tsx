import { Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { PageHeader } from '../../components/domain/page-header.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { OwnerParkingPanel } from '../../features/parking/owner-parking-panel.js';
import { useOwnedParkingOperations } from '../../features/parking/use-owned-parking-operations.js';
import { cn } from '../../lib/cn.js';
import { formatNumber } from '../../lib/format.js';

export function OwnerParkingsRoute() {
  const { locale, t } = useAppearance();
  const { parkings, parkingsQuery } = useOwnedParkingOperations();
  const activeVehicles = parkings.reduce(
    (total, { parking }) => total + Math.max(0, parking.activeSessionCount),
    0,
  );
  const totalCapacity = parkings.reduce(
    (total, { parking }) => total + Math.max(0, parking.capacity),
    0,
  );

  if (parkingsQuery.isLoading) return <OwnerParkingsSkeleton />;
  if (parkingsQuery.isError && !parkingsQuery.data) {
    return (
      <section className="owner-page" aria-labelledby="owner-parkings-error-title">
        <h1 className="visually-hidden" id="owner-parkings-error-title">
          {t('ownerParkings.title')}
        </h1>
        <ErrorState onRetry={() => void parkingsQuery.refetch()}>
          {t('api.loadParkings')}
        </ErrorState>
      </section>
    );
  }
  const facilitiesSnapshotIsStale = parkingsQuery.isError && Boolean(parkingsQuery.data);

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

      {facilitiesSnapshotIsStale ? (
        <div
          className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-warning-foreground bg-warning-surface p-4 text-warning-text sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="break-words text-sm font-semibold">{t('ownerParkings.stale')}</p>
          <Button
            className="self-start sm:self-auto"
            disabled={parkingsQuery.isFetching}
            onClick={() => void parkingsQuery.refetch()}
            size="sm"
            variant="secondary"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-3.5', parkingsQuery.isFetching && 'animate-spin')}
            />
            {t('ownerParkings.refresh')}
          </Button>
        </div>
      ) : null}

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
            role="group"
          >
            <NetworkMetric
              label={t('ownerParkings.facilityCount')}
              value={formatNumber(parkings.length, locale)}
            />
            <NetworkMetric
              label={t('ownerParkings.capacity')}
              value={formatNumber(totalCapacity, locale)}
            />
            <NetworkMetric
              label={t('ownerParkings.activeVehicles')}
              value={formatNumber(activeVehicles, locale)}
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
    <div className="min-w-0 bg-surface p-5 text-foreground">
      <p className="type-label text-foreground-muted">{label}</p>
      <p className="mt-3 break-words type-metric">{value}</p>
    </div>
  );
}

function OwnerParkingsSkeleton() {
  const { t } = useAppearance();
  return (
    <div
      aria-busy="true"
      aria-label={t('ownerParkings.refreshing')}
      className="space-y-8"
      role="status"
    >
      <h1 className="visually-hidden">{t('ownerParkings.title')}</h1>
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
