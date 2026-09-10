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
  const occupancy = Math.min(100, summary?.occupancyPercent ?? 0);

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
      <header className="border-b border-[#121417] pb-7">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d695f]">
              {es ? 'Operación / hoy' : 'Operations / today'}
            </p>
            <h1
              className="mt-3 font-display text-4xl font-bold leading-[0.92] tracking-[-0.065em] text-[#121417] sm:text-5xl"
              id="overview-title"
            >
              {es ? 'Todo lo importante, a la vista.' : 'Everything important, in view.'}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#45423c]">
              {es
                ? 'Una lectura simple de la red para tomar decisiones durante el día.'
                : 'A clear reading of your network for the decisions you make each day.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              aria-label={es ? 'Actualizar datos' : 'Refresh data'}
              className="border-[#121417] bg-white text-[#121417] hover:bg-[#f1eee7]"
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
            <Button
              asChild
              className="border-[#121417] bg-[#121417] text-white hover:bg-[#30312d]"
              size="sm"
            >
              <Link to="/app/parkings/new">
                <Plus aria-hidden="true" className="size-4" />
                {es ? 'Nueva cochera' : 'New facility'}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={
            summary
              ? `${String(summary.totalCapacity)} ${es ? 'plazas en total' : 'spots in total'}`
              : es
                ? 'Cargando capacidad'
                : 'Loading capacity'
          }
          label={es ? 'Vehículos ahora' : 'Vehicles now'}
          value={summary ? String(summary.activeVehicles) : '—'}
        />
        <MetricCard
          detail={es ? 'Ocupación de toda la red' : 'Across your network'}
          label={es ? 'Ocupación' : 'Occupancy'}
          progress={occupancy}
          value={summary ? `${String(summary.occupancyPercent)}%` : '—'}
        />
        <MetricCard
          detail={es ? 'Egresos registrados hoy' : 'Check-outs recorded today'}
          label={es ? 'Rotación de hoy' : 'Today’s turnover'}
          value={summary ? String(summary.completedToday) : '—'}
        />
        <MetricCard
          detail={es ? 'Ingresos de la jornada' : 'Revenue collected today'}
          label={es ? 'Facturación de hoy' : 'Today’s revenue'}
          value={summary ? formatMoney(summary.revenueTodayCents, summary.currency) : '—'}
        />
      </div>

      <section
        className="overflow-hidden rounded-[1.75rem] bg-[#121417] text-white"
        aria-labelledby="activity-title"
      >
        <div className="flex flex-col justify-between gap-5 border-b border-white/20 p-6 sm:flex-row sm:items-start sm:p-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#ffcc00] text-[#121417]">
                <BarChart3 aria-hidden="true" className="size-4" />
              </span>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffcc00]">
                {es ? 'Actividad' : 'Activity'}
              </p>
            </div>
            <h2
              className="mt-4 font-display text-3xl font-bold leading-none tracking-[-0.055em]"
              id="activity-title"
            >
              {es ? 'Ingresos y rotación' : 'Revenue and turnover'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              {es
                ? 'Elegí una barra para ver el detalle de ese día.'
                : 'Select a bar to see that day in detail.'}
            </p>
          </div>
          <div className="flex rounded-full border border-white/25 p-1">
            {([7, 30] as const).map((period) => (
              <button
                aria-pressed={days === period}
                className={cn(
                  'rounded-full px-4 py-2 font-mono text-xs font-bold transition-colors',
                  days === period
                    ? 'bg-[#ffcc00] text-[#121417]'
                    : 'text-white/70 hover:text-white',
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
                  className="flex-1 animate-pulse rounded-t bg-white/15"
                  key={index}
                  style={{ height: `${String(20 + (index % 5) * 15)}%` }}
                />
              ))}
            </div>
          ) : revenueSeries.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-white/60">
              {es
                ? 'Todavía no hay datos para este período.'
                : 'There is no data for this period yet.'}
            </div>
          ) : (
            <>
              <div className="flex h-56 items-end gap-1.5 border-b border-white/20 pb-3 sm:gap-3">
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
                          isActive ? 'bg-white' : 'bg-[#ffcc00] group-hover:bg-white',
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
                    className="flex-1 truncate text-center font-mono text-[10px] text-white/50"
                    key={point.date}
                  >
                    {days === 30 && index % 4 !== 0 && index !== revenueSeries.length - 1
                      ? ''
                      : formatBarDate(point.date, es)}
                  </span>
                ))}
              </div>
              <div className="mt-7 flex flex-col justify-between gap-5 border-t border-white/20 pt-5 sm:flex-row sm:items-end">
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
                  <div className="text-sm text-white/80">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#ffcc00]">
                      {formatBarDate(revenueSeries[activeBarIndex]?.date ?? '', es)}
                    </span>
                    <p className="mt-1 font-mono font-bold tabular-nums">
                      {formatMoney(
                        revenueSeries[activeBarIndex]?.revenueCents ?? 0,
                        summary?.currency,
                      )}
                      <span className="font-sans text-xs font-medium text-white/60">
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
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-[#121417] pb-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#6d695f]">
              {es ? 'Tu red' : 'Your network'}
            </p>
            <h2
              className="mt-2 font-display text-3xl font-bold leading-none tracking-[-0.055em] text-[#121417]"
              id="facilities-title"
            >
              {es ? 'Cocheras en operación' : 'Operating facilities'}
            </h2>
          </div>
          <Link
            className="group flex shrink-0 items-center gap-1 text-sm font-bold text-[#121417] underline decoration-[#ffcc00] decoration-4 underline-offset-4"
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

function MetricCard({
  detail,
  label,
  progress,
  value,
}: {
  detail: string;
  label: string;
  progress?: number;
  value: string;
}) {
  return (
    <article className="rounded-[1.35rem] border border-[#121417] bg-white p-5 text-[#121417]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
        {label}
      </p>
      <p className="mt-5 font-display text-4xl font-bold leading-none tracking-[-0.06em] tabular-nums">
        {value}
      </p>
      {progress !== undefined ? (
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e7e4dd]">
          <div
            className="h-full rounded-full bg-[#ffcc00]"
            style={{ width: `${String(progress)}%` }}
          />
        </div>
      ) : null}
      <p
        className={cn(
          'text-sm leading-snug text-[#45423c]',
          progress === undefined ? 'mt-6' : 'mt-3',
        )}
      >
        {detail}
      </p>
    </article>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-white/50">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">{value}</p>
    </div>
  );
}

function OwnerOverviewSkeleton() {
  return (
    <div className="space-y-10" aria-label="Loading parking operations">
      <Skeleton className="h-44 rounded-[1.75rem]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-48 rounded-[1.35rem]" key={index} />
        ))}
      </div>
      <Skeleton className="h-[28rem] rounded-[1.75rem]" />
    </div>
  );
}
