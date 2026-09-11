import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, History, MapPin, Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { CheckInPanel } from '../../components/domain/check-in-panel.js';
import { SessionRow } from '../../components/domain/session.js';
import { Button } from '../../components/ui/button.js';
import { Sheet } from '../../components/ui/dialog.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { useToast } from '../../components/ui/toast-context.js';
import { checkIn, getActiveSessions, getOwnedParkings } from '../../lib/api/owner-api.js';
import { normalizePlate } from '../../lib/plate.js';
import { useDebouncedValue } from '../../lib/use-debounced-value.js';

export function OwnerParkingOverviewRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const { parkingId } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInError, setCheckInError] = useState<string>();
  const [plateSearch, setPlateSearch] = useState('');
  const debouncedPlateSearch = useDebouncedValue(normalizePlate(plateSearch), 250);
  const parkingsQuery = useQuery({ queryKey: ['owned-parkings'], queryFn: getOwnedParkings });
  const parking = parkingsQuery.data?.find((item) => item.id === parkingId);
  const occupancyQuery = useQuery({
    enabled: Boolean(parking),
    queryKey: ['active-sessions', parkingId],
    queryFn: () => getActiveSessions(parkingId ?? ''),
  });
  const filteredSessionsQuery = useQuery({
    enabled: Boolean(parking && debouncedPlateSearch),
    queryKey: ['active-sessions', parkingId, 'plate', debouncedPlateSearch],
    queryFn: () => getActiveSessions(parkingId ?? '', { plate: debouncedPlateSearch }),
  });
  const activeSessionsQuery = debouncedPlateSearch ? filteredSessionsQuery : occupancyQuery;
  const checkInMutation = useMutation({
    mutationFn: (input: Parameters<typeof checkIn>[1]) => checkIn(parkingId ?? '', input),
  });

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.key.toLowerCase() !== 'n' ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        !parking?.isActive ||
        (target instanceof HTMLElement &&
          target.matches('input, textarea, select, [contenteditable="true"]'))
      ) {
        return;
      }
      event.preventDefault();
      setCheckInOpen(true);
    };
    window.addEventListener('keydown', onShortcut);
    return () => {
      window.removeEventListener('keydown', onShortcut);
    };
  }, [parking?.isActive]);

  if (parkingsQuery.isLoading) return <OwnerParkingOperationSkeleton />;
  if (parkingsQuery.isError || !parkingId) {
    return (
      <ErrorState onRetry={() => void parkingsQuery.refetch()}>
        {es ? 'No pudimos cargar esta cochera.' : 'We could not load this parking.'}
      </ErrorState>
    );
  }
  if (!parking) {
    return (
      <ErrorState title={es ? 'Cochera no disponible' : 'Parking unavailable'}>
        {es
          ? 'Esta cochera no está disponible en tu cuenta.'
          : 'This parking is not available in your account.'}
      </ErrorState>
    );
  }

  const activeSessions = activeSessionsQuery.data;
  const occupancy = occupancyQuery.data?.length ?? 0;
  const occupancyPercent =
    parking.capacity === 0 ? 0 : Math.min(100, Math.round((occupancy / parking.capacity) * 100));
  const available = Math.max(0, parking.capacity - occupancy);
  const openCheckIn = () => {
    if (parking.isActive) setCheckInOpen(true);
  };

  return (
    <section className="owner-page space-y-9" aria-labelledby="parking-overview-title">
      <header className="border-b border-border-strong pb-7">
        <Link
          className="inline-flex items-center gap-1 text-sm font-bold underline decoration-accent decoration-4 underline-offset-4"
          to="/app/parkings"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          {es ? 'Todas las cocheras' : 'All facilities'}
        </Link>
        <div className="mt-7 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="type-label text-foreground-muted">
              {es ? 'Operación de cochera' : 'Facility operation'}
            </p>
            <h1
              className="mt-3 font-display text-4xl font-bold leading-[0.92] tracking-[-0.065em] sm:text-5xl"
              id="parking-overview-title"
            >
              {parking.title}
            </h1>
            <p className="mt-4 flex items-start gap-2 text-base leading-relaxed text-foreground-secondary">
              <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" />
              {parking.address}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border-strong px-3 py-2 text-xs font-bold">
              {parking.isActive ? (es ? 'En operación' : 'Operating') : es ? 'Pausada' : 'Paused'}
            </span>
            <Button asChild size="sm" variant="outline">
              <Link
                aria-label={es ? `Editar ${parking.title}` : `Edit ${parking.title}`}
                to={`/app/parkings/${parking.id}/edit`}
              >
                <Pencil aria-hidden="true" className="size-3.5" /> {es ? 'Editar' : 'Edit'}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section
          className="rounded-[var(--radius-xl)] border border-border bg-surface-emphasis p-6 text-foreground sm:p-8"
          aria-labelledby="check-in-title"
        >
          <p className="type-label text-foreground-muted">{es ? 'Ingresos' : 'Arrivals'}</p>
          <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h2
                className="font-display text-3xl font-bold leading-none tracking-[-0.055em]"
                id="check-in-title"
              >
                {es ? 'Listo para el próximo vehículo.' : 'Ready for the next vehicle.'}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground-secondary">
                {es
                  ? 'Registrá primero la patente. Los datos del vehículo y visitante son opcionales y se pueden sumar en el mismo paso.'
                  : 'Record a plate first. Vehicle and visitor details are optional and can be added in the same step.'}
              </p>
            </div>
            <Button disabled={!parking.isActive} onClick={openCheckIn}>
              <Plus aria-hidden="true" className="size-4" /> {es ? 'Ingresar' : 'Check in'}{' '}
              <kbd
                aria-hidden="true"
                className="ml-1 rounded border border-border-strong px-1.5 py-0.5 font-mono text-[10px]"
              >
                N
              </kbd>
            </Button>
          </div>
          {!parking.isActive ? (
            <p className="mt-6 border-t border-border pt-4 text-sm text-foreground-secondary">
              {es
                ? 'Reactivá esta cochera antes de aceptar nuevos ingresos.'
                : 'Reactivate this parking before accepting new check-ins.'}
            </p>
          ) : null}
        </section>

        <section
          className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 sm:p-8"
          aria-labelledby="capacity-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="type-label text-foreground-muted">{es ? 'Capacidad' : 'Capacity'}</p>
              <h2
                className="mt-3 font-display text-4xl font-bold leading-none tracking-[-0.06em] tabular-nums"
                id="capacity-title"
              >
                {occupancyQuery.isLoading
                  ? 'N/A'
                  : `${String(occupancy)} / ${String(parking.capacity)}`}
              </h2>
            </div>
            <span className="font-mono text-sm font-bold tabular-nums">{occupancyPercent}%</span>
          </div>
          {occupancyQuery.isError ? (
            <p className="mt-8 text-sm text-foreground-secondary">
              {es
                ? 'La ocupación no está disponible ahora.'
                : 'Occupancy is unavailable right now.'}
            </p>
          ) : (
            <>
              <div
                aria-label={`${String(occupancy)} of ${String(parking.capacity)} spaces occupied`}
                aria-valuemax={parking.capacity}
                aria-valuemin={0}
                aria-valuenow={occupancy}
                className="mt-8 h-3 overflow-hidden rounded-full bg-surface-emphasis"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${String(occupancyPercent)}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-foreground-secondary">
                {occupancyQuery.isLoading
                  ? 'Loading current capacity…'
                  : `${String(available)} spaces available`}
              </p>
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="active-sessions-title">
        <div className="flex flex-col justify-between gap-5 border-b border-border-strong pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="type-label text-foreground-muted">{es ? 'En la cochera' : 'On site'}</p>
            <h2
              className="mt-2 font-display text-3xl font-bold leading-none tracking-[-0.055em]"
              id="active-sessions-title"
            >
              {es ? 'Estadías activas' : 'Active sessions'}
            </h2>
          </div>
          <Button asChild className="self-start sm:self-auto" size="sm" variant="outline">
            <Link to={`/app/parkings/${parking.id}/sessions`}>
              <History aria-hidden="true" className="size-3.5" /> {es ? 'Historial' : 'History'}
            </Link>
          </Button>
        </div>

        <label className="relative mt-6 block max-w-md" htmlFor="active-session-plate">
          <span className="visually-hidden">{es ? 'Buscar patente' : 'Search plate'}</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground-muted"
          />
          <input
            className="h-12 w-full rounded-full border border-border bg-surface-subtle pl-11 pr-4 text-sm font-semibold text-foreground outline-none placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-focus-ring"
            id="active-session-plate"
            onChange={(event) => {
              setPlateSearch(event.target.value);
            }}
            placeholder={es ? 'Buscar patente, ej. AB123CD' : 'Search plate, e.g. AB123CD'}
            value={plateSearch}
          />
        </label>

        {activeSessionsQuery.isFetching && !activeSessionsQuery.isLoading ? (
          <p className="mt-3 type-label text-foreground-muted" role="status">
            Refreshing active sessions…
          </p>
        ) : null}

        <div className="mt-5">
          {activeSessionsQuery.isLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-28 rounded-[var(--radius-lg)]" />
              <Skeleton className="h-28 rounded-[var(--radius-lg)]" />
            </div>
          ) : activeSessionsQuery.isError ? (
            <ErrorState
              onRetry={() => {
                void activeSessionsQuery.refetch();
              }}
            >
              {es
                ? 'No pudimos cargar las estadías activas.'
                : 'We could not load active sessions.'}
            </ErrorState>
          ) : activeSessions?.length === 0 ? (
            <EmptyState
              action={
                parking.isActive ? (
                  <Button onClick={openCheckIn}>
                    {es ? 'Ingresar vehículo' : 'Check in vehicle'}
                  </Button>
                ) : undefined
              }
              title={es ? 'No hay estadías activas' : 'No active sessions'}
            >
              {es
                ? 'Ingresá un vehículo para comenzar a operar.'
                : 'Check in a vehicle to begin operations.'}
            </EmptyState>
          ) : (
            <div className="grid gap-3">
              {activeSessions?.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  timezone={parking.timezone}
                  to={`/app/sessions/${session.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Sheet
        description={
          es
            ? 'Registrá el ingreso de un vehículo a esta cochera.'
            : 'Record a vehicle entering this facility.'
        }
        onOpenChange={(open) => {
          setCheckInOpen(open && parking.isActive);
        }}
        open={parking.isActive && checkInOpen}
        title={es ? 'Ingresar vehículo' : 'Check in vehicle'}
      >
        <CheckInPanel
          error={checkInError}
          isSubmitting={checkInMutation.isPending}
          onSubmit={async (input) => {
            if (!parking.isActive) {
              setCheckInError(
                es
                  ? 'Reactivá esta cochera antes de aceptar nuevos ingresos.'
                  : 'Reactivate this parking before accepting new check-ins.',
              );
              return;
            }
            setCheckInError(undefined);
            try {
              const session = await checkInMutation.mutateAsync(input);
              await queryClient.invalidateQueries({ queryKey: ['active-sessions', parking.id] });
              await queryClient.invalidateQueries({ queryKey: ['parking-sessions', parking.id] });
              showToast(
                es ? `${session.vehicle.plate} ingresó.` : `${session.vehicle.plate} checked in.`,
              );
              setCheckInOpen(false);
            } catch (reason) {
              setCheckInError(
                reason instanceof Error
                  ? reason.message
                  : es
                    ? 'No pudimos iniciar esta estadía.'
                    : 'Unable to start this session.',
              );
            }
          }}
        />
      </Sheet>
    </section>
  );
}

function OwnerParkingOperationSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading parking operation">
      <Skeleton className="h-48 rounded-[var(--radius-xl)]" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Skeleton className="h-64 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-64 rounded-[var(--radius-xl)]" />
      </div>
      <Skeleton className="h-72 rounded-[var(--radius-xl)]" />
    </div>
  );
}
