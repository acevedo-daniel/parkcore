import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, History, MapPin, Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { CheckInPanel } from '../../components/domain/check-in-panel.js';
import { CheckInSuccess } from '../../components/domain/check-in-success.js';
import { OccupancyMeter } from '../../components/domain/parking.js';
import { SessionRow } from '../../components/domain/session.js';
import { AvailabilityIndicator } from '../../components/domain/availability-indicator.js';
import { PageHeader } from '../../components/domain/page-header.js';
import { Button } from '../../components/ui/button.js';
import { Sheet } from '../../components/ui/dialog.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { useToast } from '../../components/ui/toast-context.js';
import { localizeApiError } from '../../lib/api/api-error.js';
import {
  checkIn,
  getActiveSessions,
  getOwnedParkings,
  type ParkingSession,
} from '../../lib/api/owner-api.js';
import { normalizePlate } from '../../lib/plate.js';
import { useDebouncedValue } from '../../lib/use-debounced-value.js';

export function OwnerParkingOverviewRoute() {
  const { t } = useAppearance();
  const { parkingId } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInError, setCheckInError] = useState<string>();
  const [checkInSuccess, setCheckInSuccess] = useState<ParkingSession>();
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
        {t('parkingOperation.loadError')}
      </ErrorState>
    );
  }
  if (!parking) {
    return (
      <ErrorState title={t('parkingOperation.unavailableTitle')}>
        {t('api.parkingUnavailable')}
      </ErrorState>
    );
  }

  const activeSessions = activeSessionsQuery.data;
  const occupancy = occupancyQuery.data?.length ?? 0;
  const openCheckIn = () => {
    if (parking.isActive) setCheckInOpen(true);
  };

  return (
    <section className="owner-page space-y-9" aria-labelledby="parking-overview-title">
      <PageHeader
        actions={
          <>
            <AvailabilityIndicator state={parking.isActive ? 'AVAILABLE' : 'PAUSED'} />
            <Button asChild size="sm" variant="outline">
              <Link
                aria-label={t('parkingOperation.editAria', { title: parking.title })}
                to={`/app/parkings/${parking.id}/edit`}
              >
                <Pencil aria-hidden="true" className="size-3.5" /> {t('parkingOperation.edit')}
              </Link>
            </Button>
          </>
        }
        backAction={
          <Link
            className="inline-flex items-center gap-1 text-sm font-bold underline decoration-accent decoration-4 underline-offset-4"
            to="/app/parkings"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            {t('parkingOperation.allFacilities')}
          </Link>
        }
        description={
          <span className="flex items-start gap-2">
            <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" />
            {parking.address}
          </span>
        }
        eyebrow={t('parkingOperation.eyebrow')}
        id="parking-overview-title"
        title={parking.title}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <section
          className="rounded-[var(--radius-xl)] border border-border bg-surface-emphasis p-6 text-foreground sm:p-8"
          aria-labelledby="check-in-title"
        >
          <p className="type-label text-foreground-muted">{t('parkingOperation.arrivals')}</p>
          <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h2
                className="font-display text-3xl font-bold leading-none tracking-[-0.055em]"
                id="check-in-title"
              >
                {t('parkingOperation.ready')}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-foreground-secondary">
                {t('parkingOperation.readyDescription')}
              </p>
            </div>
            <Button disabled={!parking.isActive} onClick={openCheckIn}>
              <Plus aria-hidden="true" className="size-4" /> {t('parkingOperation.checkIn')}{' '}
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
              {t('parkingOperation.reactivate')}
            </p>
          ) : null}
        </section>

        <section
          className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 sm:p-8"
          aria-labelledby="capacity-title"
        >
          <p className="type-label text-foreground-muted" id="capacity-title">
            {t('parkingOperation.capacity')}
          </p>
          {occupancyQuery.isError ? (
            <p className="mt-8 text-sm text-foreground-secondary">
              {t('parkingOperation.occupancyUnavailable')}
            </p>
          ) : occupancyQuery.isLoading ? (
            <p className="mt-8 text-sm text-foreground-secondary" role="status">
              {t('parkingOperation.loadingCapacity')}
            </p>
          ) : (
            <div className="mt-5">
              <OccupancyMeter active={occupancy} capacity={parking.capacity} compact />
            </div>
          )}
        </section>
      </div>

      {checkInSuccess ? (
        <CheckInSuccess
          onCheckInAnother={() => {
            setCheckInSuccess(undefined);
            setCheckInError(undefined);
            setCheckInOpen(true);
          }}
          parkingTitle={parking.title}
          session={checkInSuccess}
          timezone={parking.timezone}
          to={`/app/sessions/${checkInSuccess.id}`}
        />
      ) : null}

      <section aria-labelledby="active-sessions-title">
        <div className="flex flex-col justify-between gap-5 border-b border-border-strong pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="type-label text-foreground-muted">{t('parkingOperation.onSite')}</p>
            <h2
              className="mt-2 font-display text-3xl font-bold leading-none tracking-[-0.055em]"
              id="active-sessions-title"
            >
              {t('parkingOperation.activeSessions')}
            </h2>
          </div>
          <Button asChild className="self-start sm:self-auto" size="sm" variant="outline">
            <Link to={`/app/parkings/${parking.id}/sessions`}>
              <History aria-hidden="true" className="size-3.5" /> {t('parkingOperation.history')}
            </Link>
          </Button>
        </div>

        <label className="relative mt-6 block max-w-md" htmlFor="active-session-plate">
          <span className="visually-hidden">{t('parkingOperation.searchPlate')}</span>
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
            placeholder={t('parkingOperation.searchPlatePlaceholder')}
            value={plateSearch}
          />
        </label>

        {activeSessionsQuery.isFetching && !activeSessionsQuery.isLoading ? (
          <p className="mt-3 type-label text-foreground-muted" role="status">
            {t('parkingOperation.refreshingActiveSessions')}
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
              {t('api.loadActiveSessions')}
            </ErrorState>
          ) : activeSessions?.length === 0 ? (
            <EmptyState
              action={
                parking.isActive ? (
                  <Button onClick={openCheckIn}>{t('parkingOperation.checkInVehicle')}</Button>
                ) : undefined
              }
              title={t('parkingOperation.noActiveSessions')}
            >
              {t('parkingOperation.noActiveSessionsDescription')}
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
        description={t('parkingOperation.sheetDescription')}
        onOpenChange={(open) => {
          setCheckInOpen(open && parking.isActive);
        }}
        open={parking.isActive && checkInOpen}
        title={t('parkingOperation.checkInVehicle')}
      >
        <CheckInPanel
          error={checkInError}
          isSubmitting={checkInMutation.isPending}
          onSubmit={async (input) => {
            if (!parking.isActive) {
              setCheckInError(t('parkingOperation.checkInInactive'));
              return;
            }
            setCheckInError(undefined);
            try {
              const session = await checkInMutation.mutateAsync(input);
              await queryClient.invalidateQueries({ queryKey: ['active-sessions', parking.id] });
              await queryClient.invalidateQueries({ queryKey: ['parking-sessions', parking.id] });
              setCheckInSuccess(session);
              showToast(t('parkingOperation.checkInSuccess', { plate: session.vehicle.plate }));
              setCheckInOpen(false);
            } catch (reason) {
              setCheckInError(localizeApiError(reason, t, 'api.startSession'));
            }
          }}
        />
      </Sheet>
    </section>
  );
}

function OwnerParkingOperationSkeleton() {
  const { t } = useAppearance();
  return (
    <div className="space-y-8" aria-label={t('parkingOperation.loading')}>
      <Skeleton className="h-48 rounded-[var(--radius-xl)]" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Skeleton className="h-64 rounded-[var(--radius-xl)]" />
        <Skeleton className="h-64 rounded-[var(--radius-xl)]" />
      </div>
      <Skeleton className="h-72 rounded-[var(--radius-xl)]" />
    </div>
  );
}
