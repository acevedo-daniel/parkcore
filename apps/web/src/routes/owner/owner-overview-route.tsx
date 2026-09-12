import { useQueries } from '@tanstack/react-query';
import { ArrowUpRight, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { AttentionItem } from '../../components/domain/attention-item.js';
import { PageHeader } from '../../components/domain/page-header.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import {
  useAnalyticsRevenue,
  useAnalyticsSummary,
  useAnalyticsVolume,
} from '../../features/analytics/use-analytics.js';
import { OwnerParkingPanel } from '../../features/parking/owner-parking-panel.js';
import { useOwnedParkingOperations } from '../../features/parking/use-owned-parking-operations.js';
import { getActiveSessions } from '../../lib/api/owner-api.js';
import { cn } from '../../lib/cn.js';
import { formatMoney } from '../../lib/format.js';
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
  const [days, setDays] = useState<7 | 30>(7);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'ARS' | 'USD'>('USD');
  const { parkings, parkingsQuery } = useOwnedParkingOperations();
  const summaryQuery = useAnalyticsSummary();
  const revenueQuery = useAnalyticsRevenue(days);
  const volumeQuery = useAnalyticsVolume(days);
  const activeSessionQueries = useQueries({
    queries: parkings.map(({ parking }) => ({
      queryFn: () => getActiveSessions(parking.id),
      queryKey: ['active-sessions', parking.id],
      staleTime: 30_000,
    })),
  });

  const isRefreshing =
    parkingsQuery.isFetching ||
    summaryQuery.isFetching ||
    revenueQuery.isFetching ||
    volumeQuery.isFetching ||
    activeSessionQueries.some((query) => query.isFetching);
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
  const attentionQueryHasError = activeSessionQueries.some((query) => query.isError);

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
      ? String(summary.completedToday)
      : t('common.notAvailable');

  const attentionItems = deriveOwnerAttentionItems(
    parkings.map(({ parking }, index) => ({
      activeSessions: activeSessionQueries[index]?.data ?? [],
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
            ? t('overview.attentionLongRunning', { hours: item.durationHours ?? 8 })
            : t('overview.attentionPaused'),
  }));

  const refresh = () => {
    void parkingsQuery.refetch();
    void summaryQuery.refetch();
    void revenueQuery.refetch();
    void volumeQuery.refetch();
    activeSessionQueries.forEach((query) => {
      void query.refetch();
    });
  };
  const retrySummary = () => {
    void summaryQuery.refetch();
  };
  const retryActivity = () => {
    if (revenueQuery.isError) void revenueQuery.refetch();
    if (volumeQuery.isError) void volumeQuery.refetch();
  };
  const retryAttention = () => {
    activeSessionQueries.forEach((query) => {
      if (query.isError) void query.refetch();
    });
  };

  if (parkingsQuery.isLoading) return <OwnerOverviewSkeleton />;
  if (parkingsQuery.isError) {
    return (
      <ErrorState onRetry={() => void parkingsQuery.refetch()}>{t('api.loadParkings')}</ErrorState>
    );
  }
  if (parkings.length === 0) {
    return (
      <EmptyState
        action={
          <Button asChild variant="primary">
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <section
          className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs sm:p-8"
          aria-labelledby="network-now-title"
        >
          <p className="type-label text-foreground-muted">{t('overview.networkNow')}</p>
          <h2
            className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight tracking-[-0.045em] sm:text-4xl"
            id="network-now-title"
          >
            {tPlural(activeVehicles, {
              one: 'overview.networkStatementOne',
              other: 'overview.networkStatementOther',
            })}
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground-secondary">
            {t('overview.networkCapacityStatement', {
              free: freeSpaces,
              receiving: receivingFacilities,
              total: totalFacilities,
            })}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-border-subtle pt-5 sm:grid-cols-4">
            <SummaryMetric
              label={t('overview.networkActiveVehicles')}
              value={String(activeVehicles)}
            />
            <SummaryMetric label={t('overview.freeSpaces')} value={String(freeSpaces)} />
            <SummaryMetric label={t('overview.capacity')} value={String(totalCapacity)} />
            <SummaryMetric label={t('overview.completedToday')} value={completedToday} />
          </dl>

          <div className="mt-6 border-t border-border-subtle pt-5">
            <p className="type-label text-foreground-muted">{t('overview.facilityState')}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-foreground-secondary">
              <span>
                {tPlural(activeFacilities, {
                  one: 'overview.enabledFacilitiesOne',
                  other: 'overview.enabledFacilitiesOther',
                })}
              </span>
              <span>
                {tPlural(pausedFacilities, {
                  one: 'overview.pausedFacilitiesOne',
                  other: 'overview.pausedFacilitiesOther',
                })}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-border-subtle pt-5">
            <p className="type-label text-foreground-muted">{t('overview.revenueToday')}</p>
            {summaryQuery.isPending ? (
              <p className="mt-2 font-mono text-lg font-bold tabular-nums">
                {t('overview.loadingValue')}
              </p>
            ) : summaryQuery.isError ? (
              <p className="mt-2 font-mono text-lg font-bold tabular-nums">
                {t('common.notAvailable')}
              </p>
            ) : summary?.revenueToday.length ? (
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                {summary.revenueToday.map(({ currency, revenueCents }) => (
                  <div className="flex items-baseline gap-2" key={currency}>
                    <span className="type-label text-foreground-muted">{currency}</span>
                    <span className="font-mono text-lg font-bold tabular-nums">
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
          className="rounded-[var(--radius-xl)] border border-border bg-surface-subtle p-6 sm:p-8"
          aria-labelledby="attention-title"
        >
          <p className="type-label text-foreground-muted">{t('overview.attentionEyebrow')}</p>
          <h2
            className="mt-4 font-display text-2xl font-bold tracking-[-0.04em]"
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
              className="mt-5 flex flex-col gap-3 rounded-[var(--radius-md)] border border-warning-foreground bg-warning-surface p-4 text-warning-text"
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
            <p className="type-label text-foreground-muted">{t('overview.networkNow')}</p>
            <h2
              className="mt-2 font-display text-3xl font-bold leading-none tracking-[-0.055em]"
              id="facilities-title"
            >
              {t('overview.facilityOverview')}
            </h2>
          </div>
          <Link
            className="group flex shrink-0 items-center gap-1 text-sm font-bold underline decoration-accent decoration-4 underline-offset-4"
            to="/app/parkings"
          >
            {t('overview.viewAllFacilities')}
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {parkings.slice(0, 3).map(({ parking }, index) => (
            <OwnerParkingPanel identifier={index + 1} key={parking.id} parking={parking} />
          ))}
        </div>
      </section>

      {summaryQuery.isError ? <AnalyticsNotice onRetry={retrySummary} /> : null}

      <section
        className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface-emphasis text-foreground"
        aria-labelledby="activity-title"
      >
        <div className="flex flex-col justify-between gap-5 border-b border-border p-6 sm:p-8 lg:flex-row lg:items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <BarChart3 aria-hidden="true" className="size-4" />
              </span>
              <p className="type-label text-foreground-muted">{t('overview.activityEyebrow')}</p>
            </div>
            <h2
              className="mt-4 font-display text-3xl font-bold leading-none tracking-[-0.055em]"
              id="activity-title"
            >
              {t('overview.activityTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
              {t('overview.activityDescription')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              aria-label={t('overview.periodLabel')}
              className="flex rounded-full border border-border-strong p-1"
              role="group"
            >
              {([7, 30] as const).map((period) => (
                <button
                  aria-label={t('overview.periodOption', { days: period })}
                  aria-pressed={days === period}
                  className={cn(
                    'rounded-full px-3 py-2 font-mono text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset',
                    days === period
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground-secondary hover:bg-surface-hover hover:text-foreground',
                  )}
                  key={period}
                  onClick={() => {
                    setActiveBarIndex(null);
                    setDays(period);
                  }}
                  type="button"
                >
                  {t('overview.periodDays', { days: period })}
                </button>
              ))}
            </div>
            {revenueCurrencies.length > 1 ? (
              <div
                aria-label={t('overview.currencyLabel')}
                className="flex flex-wrap gap-2"
                role="group"
              >
                {revenueCurrencies.map((currency) => (
                  <button
                    aria-pressed={displayCurrency === currency}
                    className={cn(
                      'rounded-full border px-3 py-2 font-mono text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset',
                      displayCurrency === currency
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-border-strong text-foreground-secondary hover:bg-surface-hover hover:text-foreground',
                    )}
                    key={currency}
                    onClick={() => {
                      setSelectedCurrency(currency);
                    }}
                    type="button"
                  >
                    {currency}
                  </button>
                ))}
              </div>
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
              <Skeleton className="h-full w-full rounded-[var(--radius-lg)]" />
            </div>
          ) : activityHasError ? (
            <div
              className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-surface px-5 text-center"
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
            <div className="flex min-h-56 items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface px-5 text-center text-sm text-foreground-secondary">
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
                    <span className="border-t border-chart-grid" key={index} />
                  ))}
                </div>
                <div className="relative flex h-full items-end gap-1.5 border-b border-chart-axis pb-3 sm:gap-3">
                  {chartPoints.map((point, index) => {
                    const isActive = activeBarIndex === index;
                    const pointRevenue = revenueForCurrency(point);
                    const height = Math.max(8, Math.round((pointRevenue / maxRevenue) * 100));
                    const dateLabel = formatBarDate(point.date, locale);
                    const revenueLabel = formatMoney(pointRevenue, displayCurrency, locale);

                    return (
                      <button
                        aria-label={t('overview.chartPoint', {
                          date: dateLabel,
                          revenue: revenueLabel,
                          sessions: point.completedSessions,
                        })}
                        aria-pressed={isActive}
                        className="group relative flex h-full min-w-0 flex-1 items-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset"
                        key={point.date}
                        onBlur={() => {
                          setActiveBarIndex(null);
                        }}
                        onClick={() => {
                          setActiveBarIndex(isActive ? null : index);
                        }}
                        onFocus={() => {
                          setActiveBarIndex(index);
                        }}
                        type="button"
                      >
                        <span
                          className={cn(
                            'w-full rounded-t-sm transition-all duration-200',
                            isActive
                              ? 'bg-chart-primary'
                              : 'bg-chart-accent group-hover:bg-chart-primary',
                          )}
                          style={{ height: `${String(height)}%` }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-2 flex gap-1.5 sm:gap-3">
                {chartPoints.map((point, index) => (
                  <span
                    className="min-w-0 flex-1 truncate text-center font-mono text-[10px] text-chart-axis"
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
                      sessions: point.completedSessions,
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
                  <SummaryValue label={t('overview.completedStays')} value={String(totalStays)} />
                </div>
                {activeBarIndex !== null && chartPoints[activeBarIndex] ? (
                  <div aria-live="polite" className="text-sm text-foreground-secondary">
                    <span className="font-mono text-xs uppercase tracking-wider text-accent-foreground">
                      {t('overview.selectedDay', {
                        date: formatBarDate(chartPoints[activeBarIndex].date, locale),
                      })}
                    </span>
                    <p className="mt-1 font-mono font-bold tabular-nums">
                      {t('overview.selectedDayValue', {
                        revenue: formatMoney(
                          revenueForCurrency(chartPoints[activeBarIndex]),
                          displayCurrency,
                          locale,
                        ),
                        sessions: chartPoints[activeBarIndex].completedSessions,
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
      className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-warning-foreground bg-warning-surface p-4 text-warning-text sm:flex-row sm:items-center sm:justify-between"
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
    <div>
      <dt className="type-label text-foreground-muted">{label}</dt>
      <dd className="mt-2 type-metric">{value}</dd>
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="type-label text-foreground-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

function OwnerOverviewSkeleton() {
  const { t } = useAppearance();

  return (
    <div aria-busy="true" aria-label={t('overview.loading')} className="space-y-10">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Skeleton className="h-72 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-72 rounded-[var(--radius-xl)]" />
      </div>
      <Skeleton className="h-80 rounded-[var(--radius-xl)]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-40 rounded-[var(--radius-lg)]" />
        <Skeleton className="h-40 rounded-[var(--radius-lg)]" />
        <Skeleton className="h-40 rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
