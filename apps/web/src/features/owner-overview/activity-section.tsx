import { useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group.js';
import { useAnalyticsRevenue, useAnalyticsVolume } from '../analytics/use-analytics.js';
import { cn } from '../../lib/cn.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import type { Locale } from '../../lib/localization.js';

interface ActivitySectionProps {
  days: 7 | 30;
  onDaysChange: (days: 7 | 30) => void;
  revenueQuery: ReturnType<typeof useAnalyticsRevenue>;
  volumeQuery: ReturnType<typeof useAnalyticsVolume>;
}

function formatBarDate(date: string, locale: Locale): string {
  const [year, month, day] = date.split('-').map(Number);
  const dateValue =
    year && month && day ? new Date(Date.UTC(year, month - 1, day, 12)) : new Date(date);

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(dateValue);
}

export function ActivitySection({
  days,
  onDaysChange,
  revenueQuery,
  volumeQuery,
}: ActivitySectionProps) {
  const { locale, t } = useAppearance();
  const formatCount = (value: number) => formatNumber(value, locale);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'ARS' | 'USD'>('USD');
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
  const retryActivity = () => {
    if (revenueQuery.isError) void revenueQuery.refetch();
    if (volumeQuery.isError) void volumeQuery.refetch();
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-accent text-foreground"
      aria-labelledby="activity-title"
    >
      <div className="flex flex-col justify-between gap-5 border-b border-border p-6 sm:p-8 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-foreground">
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
                onDaysChange(Number(value) as 7 | 30);
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
