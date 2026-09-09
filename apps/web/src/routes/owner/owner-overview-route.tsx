import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Car,
  CheckCircle2,
  DollarSign,
  Plus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js';
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

function formatBarDate(dateStr: string, es: boolean): string {
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return new Intl.DateTimeFormat(es ? 'es-AR' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function OwnerOverviewRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const [days, setDays] = useState<7 | 30>(7);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const { parkings, parkingsQuery } = useOwnedParkingOperations();
  const summaryQuery = useAnalyticsSummary();
  const revenueQuery = useAnalyticsRevenue(days);
  const volumeQuery = useAnalyticsVolume(days);

  const isRefreshing = summaryQuery.isFetching || revenueQuery.isFetching || volumeQuery.isFetching;

  const handleRefreshAll = () => {
    void parkingsQuery.refetch();
    void summaryQuery.refetch();
    void revenueQuery.refetch();
    void volumeQuery.refetch();
  };

  if (parkingsQuery.isLoading) return <OwnerOverviewSkeleton />;
  if (parkingsQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void parkingsQuery.refetch();
        }}
      >
        {es
          ? 'No se pudieron cargar las operaciones de cocheras.'
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
        title={es ? 'Sin cocheras registradas' : 'No parking operations yet'}
      >
        {es
          ? 'Creá tu primera cochera para empezar a registrar estadías y telemetría.'
          : 'Create your first facility to start recording visits and telemetry.'}
      </EmptyState>
    );
  }

  const summary = summaryQuery.data;
  const revenueSeries = revenueQuery.data?.data ?? [];
  const volumeSeries = volumeQuery.data?.data ?? [];

  const maxRevenue = Math.max(1, ...revenueSeries.map((item) => item.revenueCents));
  const totalWindowRevenue = revenueSeries.reduce((acc, item) => acc + item.revenueCents, 0);
  const totalWindowVolume = volumeSeries.reduce((acc, item) => acc + item.completedSessions, 0);

  const occupancyRate = summary?.occupancyPercent ?? 0;
  const occupancyBadgeVariant =
    occupancyRate >= 90 ? 'destructive' : occupancyRate >= 70 ? 'warning' : 'success';

  return (
    <section className="owner-page stack-owner space-y-8" aria-labelledby="overview-title">
      {/* Top Header */}
      <header className="owner-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="type-label text-primary font-mono font-semibold">
              {es ? 'Operaciones de Flota' : 'Fleet Operations'}
            </span>
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
          </div>
          <h1 className="type-page-title text-foreground font-display mt-1" id="overview-title">
            {es ? 'Panel de Control' : 'Fleet Overview'}
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-0.5">
            {es
              ? 'Monitoreo en tiempo real de ocupación, facturación y rotación de vehículos.'
              : 'Real-time telemetry on capacity, revenue, and vehicle intake.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            aria-label={es ? 'Actualizar telemetría' : 'Refresh telemetry'}
            className="parkcore-pressable"
            disabled={isRefreshing}
            onClick={handleRefreshAll}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-3.5', isRefreshing && 'animate-spin text-primary')}
            />
            <span className="hidden sm:inline">{es ? 'Actualizar' : 'Refresh'}</span>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link to="/app/parkings">{es ? 'Gestionar cocheras' : 'Manage parkings'}</Link>
          </Button>
          <Button asChild size="sm" variant="primary">
            <Link to="/app/parkings/new">
              <Plus aria-hidden="true" className="size-4" />
              {es ? 'Nueva cochera' : 'Add facility'}
            </Link>
          </Button>
        </div>
      </header>

      {/* 4 KPI Instruments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Active Vehicles */}
        <Card className="relative overflow-hidden border-border bg-surface p-5 transition-all duration-200 hover:border-border-strong hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              {es ? 'Vehículos Activos' : 'Active Vehicles'}
            </span>
            <div className="size-8 rounded-md bg-surface-subtle flex items-center justify-center text-primary">
              <Car aria-hidden="true" className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {summary ? summary.activeVehicles : '—'}
            </span>
            <span className="font-mono text-xs text-foreground-muted tabular-nums">
              / {summary ? summary.totalCapacity : '—'} {es ? 'plazas' : 'total'}
            </span>
          </div>
          <p className="mt-2 text-xs text-foreground-secondary flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-info shrink-0" />
            {es ? 'Estadías en curso en la red' : 'Live stays inside facilities'}
          </p>
        </Card>

        {/* KPI 2: Fleet Occupancy */}
        <Card className="relative overflow-hidden border-border bg-surface p-5 transition-all duration-200 hover:border-border-strong hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              {es ? 'Ocupación Global' : 'Fleet Occupancy'}
            </span>
            <div className="size-8 rounded-md bg-surface-subtle flex items-center justify-center text-primary">
              <Activity aria-hidden="true" className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {summary ? `${String(summary.occupancyPercent)}%` : '—'}
            </span>
            {summary ? (
              <Badge dot size="sm" variant={occupancyBadgeVariant}>
                {summary.occupancyPercent >= 90
                  ? es
                    ? 'Crítica'
                    : 'Critical'
                  : summary.occupancyPercent >= 70
                    ? es
                      ? 'Elevada'
                      : 'Warning'
                    : es
                      ? 'Óptima'
                      : 'Optimal'}
              </Badge>
            ) : null}
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                occupancyRate >= 90
                  ? 'bg-danger'
                  : occupancyRate >= 70
                    ? 'bg-warning'
                    : 'bg-success',
              )}
              style={{ width: `${String(Math.min(100, occupancyRate))}%` }}
            />
          </div>
        </Card>

        {/* KPI 3: Completed Stays Today */}
        <Card className="relative overflow-hidden border-border bg-surface p-5 transition-all duration-200 hover:border-border-strong hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              {es ? 'Rotación Hoy' : 'Stays Today'}
            </span>
            <div className="size-8 rounded-md bg-surface-subtle flex items-center justify-center text-primary">
              <CheckCircle2 aria-hidden="true" className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {summary ? summary.completedToday : '—'}
            </span>
            <span className="font-mono text-xs text-foreground-muted">
              {es ? 'completadas' : 'check-outs'}
            </span>
          </div>
          <p className="mt-2 text-xs text-foreground-secondary flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success shrink-0" />
            {es ? 'Egresos registrados en la fecha' : 'Vehicles completed today'}
          </p>
        </Card>

        {/* KPI 4: Today's Revenue */}
        <Card className="relative overflow-hidden border-border bg-surface p-5 transition-all duration-200 hover:border-border-strong hover:shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              {es ? 'Facturación Hoy' : "Today's Revenue"}
            </span>
            <div className="size-8 rounded-md bg-surface-subtle flex items-center justify-center text-primary">
              <DollarSign aria-hidden="true" className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {summary ? formatMoney(summary.revenueTodayCents, summary.currency) : '—'}
            </span>
          </div>
          <p className="mt-2 text-xs text-foreground-secondary flex items-center gap-1.5">
            <TrendingUp aria-hidden="true" className="size-3.5 text-primary shrink-0" />
            {es ? 'Total facturado en el día' : 'Billed across all facilities'}
          </p>
        </Card>
      </div>

      {/* Telemetry Chart Section */}
      <Card className="border-border bg-surface shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 aria-hidden="true" className="size-4 text-primary" />
              <CardTitle className="font-display text-base font-bold text-foreground">
                {es ? 'Telemetría de Facturación y Demanda' : 'Revenue & Volume Telemetry'}
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-foreground-secondary mt-0.5">
              {es
                ? 'Comportamiento diario de ingresos brutos y rotación de vehículos.'
                : 'Daily financial yield and checkout volume trends.'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-subtle p-1 self-start sm:self-auto">
            <button
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors font-mono',
                days === 7
                  ? 'bg-surface text-foreground shadow-xs font-bold'
                  : 'text-foreground-secondary hover:text-foreground',
              )}
              onClick={() => {
                setDays(7);
              }}
              type="button"
            >
              7D
            </button>
            <button
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors font-mono',
                days === 30
                  ? 'bg-surface text-foreground shadow-xs font-bold'
                  : 'text-foreground-secondary hover:text-foreground',
              )}
              onClick={() => {
                setDays(30);
              }}
              type="button"
            >
              30D
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {revenueQuery.isLoading || volumeQuery.isLoading ? (
            <div className="h-56 flex items-end justify-between gap-2 pt-6">
              {Array.from({ length: days === 7 ? 7 : 14 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-surface-subtle animate-pulse rounded-t"
                  style={{ height: `${String(20 + (i % 5) * 15)}%` }}
                />
              ))}
            </div>
          ) : revenueSeries.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-foreground-muted">
              {es
                ? 'Sin datos de telemetría para este período'
                : 'No telemetry data for this period'}
            </div>
          ) : (
            <div>
              {/* Telemetry Bars */}
              <div className="h-56 flex items-end justify-between gap-1.5 sm:gap-3 pt-6 border-b border-border-subtle">
                {revenueSeries.map((point, index) => {
                  const heightPercent = Math.max(
                    8,
                    Math.round((point.revenueCents / maxRevenue) * 100),
                  );
                  const volumePoint = volumeSeries[index];
                  const volumeSessions = volumePoint.completedSessions;
                  const isHovered = hoveredBarIndex === index;

                  return (
                    <div
                      key={point.date}
                      className="group relative flex flex-1 flex-col items-center h-full justify-end"
                      onMouseEnter={() => {
                        setHoveredBarIndex(index);
                      }}
                      onMouseLeave={() => {
                        setHoveredBarIndex(null);
                      }}
                    >
                      {/* Tooltip */}
                      {isHovered ? (
                        <div className="absolute -top-12 z-20 whitespace-nowrap rounded-md border border-border-strong bg-surface-raised px-2.5 py-1.5 text-center shadow-dialog pointer-events-none animate-in fade-in zoom-in-95 duration-100">
                          <p className="font-mono text-xs font-bold text-foreground">
                            {formatMoney(point.revenueCents, summary?.currency)}
                          </p>
                          <p className="font-mono text-[10px] text-foreground-muted">
                            {formatBarDate(point.date, es)} · {String(volumeSessions)}{' '}
                            {es ? 'estadías' : 'stays'}
                          </p>
                        </div>
                      ) : null}

                      {/* Bar visual */}
                      <div
                        className={cn(
                          'w-full max-w-[42px] rounded-t transition-all duration-200 cursor-pointer',
                          isHovered
                            ? 'bg-primary ring-2 ring-primary/30'
                            : 'bg-primary/80 hover:bg-primary',
                        )}
                        style={{ height: `${String(heightPercent)}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Date labels below bars */}
              <div className="flex justify-between gap-1.5 sm:gap-3 pt-2 text-[10px] sm:text-xs font-mono text-foreground-muted">
                {revenueSeries.map((point, index) => {
                  // If 30 days, skip some labels to avoid crowding
                  if (days === 30 && index % 4 !== 0 && index !== revenueSeries.length - 1) {
                    return <div key={point.date} className="flex-1" />;
                  }
                  return (
                    <div key={point.date} className="flex-1 text-center truncate">
                      {formatBarDate(point.date, es)}
                    </div>
                  );
                })}
              </div>

              {/* Summary telemetry footer */}
              <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-foreground-muted block">
                      {es
                        ? `Total facturado (${String(days)}d)`
                        : `Total window revenue (${String(days)}d)`}
                    </span>
                    <span className="font-mono font-bold text-base text-foreground tabular-nums">
                      {formatMoney(totalWindowRevenue, summary?.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block">
                      {es
                        ? `Estadías completadas (${String(days)}d)`
                        : `Completed volume (${String(days)}d)`}
                    </span>
                    <span className="font-mono font-bold text-base text-foreground tabular-nums">
                      {totalWindowVolume}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-foreground-muted font-mono text-[11px]">
                  <span className="size-2 rounded-full bg-primary" />
                  <span>{es ? 'Ingresos brutos liquidados' : 'Settled revenue'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Facilities Fleet Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              {es ? 'Cocheras bajo Operación' : 'Managed Facilities'}
            </h2>
            <Badge size="sm" variant="secondary">
              {parkings.length}{' '}
              {parkings.length === 1
                ? es
                  ? 'cochera'
                  : 'facility'
                : es
                  ? 'cocheras'
                  : 'facilities'}
            </Badge>
          </div>
          <Link
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            to="/app/parkings"
          >
            {es ? 'Ver catálogo completo' : 'View all facilities'}
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>

        <div className="owner-parking-panels grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parkings.map(({ activeSessionCount, parking }, index) => (
            <OwnerParkingPanel
              activeSessionCount={activeSessionCount}
              identifier={index + 1}
              key={parking.id}
              occupancyError={parkings[index]?.occupancyError}
              occupancyLoading={parkings[index]?.occupancyLoading}
              parking={parking}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function OwnerOverviewSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-label="Loading parking operations">
      <div className="h-16 w-1/3 bg-surface-subtle rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[var(--radius-lg)] bg-surface-subtle" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-[var(--radius-lg)] bg-surface-subtle" />
      <div className="owner-parking-panels grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-[var(--radius-lg)] bg-surface-subtle" />
        <Skeleton className="h-64 rounded-[var(--radius-lg)] bg-surface-subtle" />
      </div>
    </div>
  );
}
