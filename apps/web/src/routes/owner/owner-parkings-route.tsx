import { Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { OwnerParkingPanel } from '../../features/parking/owner-parking-panel.js';
import { useOwnedParkingOperations } from '../../features/parking/use-owned-parking-operations.js';
import { cn } from '../../lib/cn.js';

export function OwnerParkingsRoute() {
  const { language, t } = useAppearance();
  const es = language === 'es';
  const { parkings, parkingsQuery } = useOwnedParkingOperations();
  const knownOccupancies = parkings.filter(
    ({ activeSessionCount }) => activeSessionCount !== undefined,
  );
  const activeVehicles = knownOccupancies.reduce(
    (total, { activeSessionCount }) => total + (activeSessionCount ?? 0),
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
    <section className="owner-page space-y-9" aria-labelledby="owner-parkings-title">
      <header className="border-b border-[#121417] pb-7">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d695f]">
              {es ? 'Tu red' : 'Your network'}
            </p>
            <h1
              className="mt-3 font-display text-4xl font-bold leading-[0.92] tracking-[-0.065em] text-[#121417] sm:text-5xl"
              id="owner-parkings-title"
            >
              {es ? 'Cocheras, sin vueltas.' : 'Facilities, made clear.'}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#45423c]">
              {es
                ? 'Entrá a cada operación para administrar ingresos, plazas y estadías activas.'
                : 'Open any facility to manage admissions, capacity, and active stays.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              aria-label={t('parkingOperation.refreshFacilities')}
              className="border-[#121417] bg-white text-[#121417] hover:bg-[#f1eee7]"
              disabled={parkingsQuery.isFetching}
              onClick={() => void parkingsQuery.refetch()}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                aria-hidden="true"
                className={cn('size-3.5', parkingsQuery.isFetching && 'animate-spin')}
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

      {parkings.length === 0 ? (
        <EmptyState
          action={
            <Button asChild variant="primary">
              <Link to="/app/parkings/new">
                <Plus aria-hidden="true" className="size-4" />
                {es ? 'Crear cochera' : 'Create facility'}
              </Link>
            </Button>
          }
          title={es ? 'Todavía no hay cocheras' : 'No facilities yet'}
        >
          {es
            ? 'Creá la primera para empezar a registrar la operación.'
            : 'Create your first one to start recording operations.'}
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-px overflow-hidden rounded-[1.35rem] border border-[#121417] bg-[#121417] sm:grid-cols-3">
            <NetworkMetric label={es ? 'Cocheras' : 'Facilities'} value={String(parkings.length)} />
            <NetworkMetric
              label={es ? 'Plazas totales' : 'Total spots'}
              value={String(totalCapacity)}
            />
            <NetworkMetric
              label={es ? 'Vehículos dentro' : 'Vehicles inside'}
              note={
                knownOccupancies.length === parkings.length
                  ? undefined
                  : es
                    ? 'actualizando'
                    : 'updating'
              }
              value={String(activeVehicles)}
            />
          </div>

          {parkingsQuery.isFetching ? (
            <p
              className="font-mono text-xs font-semibold uppercase tracking-wider text-[#6d695f]"
              role="status"
            >
              {t('parkingOperation.refreshingFacilities')}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {parkings.map(
              ({ activeSessionCount, occupancyError, occupancyLoading, parking }, index) => (
                <OwnerParkingPanel
                  activeSessionCount={activeSessionCount}
                  identifier={index + 1}
                  key={parking.id}
                  occupancyError={occupancyError}
                  occupancyLoading={occupancyLoading}
                  parking={parking}
                />
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}

function NetworkMetric({ label, note, value }: { label: string; note?: string; value: string }) {
  return (
    <div className="bg-white p-5 text-[#121417]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
        {label}
      </p>
      <p className="mt-4 font-display text-4xl font-bold leading-none tracking-[-0.06em] tabular-nums">
        {value}
      </p>
      {note ? <p className="mt-2 text-xs font-semibold text-[#6d695f]">{note}</p> : null}
    </div>
  );
}

function OwnerParkingsSkeleton() {
  const { t } = useAppearance();
  return (
    <div className="space-y-8" aria-label={t('parkingOperation.refreshFacilities')}>
      <Skeleton className="h-44 rounded-[1.75rem]" />
      <Skeleton className="h-32 rounded-[1.35rem]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-72 rounded-[1.5rem]" key={index} />
        ))}
      </div>
    </div>
  );
}
