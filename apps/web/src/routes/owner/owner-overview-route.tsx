import { ArrowUpRight, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import {
  useAnalyticsRevenue,
  useAnalyticsSummary,
  useAnalyticsVolume,
} from '../../features/analytics/use-analytics.js';
import { OwnerParkingPanel } from '../../features/parking/owner-parking-panel.js';
import { useOwnedParkingOperations } from '../../features/parking/use-owned-parking-operations.js';
import { cn } from '../../lib/cn.js';
import { formatMoney } from '../../lib/format.js';

function formatBarDate(date: string, es: boolean): string {
  return new Intl.DateTimeFormat(es ? 'es-AR' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T00:00:00`));
}

export function OwnerOverviewRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const [days, setDays] = useState<7 | 30>(7);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const { parkings, parkingsQuery } = useOwnedParkingOperations();
  const summaryQuery = useAnalyticsSummary();
  const revenueQuery = useAnalyticsRevenue(days);
  const volumeQuery = useAnalyticsVolume(days);

  const isRefreshing =
    parkingsQuery.isFetching ||
    summaryQuery.isFetching ||
    revenueQuery.isFetching ||
    volumeQuery.isFetching;
  const summary = summaryQuery.data;
  const revenueSeries = revenueQuery.data?.data ?? [];
  const volumeSeries = volumeQuery.data?.data ?? [];
  const maxRevenue = Math.max(1, ...revenueSeries.map((point) => point.revenueCents));
  const totalRevenue = revenueSeries.reduce((total, point) => total + point.revenueCents, 0);
  const totalStays = volumeSeries.reduce((total, point) => total + point.completedSessions, 0);
  const analyticsError = summaryQuery.isError || revenueQuery.isError || volumeQuery.isError;

  const refresh = () => {
    void parkingsQuery.refetch();
    void summaryQuery.refetch();
    void revenueQuery.refetch();
    void volumeQuery.refetch();
  };

  if (parkingsQuery.isLoading) return <OwnerOverviewSkeleton />;
  if (parkingsQuery.isError) {
    return (
      <ErrorState onRetry={() => void parkingsQuery.refetch()}>
        {es
          ? 'No pudimos cargar las operaciones de tus cocheras.'
          : 'We could not load your parking operations.'}
      </ErrorState>
    );
  }
  if (parkings.length === 0) {
    return (
      <EmptyState
        action={
          <Button asChild variant="primary">
            <Link to="/app/parkings/new">
              <Plus aria-hidden="true" className="size-4" />
              {es ? 'Crear cochera' : 'Create parking'}
            </Link>
          </Button>
        }
        title={es ? 'Tu operación empieza con una cochera' : 'Start with your first facility'}
      >
        {es
          ? 'Cuando la crees, vas a ver la ocupación, los ingresos y las estadías desde acá.'
          : 'Once it is created, occupancy, revenue, and stays will appear here.'}
      </EmptyState>
    );
  }

  return (
    <section className="owner-page space-y-10" aria-labelledby="overview-title">
      <header className="border-b border-border-strong pb-7">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="type-label text-foreground-muted">
              {es ? 'Operación / hoy' : 'Operations / today'}
            </p>
            <h1
              className="mt-3 font-display text-4xl font-bold leading-[0.92] tracking-[-0.065em] sm:text-5xl"
              id="overview-title"
            >
              {es ? 'Todo lo importante, a la vista.' : 'Everything important, in view.'}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground-secondary">
              {es
                ? 'Una lectura simple de la red para tomar decisiones durante el día.'
                : 'A clear reading of your network for the decisions you make each day.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              aria-label={es ? 'Actualizar datos' : 'Refresh data'}
              disabled={isRefreshing}
              onClick={refresh}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn('size-3.5', isRefreshing && 'animate-spin')}
              />
              {es ? 'Actualizar' : 'Refresh'}
            </Button>
            <Button asChild size="sm">
              <Link to="/app/parkings/new">
                <Plus aria-hidden="true" className="size-4" />
                {es ? 'Nueva cochera' : 'New facility'}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section
          className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs sm:p-8"
          aria-labelledby="network-now-title"
        >
          <p className="type-label text-foreground-muted">{es ? 'Red ahora' : 'Network now'}</p>
          <h2
            className="mt-4 max-w-xl font-display text-3xl font-bold leading-tight tracking-[-0.045em]"
            id="network-now-title"
          >
            {summary
              ? es
                ? `${String(summary.activeVehicles)} ${summary.activeVehicles === 1 ? 'vehículo está' : 'vehículos están'} estacionados ahora.`
                : `${String(summary.activeVehicles)} ${summary.activeVehicles === 1 ? 'vehicle is' : 'vehicles are'} parked right now.`
              : es
                ? 'Estamos preparando la lectura de tu red.'
                : 'We are preparing your network reading.'}
          </h2>
          <div className="mt-8 grid gap-5 border-t border-border-subtle pt-5 sm:grid-cols-3">
            <SummaryMetric
              label={es ? 'Capacidad' : 'Capacity'}
              value={summary ? String(summary.totalCapacity) : 'N/A'}
            />
            <SummaryMetric
              label={es ? 'Ocupación' : 'Occupancy'}
              value={summary ? `${String(summary.occupancyPercent)}%` : 'N/A'}
            />
            <SummaryMetric
              label={es ? 'Cierres hoy' : 'Completed today'}
              value={summary ? String(summary.completedToday) : 'N/A'}
            />
          </div>
        </section>
        <section
          className="rounded-[var(--radius-xl)] border border-border bg-surface-subtle p-6 sm:p-8"
          aria-labelledby="attention-title"
        >
          <p className="type-label text-foreground-muted">
            {es ? 'Requiere atención' : 'Needs attention'}
          </p>
          <h2
            className="mt-4 font-display text-2xl font-bold tracking-[-0.04em]"
            id="attention-title"
          >
            {parkings.some(({ parking }) => !parking.isActive)
              ? es
                ? 'Hay cocheras pausadas.'
                : 'Some facilities are paused.'
              : es
                ? 'Todo funciona con normalidad.'
                : 'Everything is operating normally.'}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
            {parkings.some(({ parking }) => !parking.isActive)
              ? es
                ? 'Revisá las cocheras pausadas antes de esperar nuevos ingresos.'
                : 'Review paused facilities before expecting new arrivals.'
              : es
                ? 'No hay alertas operativas para revisar en este momento.'
                : 'There are no operational alerts to review right now.'}
          </p>
        </section>
      </div>
      {analyticsError ? (
        <div
          className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-warning-foreground bg-warning-surface p-4 text-warning-text sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="text-sm font-semibold">
            {es
              ? 'Algunos datos de analítica no están disponibles ahora. La operación sigue visible.'
              : 'Some analytics are unavailable right now. Your operations remain visible.'}
          </p>
          <Button onClick={refresh} size="sm" variant="secondary">
            {es ? 'Reintentar analítica' : 'Retry analytics'}
          </Button>
        </div>
      ) : null}
      <section
        className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface-emphasis text-foreground"
        aria-labelledby="activity-title"
      >
        <div className="flex flex-col justify-between gap-5 border-b border-border p-6 sm:flex-row sm:items-start sm:p-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <BarChart3 aria-hidden="true" className="size-4" />
              </span>
              <p className="type-label text-foreground-muted">{es ? 'Actividad' : 'Activity'}</p>
            </div>
            <h2
              className="mt-4 font-display text-3xl font-bold leading-none tracking-[-0.055em]"
              id="activity-title"
            >
              {es ? 'Ingresos y rotación' : 'Revenue and turnover'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
              {es
                ? 'Elegí una barra para ver el detalle de ese día.'
                : 'Select a bar to see that day in detail.'}
            </p>
          </div>
          <div className="flex rounded-full border border-border-strong p-1">
            {([7, 30] as const).map((period) => (
              <button
                aria-pressed={days === period}
                className={cn(
                  'rounded-full px-4 py-2 font-mono text-xs font-bold transition-colors',
                  days === period
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground-secondary hover:text-foreground',
                )}
                key={period}
                onClick={() => {
                  setActiveBarIndex(null);
                  setDays(period);
                }}
                type="button"
              >
                {period}D
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {revenueQuery.isLoading || volumeQuery.isLoading ? (
            <div
              className="flex h-56 items-end gap-2"
              aria-label={es ? 'Cargando actividad' : 'Loading activity'}
            >
              {Array.from({ length: days === 7 ? 7 : 14 }).map((_, index) => (
                <div
                  className="flex-1 animate-pulse rounded-t bg-foreground-muted/20"
                  key={index}
                  style={{ height: `${String(20 + (index % 5) * 15)}%` }}
                />
              ))}
            </div>
          ) : revenueQuery.isError || volumeQuery.isError ? (
            <div className="flex h-56 items-center justify-center text-sm text-foreground-secondary">
              {es
                ? 'La actividad analítica no está disponible ahora.'
                : 'Activity analytics are unavailable right now.'}
            </div>
          ) : revenueSeries.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-foreground-muted">
              {es
                ? 'Todavía no hay datos para este período.'
                : 'There is no data for this period yet.'}
            </div>
          ) : (
            <>
              <div className="flex h-56 items-end gap-1.5 border-b border-border pb-3 sm:gap-3">
                {revenueSeries.map((point, index) => {
                  const isActive = activeBarIndex === index;
                  const sessions = volumeSeries[index]?.completedSessions ?? 0;
                  const height = Math.max(8, Math.round((point.revenueCents / maxRevenue) * 100));
                  return (
                    <button
                      aria-label={`${formatBarDate(point.date, es)}: ${formatMoney(point.revenueCents, summary?.currency)}, ${String(sessions)} ${es ? 'estadías' : 'stays'}`}
                      aria-pressed={isActive}
                      className="group relative flex h-full flex-1 items-end focus-visible:outline-none"
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
                          isActive ? 'bg-foreground' : 'bg-accent group-hover:bg-foreground',
                        )}
                        style={{ height: `${String(height)}%` }}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-1.5 sm:gap-3">
                {revenueSeries.map((point, index) => (
                  <span
                    className="flex-1 truncate text-center font-mono text-[10px] text-foreground-muted"
                    key={point.date}
                  >
                    {days === 30 && index % 4 !== 0 && index !== revenueSeries.length - 1
                      ? ''
                      : formatBarDate(point.date, es)}
                  </span>
                ))}
              </div>
              <div className="mt-7 flex flex-col justify-between gap-5 border-t border-border pt-5 sm:flex-row sm:items-end">
                <div className="flex flex-wrap gap-x-8 gap-y-4">
                  <SummaryValue
                    label={
                      es ? `Facturado en ${String(days)} días` : `Revenue in ${String(days)} days`
                    }
                    value={formatMoney(totalRevenue, summary?.currency)}
                  />
                  <SummaryValue
                    label={es ? `Estadías completadas` : 'Completed stays'}
                    value={String(totalStays)}
                  />
                </div>
                {activeBarIndex !== null ? (
                  <div className="text-sm text-foreground-secondary">
                    <span className="font-mono text-xs uppercase tracking-wider text-accent-foreground">
                      {formatBarDate(revenueSeries[activeBarIndex]?.date ?? '', es)}
                    </span>
                    <p className="mt-1 font-mono font-bold tabular-nums">
                      {formatMoney(
                        revenueSeries[activeBarIndex]?.revenueCents ?? 0,
                        summary?.currency,
                      )}
                      <span className="font-sans text-xs font-medium text-foreground-muted">
                        {' '}
                        · {volumeSeries[activeBarIndex]?.completedSessions ?? 0}{' '}
                        {es ? 'estadías' : 'stays'}
                      </span>
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="facilities-title">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-border-strong pb-4">
          <div>
            <p className="type-label text-foreground-muted">{es ? 'Tu red' : 'Your network'}</p>
            <h2
              className="mt-2 font-display text-3xl font-bold leading-none tracking-[-0.055em]"
              id="facilities-title"
            >
              {es ? 'Cocheras en operación' : 'Operating facilities'}
            </h2>
          </div>
          <Link
            className="group flex shrink-0 items-center gap-1 text-sm font-bold underline decoration-accent decoration-4 underline-offset-4"
            to="/app/parkings"
          >
            {es ? 'Ver todas' : 'View all'}
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {parkings
            .slice(0, 3)
            .map(({ activeSessionCount, occupancyError, occupancyLoading, parking }, index) => (
              <OwnerParkingPanel
                activeSessionCount={activeSessionCount}
                identifier={index + 1}
                key={parking.id}
                occupancyError={occupancyError}
                occupancyLoading={occupancyLoading}
                parking={parking}
              />
            ))}
        </div>
      </section>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="type-label text-foreground-muted">{label}</p>
      <p className="mt-2 type-metric">{value}</p>
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
  return (
    <div className="space-y-10" aria-label="Loading parking operations">
      <Skeleton className="h-44 rounded-[var(--radius-xl)]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-48 rounded-[var(--radius-lg)]" key={index} />
        ))}
      </div>
      <Skeleton className="h-[28rem] rounded-[var(--radius-xl)]" />
    </div>
  );
}
