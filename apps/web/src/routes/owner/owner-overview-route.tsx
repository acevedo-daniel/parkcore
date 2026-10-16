import { useQuery } from '@tanstack/react-query';
import { Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { PageHeader } from '../../components/domain/page-header.js';
import { EmptyState, ErrorState } from '../../components/domain/feedback.js';
import { Button } from '../../components/ui/button.js';
import {
  useAnalyticsRevenue,
  useAnalyticsSummary,
  useAnalyticsVolume,
} from '../../features/analytics/use-analytics.js';
import { ActivitySection } from '../../features/owner-overview/activity-section.js';
import { AnalyticsNotice } from '../../features/owner-overview/analytics-notice.js';
import { AttentionSection } from '../../features/owner-overview/attention-section.js';
import { FacilityOverviewSection } from '../../features/owner-overview/facility-overview-section.js';
import { NetworkSummarySection } from '../../features/owner-overview/network-summary-section.js';
import { OwnerOverviewSkeleton } from '../../features/owner-overview/owner-overview-skeleton.js';
import { useOwnedParkingOperations } from '../../features/parking/use-owned-parking-operations.js';
import { getActiveSessionsForOwner } from '../../lib/api/owner-api.js';
import { cn } from '../../lib/cn.js';

export function OwnerOverviewRoute() {
  const { t } = useAppearance();
  const [days, setDays] = useState<7 | 30>(7);
  const { parkings, parkingsQuery } = useOwnedParkingOperations();
  const summaryQuery = useAnalyticsSummary();
  const revenueQuery = useAnalyticsRevenue(days);
  const volumeQuery = useAnalyticsVolume(days);
  const activeSessionsQuery = useQuery({
    enabled: parkings.length > 0,
    queryFn: getActiveSessionsForOwner,
    queryKey: ['active-sessions', 'owner'],
    staleTime: 30_000,
  });

  const isRefreshing =
    parkingsQuery.isFetching ||
    summaryQuery.isFetching ||
    revenueQuery.isFetching ||
    volumeQuery.isFetching ||
    activeSessionsQuery.isFetching;
  const facilitiesSnapshotIsStale = parkingsQuery.isError && Boolean(parkingsQuery.data);
  const refresh = () => {
    void parkingsQuery.refetch();
    void summaryQuery.refetch();
    void revenueQuery.refetch();
    void volumeQuery.refetch();
    void activeSessionsQuery.refetch();
  };
  const retrySummary = () => {
    void summaryQuery.refetch();
  };

  if (parkingsQuery.isLoading) return <OwnerOverviewSkeleton />;
  if (parkingsQuery.isError && !parkingsQuery.data) {
    return (
      <section className="owner-page" aria-labelledby="overview-error-title">
        <h1 className="sr-only" id="overview-error-title">
          {t('overview.title')}
        </h1>
        <ErrorState onRetry={() => void parkingsQuery.refetch()}>
          {t('api.loadParkings')}
        </ErrorState>
      </section>
    );
  }
  if (parkings.length === 0) {
    return (
      <section className="owner-page" aria-labelledby="overview-empty-title">
        <h1 className="sr-only" id="overview-empty-title">
          {t('overview.title')}
        </h1>
        <EmptyState
          action={
            <Button asChild variant="default">
              <Link to="/app/parkings/new">
                <Plus aria-hidden="true" className="size-4" />
                {t('overview.newFacility')}
              </Link>
            </Button>
          }
          title={t('overview.emptyTitle')}
        >
          {t('overview.emptyDescription')}
        </EmptyState>
      </section>
    );
  }

  return (
    <section className="owner-page space-y-10" aria-labelledby="overview-title">
      <PageHeader
        actions={
          <>
            <Button
              aria-label={t('overview.refresh')}
              disabled={isRefreshing}
              onClick={refresh}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn('size-3.5', isRefreshing && 'animate-spin')}
              />
              {t('overview.refresh')}
            </Button>
            <Button asChild size="sm">
              <Link to="/app/parkings/new">
                <Plus aria-hidden="true" className="size-4" />
                {t('overview.newFacility')}
              </Link>
            </Button>
          </>
        }
        description={t('overview.description')}
        eyebrow={t('overview.eyebrow')}
        id="overview-title"
        title={t('overview.title')}
      />

      {facilitiesSnapshotIsStale ? (
        <div
          className="flex flex-col gap-3 rounded-lg border border-warning-soft-foreground bg-warning-soft p-4 text-warning-soft-foreground sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="break-words text-sm font-semibold">{t('overview.facilitiesStale')}</p>
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
            {t('overview.retryFacilities')}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 wide:grid-cols-owner-overview">
        <NetworkSummarySection parkings={parkings} summaryQuery={summaryQuery} />
        <AttentionSection activeSessionsQuery={activeSessionsQuery} parkings={parkings} />
      </div>

      <FacilityOverviewSection parkings={parkings} />

      {summaryQuery.isError ? <AnalyticsNotice onRetry={retrySummary} /> : null}

      <ActivitySection
        days={days}
        onDaysChange={setDays}
        revenueQuery={revenueQuery}
        volumeQuery={volumeQuery}
      />
    </section>
  );
}
