import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { AttentionItem } from '../../components/domain/attention-item.js';
import { PageHeader } from '../../components/domain/page-header.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState } from '../../components/domain/feedback.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group.js';
import {
  useAnalyticsRevenue,
  useAnalyticsSummary,
  useAnalyticsVolume,
} from '../../features/analytics/use-analytics.js';
import { OwnerParkingPanel } from '../../features/parking/owner-parking-panel.js';
import { useOwnedParkingOperations } from '../../features/parking/use-owned-parking-operations.js';
import { getActiveSessionsForOwner } from '../../lib/api/owner-api.js';
import { cn } from '../../lib/cn.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import type { Locale } from '../../lib/localization.js';
import { deriveOwnerAttentionItems } from './owner-overview-attention.js';

function formatBarDate(date: string, locale: Locale): string {
  const [year, month, day] = date.split('-').map(Number);
  const dateValue =
    year && month && day ? new Date(Date.UTC(year, month - 1, day, 12)) : new Date(date);

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(dateValue);
}

export function OwnerOverviewRoute() {
  const { locale, t, tPlural } = useAppearance();
  const formatCount = (value: number) => formatNumber(value, locale);
  const [days, setDays] = useState<7 | 30>(7);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'ARS' | 'USD'>('USD');
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
  const summary = summaryQuery.data;
  const revenueSeries = revenueQuery.data?.data ?? [];
  const volumeSeries = volumeQuery.data?.data ?? [];
  const revenueByDate = new Map(revenueSeries.map((point) => [point.date, point]));
  const volumeByDate = new Map(volumeSeries.map((point) => [point.date, point]));
  const chartDates = [
    ...new Set([
      ...revenueSeries.map((point) => point.date),
      ...volumeSeries.map((point) => point.date),
    ]),
  ].sort();
  const chartPoints = chartDates.map((date) => ({
    completedSessions: volumeByDate.get(date)?.completedSessions ?? 0,
    date,
    revenueByCurrency: revenueByDate.get(date)?.revenueByCurrency ?? [],
  }));
  const revenueCurrencies = [
    ...new Set(
      chartPoints.flatMap((point) => point.revenueByCurrency.map(({ currency }) => currency)),
    ),
  ];
  const displayCurrency = revenueCurrencies.includes(selectedCurrency)
    ? selectedCurrency
    : (revenueCurrencies[0] ?? selectedCurrency);
  const revenueForCurrency = (
    point: (typeof chartPoints)[number],
    currency: 'ARS' | 'USD' = displayCurrency,
  ) => point.revenueByCurrency.find((item) => item.currency === currency)?.revenueCents ?? 0;
  const revenueTotals = revenueCurrencies.map((currency) => ({
    currency,
    total: chartPoints.reduce((total, point) => total + revenueForCurrency(point, currency), 0),
  }));
  const maxRevenue = Math.max(1, ...chartPoints.map((point) => revenueForCurrency(point)));
  const totalStays = chartPoints.reduce((total, point) => total + point.completedSessions, 0);
  const activityIsLoading = revenueQuery.isPending || volumeQuery.isPending;
  const activityHasError = revenueQuery.isError || volumeQuery.isError;
  const attentionQueryHasError = activeSessionsQuery.isError;
  const facilitiesSnapshotIsStale = parkingsQuery.isError && Boolean(parkingsQuery.data);
  const activeSessionsByParking = new Map<string, NonNullable<typeof activeSessionsQuery.data>>();
  for (const session of activeSessionsQuery.data ?? []) {
    const sessions = activeSessionsByParking.get(session.parkingId) ?? [];
    sessions.push(session);
    activeSessionsByParking.set(session.parkingId, sessions);
  }

  const fallbackNetwork = parkings.reduce(
    (totals, { parking }) => ({
      activeVehicles: totals.activeVehicles + Math.max(0, parking.activeSessionCount),
      freeSpaces: totals.freeSpaces + Math.max(0, parking.availableSpaces),
      totalCapacity: totals.totalCapacity + Math.max(0, parking.capacity),
    }),
    { activeVehicles: 0, freeSpaces: 0, totalCapacity: 0 },
  );
  const activeVehicles = summary?.activeVehicles ?? fallbackNetwork.activeVehicles;
  const totalCapacity = summary?.totalCapacity ?? fallbackNetwork.totalCapacity;
  const freeSpaces = summary
    ? Math.max(0, summary.totalCapacity - summary.activeVehicles)
    : fallbackNetwork.freeSpaces;
  const totalFacilities = summary?.facilities.length ?? parkings.length;
  const activeFacilities = summary
    ? summary.facilities.filter((facility) => facility.isActive).length
    : parkings.filter(({ parking }) => parking.isActive).length;
  const receivingFacilities = summary
    ? summary.facilities.filter((facility) => facility.activeVehicles > 0).length
    : parkings.filter(({ parking }) => parking.activeSessionCount > 0).length;
  const pausedFacilities = totalFacilities - activeFacilities;
  const completedToday = summaryQuery.isPending
    ? t('overview.loadingValue')
    : summary
      ? formatCount(summary.completedToday)
      : t('common.notAvailable');

  const attentionItems = deriveOwnerAttentionItems(
    parkings.map(({ parking }) => ({
      activeSessions: activeSessionsByParking.get(parking.id) ?? [],
      parking,
    })),
    new Date(),
  ).map((item) => ({
    ...item,
    description:
      item.state === 'FULL'
        ? t('overview.attentionFull')
        : item.state === 'LIMITED'
          ? t('overview.attentionLimited')
          : item.state === 'LONG_RUNNING'
            ? t('overview.attentionLongRunning', {
                hours: formatCount(item.durationHours ?? 8),
              })
            : t('overview.attentionPaused'),
  }));

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
  const retryActivity = () => {
    if (revenueQuery.isError) void revenueQuery.refetch();
    if (volumeQuery.isError) void volumeQuery.refetch();
  };
  const retryAttention = () => {
    if (activeSessionsQuery.isError) void activeSessionsQuery.refetch();
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
        <section
          className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8"
          aria-labelledby="network-now-title"
        >
          <p className="type-label text-muted-foreground">{t('overview.networkNow')}</p>
          <h2
            className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight tracking-heading sm:text-4xl"
            id="network-now-title"
          >
            {tPlural(
              activeVehicles,
              {
                one: 'overview.networkStatementOne',
                other: 'overview.networkStatementOther',
              },
              { count: formatCount(activeVehicles) },
            )}
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground-secondary">
            {t('overview.networkCapacityStatement', {
              free: formatCount(freeSpaces),
              receiving: formatCount(receivingFacilities),
              total: formatCount(totalFacilities),
            })}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-border-subtle pt-5 sm:grid-cols-4">
            <SummaryMetric
              label={t('overview.networkActiveVehicles')}
              value={formatCount(activeVehicles)}
            />
            <SummaryMetric label={t('overview.freeSpaces')} value={formatCount(freeSpaces)} />
            <SummaryMetric label={t('overview.capacity')} value={formatCount(totalCapacity)} />
            <SummaryMetric label={t('overview.completedToday')} value={completedToday} />
          </dl>

          <div className="mt-6 border-t border-border-subtle pt-5">
            <p className="type-label text-muted-foreground">{t('overview.facilityState')}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-foreground-secondary">
              <span>
                {tPlural(
                  activeFacilities,
                  {
                    one: 'overview.enabledFacilitiesOne',
                    other: 'overview.enabledFacilitiesOther',
                  },
                  { count: formatCount(activeFacilities) },
                )}
              </span>
              <span>
                {tPlural(
                  pausedFacilities,
                  {
                    one: 'overview.pausedFacilitiesOne',
                    other: 'overview.pausedFacilitiesOther',
                  },
                  { count: formatCount(pausedFacilities) },
                )}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-border-subtle pt-5">
            <p className="type-label text-muted-foreground">{t('overview.revenueToday')}</p>
            {summaryQuery.isPending ? (
              <p className="mt-2 type-operational text-lg font-bold">
                {t('overview.loadingValue')}
              </p>
            ) : summaryQuery.isError ? (
              <p className="mt-2 type-operational text-lg font-bold">{t('common.notAvailable')}</p>
            ) : summary?.revenueToday.length ? (
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                {summary.revenueToday.map(({ currency, revenueCents }) => (
                  <div className="flex items-baseline gap-2" key={currency}>
                    <span className="type-label text-muted-foreground">{currency}</span>
                    <span className="type-operational text-lg font-bold">
                      {formatMoney(revenueCents, currency, locale)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-foreground-secondary">
                {t('overview.noRevenueToday')}
              </p>
            )}
          </div>
        </section>

        <section
          className="rounded-2xl border border-border bg-muted p-6 sm:p-8"
          aria-labelledby="attention-title"
        >
          <p className="type-label text-muted-foreground">{t('overview.attentionEyebrow')}</p>
          <h2
            className="mt-4 font-display text-2xl font-bold tracking-heading"
            id="attention-title"
          >
            {attentionItems.length > 0
              ? t('overview.attentionNeedsReview')
              : t('overview.attentionNormal')}
          </h2>
          {attentionItems.length > 0 ? (
            <ul className="mt-5">
              {attentionItems.map((item) => (
                <AttentionItem
                  description={item.description}
                  key={`${item.state}-${item.parkingId}-${item.sessionId ?? 'facility'}`}
                  parkingTitle={item.parkingTitle}
                  plate={item.plate}
                  state={item.state}
                  to={item.to}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
              {t('overview.attentionNone')}
            </p>
          )}
          {attentionQueryHasError ? (
            <div
              className="mt-5 flex flex-col gap-3 rounded-lg border border-warning-soft-foreground bg-warning-soft p-4 text-warning-soft-foreground"
              role="alert"
            >
              <p className="text-sm font-semibold">{t('overview.attentionDataError')}</p>
              <Button className="self-start" onClick={retryAttention} size="sm" variant="secondary">
                <RefreshCw aria-hidden="true" className="size-3.5" />
                {t('overview.retryAttention')}
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <section aria-labelledby="facilities-title">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-border-strong pb-4">
          <div>
            <p className="type-label text-muted-foreground">{t('overview.networkNow')}</p>
            <h2
              className="mt-2 font-display text-3xl font-bold leading-none tracking-display"
              id="facilities-title"
            >
              {t('overview.facilityOverview')}
            </h2>
          </div>
          <Link
            className="group flex shrink-0 items-center gap-1 text-sm font-bold underline decoration-brand decoration-4 underline-offset-4"
            to="/app/parkings"
          >
            {t('overview.viewAllFacilities')}
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 wide:grid-cols-3">
          {parkings.slice(0, 3).map(({ parking }, index) => (
            <OwnerParkingPanel
              identifier={index + 1}
              key={parking.id}
              parking={parking}
              presentation="overview"
            />
          ))}
        </div>
      </section>

      {summaryQuery.isError ? <AnalyticsNotice onRetry={retrySummary} /> : null}

      <section
        className="overflow-hidden rounded-2xl border border-border bg-accent text-foreground"
        aria-labelledby="activity-title"
      >
        <div className="flex flex-col justify-between gap-5 border-b border-border p-6 sm:p-8 lg:flex-row lg:items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <BarChart3 aria-hidden="true" className="size-4" />
              </span>
              <p className="type-label text-muted-foreground">{t('overview.activityEyebrow')}</p>
            </div>
            <h2
              className="mt-4 font-display text-3xl font-bold leading-none tracking-display"
              id="activity-title"
            >
              {t('overview.activityTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
              {t('overview.activityDescription')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              aria-label={t('overview.periodLabel')}
              className="rounded-full border border-border-strong p-1"
              onValueChange={(value) => {
                if (value) {
                  setActiveBarIndex(null);
                  setDays(Number(value) as 7 | 30);
                }
              }}
              type="single"
              value={String(days)}
              variant="brand"
            >
              {([7, 30] as const).map((period) => (
                <ToggleGroupItem
                  aria-label={t('overview.periodOption', { days: period })}
                  className="rounded-full px-3 py-2 text-xs font-bold tabular-nums"
                  key={period}
                  value={String(period)}
                >
                  {t('overview.periodDays', { days: period })}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {revenueCurrencies.length > 1 ? (
              <ToggleGroup
                aria-label={t('overview.currencyLabel')}
                className="flex-wrap gap-2"
                onValueChange={(value) => {
                  if (value) setSelectedCurrency(value as (typeof revenueCurrencies)[number]);
                }}
                type="single"
                value={displayCurrency}
                variant="brand"
              >
                {revenueCurrencies.map((currency) => (
                  <ToggleGroupItem
                    className="rounded-full border border-border-strong px-3 py-2 text-xs font-bold data-[state=on]:border-brand"
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : null}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {activityIsLoading ? (
            <div
              aria-busy="true"
              aria-label={t('overview.chartLoading')}
              className="h-56"
              role="status"
            >
              <Skeleton className="h-full w-full rounded-xl" />
            </div>
          ) : activityHasError ? (
            <div
              className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-xl border border-border-subtle bg-card px-5 text-center"
              role="alert"
            >
              <p className="text-sm font-semibold text-foreground-secondary">
                {t('overview.chartError')}
              </p>
              <Button onClick={retryActivity} size="sm" variant="outline">
                <RefreshCw aria-hidden="true" className="size-3.5" />
                {t('overview.chartRetry')}
              </Button>
            </div>
          ) : chartPoints.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-border-strong bg-card px-5 text-center text-sm text-foreground-secondary">
              {t('overview.chartEmpty')}
            </div>
          ) : (
            <>
              <div className="relative h-56">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-3 top-0 flex flex-col justify-between"
                >
                  {Array.from({ length: 4 }).map((_, index) => (
                    <span className="border-t border-border-subtle" key={index} />
                  ))}
                </div>
                <ToggleGroup
                  aria-label={t('overview.activityTitle')}
                  className="relative h-full w-full items-end gap-1.5 border-b border-muted-foreground pb-3 sm:gap-3"
                  onValueChange={(value) => {
                    setActiveBarIndex(value ? Number(value) : null);
                  }}
                  type="single"
                  value={activeBarIndex === null ? '' : String(activeBarIndex)}
                >
                  {chartPoints.map((point, index) => {
                    const isActive = activeBarIndex === index;
                    const pointRevenue = revenueForCurrency(point);
                    const height = Math.max(8, Math.round((pointRevenue / maxRevenue) * 100));
                    const dateLabel = formatBarDate(point.date, locale);
                    const revenueLabel = formatMoney(pointRevenue, displayCurrency, locale);

                    return (
                      <ToggleGroupItem
                        aria-label={t('overview.chartPoint', {
                          date: dateLabel,
                          revenue: revenueLabel,
                          sessions: formatCount(point.completedSessions),
                        })}
                        className="group relative h-full min-w-0 flex-1 items-end p-0"
                        key={point.date}
                        onBlur={() => {
                          setActiveBarIndex(null);
                        }}
                        onFocus={() => {
                          setActiveBarIndex(index);
                        }}
                        value={String(index)}
                      >
                        <span
                          className={cn(
                            'w-full rounded-t-sm transition-all duration-200',
                            isActive ? 'bg-chart-1' : 'bg-chart-3 group-hover:bg-chart-1',
                          )}
                          style={{ height: `${String(height)}%` }}
                        />
                      </ToggleGroupItem>
                    );
                  })}
                </ToggleGroup>
              </div>
              <div className="mt-2 flex gap-1.5 sm:gap-3">
                {chartPoints.map((point, index) => (
                  <span
                    className="min-w-0 flex-1 truncate text-center font-sans text-2xs tabular-nums text-muted-foreground"
                    key={point.date}
                  >
                    {days === 30 && index % 4 !== 0 && index !== chartPoints.length - 1
                      ? ''
                      : formatBarDate(point.date, locale)}
                  </span>
                ))}
              </div>
              <ol aria-label={t('overview.chartDailyData')} className="sr-only">
                {chartPoints.map((point) => (
                  <li key={point.date}>
                    {t('overview.chartPoint', {
                      date: formatBarDate(point.date, locale),
                      revenue: formatMoney(revenueForCurrency(point), displayCurrency, locale),
                      sessions: formatCount(point.completedSessions),
                    })}
                  </li>
                ))}
              </ol>
              <div className="mt-7 flex flex-col justify-between gap-5 border-t border-border pt-5 sm:flex-row sm:items-end">
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  {revenueTotals.map(({ currency, total }) => (
                    <SummaryValue
                      key={currency}
                      label={t('overview.revenueForPeriodCurrency', { currency, days })}
                      value={formatMoney(total, currency, locale)}
                    />
                  ))}
                  <SummaryValue
                    label={t('overview.completedStays')}
                    value={formatCount(totalStays)}
                  />
                </div>
                {activeBarIndex !== null && chartPoints[activeBarIndex] ? (
                  <div aria-live="polite" className="text-sm text-foreground-secondary">
                    <span className="type-label text-foreground-secondary">
                      {t('overview.selectedDay', {
                        date: formatBarDate(chartPoints[activeBarIndex].date, locale),
                      })}
                    </span>
                    <p className="mt-1 type-operational font-bold">
                      {t('overview.selectedDayValue', {
                        revenue: formatMoney(
                          revenueForCurrency(chartPoints[activeBarIndex]),
                          displayCurrency,
                          locale,
                        ),
                        sessions: formatCount(chartPoints[activeBarIndex].completedSessions),
                      })}
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>
    </section>
  );
}

function AnalyticsNotice({ onRetry }: { onRetry: () => void }) {
  const { t } = useAppearance();

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-warning-soft-foreground bg-warning-soft p-4 text-warning-soft-foreground sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <p className="text-sm font-semibold">{t('overview.analyticsDegraded')}</p>
      <Button onClick={onRetry} size="sm" variant="secondary">
        {t('overview.retryAnalytics')}
      </Button>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="type-label text-muted-foreground">{label}</dt>
      <dd className="mt-2 break-words type-metric">{value}</dd>
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="type-label text-muted-foreground">{label}</p>
      <p className="mt-1 break-words type-operational text-lg font-bold">{value}</p>
    </div>
  );
}

function OwnerOverviewSkeleton() {
  const { t } = useAppearance();

  return (
    <div aria-busy="true" aria-label={t('overview.loading')} className="space-y-10" role="status">
      <h1 className="sr-only">{t('overview.title')}</h1>
      <div className="grid gap-5 wide:grid-cols-owner-overview">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 wide:grid-cols-3">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
