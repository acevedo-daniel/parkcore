import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import {
  Metric,
  OccupancyMeter,
  ParkingIdentity,
  RateDisplay,
} from '../../components/domain/parking.js';
import { SessionRow } from '../../components/domain/session.js';
import { ParkingStatus } from '../../components/domain/status.js';
import { Sheet } from '../../components/ui/dialog.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { useToast } from '../../components/ui/toast-context.js';
import { CheckInPanel } from '../../components/domain/check-in-panel.js';
import { checkIn, getActiveSessions, getOwnedParkings } from '../../lib/api/owner-api.js';

export function OwnerParkingOverviewRoute() {
  const { parkingId } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInError, setCheckInError] = useState<string>();
  const parkingsQuery = useQuery({ queryKey: ['owned-parkings'], queryFn: getOwnedParkings });
  const parking = parkingsQuery.data?.find((item) => item.id === parkingId);
  const activeSessionsQuery = useQuery({
    enabled: Boolean(parking),
    queryKey: ['active-sessions', parkingId],
    queryFn: () => getActiveSessions(parkingId ?? ''),
  });
  const checkInMutation = useMutation({
    mutationFn: (input: Parameters<typeof checkIn>[1]) => checkIn(parkingId ?? '', input),
  });

  if (parkingsQuery.isLoading) return <Skeleton className="owner-overview-skeleton" />;
  if (parkingsQuery.isError || !parkingId)
    return (
      <ErrorState
        onRetry={() => {
          void parkingsQuery.refetch();
        }}
      >
        We could not load this parking.
      </ErrorState>
    );
  if (!parking)
    return (
      <ErrorState title="Parking unavailable">
        This parking is not available in your account.
      </ErrorState>
    );
  const activeSessions = activeSessionsQuery.data;
  const openCheckIn = () => {
    if (parking.isActive) setCheckInOpen(true);
  };

  return (
    <section className="owner-page stack-owner" aria-labelledby="parking-overview-title">
      <header className="owner-parking-header">
        <div>
          <ParkingIdentity parking={parking} />
          <p className="type-operational">{parking.address}</p>
        </div>
        <div className="owner-header-actions">
          <ParkingStatus isActive={parking.isActive} />
          <Link
            aria-label={`Edit ${parking.title}`}
            className="button button-secondary"
            to={`/app/parkings/${parking.id}/edit`}
          >
            <Pencil aria-hidden="true" size={16} /> Edit
          </Link>
        </div>
      </header>
      <div className="owner-operation-actions">
        <Button disabled={!parking.isActive} onClick={openCheckIn}>
          <Plus aria-hidden="true" size={17} /> Check in
        </Button>
        {!parking.isActive ? (
          <p className="field-help">Reactivate this parking before accepting new check-ins.</p>
        ) : null}
      </div>
      <div className="owner-parking-overview-grid">
        <section className="owner-occupancy-section">
          <p className="type-label">Current occupancy</p>
          {activeSessionsQuery.isLoading ? (
            <Skeleton className="owner-occupancy-skeleton" />
          ) : activeSessionsQuery.isError ? (
            <p className="field-error">Unable to load occupancy.</p>
          ) : (
            <OccupancyMeter active={activeSessions?.length ?? 0} capacity={parking.capacity} />
          )}
        </section>
        <Metric label="Capacity" value={parking.capacity} />
        <RateDisplay currency={parking.currency} hourlyRateCents={parking.hourlyRateCents} />
      </div>
      <section className="active-sessions-section">
        <header className="section-header">
          <div>
            <p className="type-label">Current operation</p>
            <h2 className="type-section-title">Active sessions</h2>
          </div>
          <Link className="button button-secondary" to={`/app/parkings/${parking.id}/sessions`}>
            <History aria-hidden="true" size={16} /> History
          </Link>
        </header>
        {activeSessionsQuery.isFetching && !activeSessionsQuery.isLoading ? (
          <p className="query-status" role="status">
            Refreshing active sessions…
          </p>
        ) : null}
        {activeSessionsQuery.isLoading ? (
          <Skeleton className="owner-list-skeleton" />
        ) : activeSessionsQuery.isError ? (
          <ErrorState
            onRetry={() => {
              void activeSessionsQuery.refetch();
            }}
          >
            We could not load active sessions.
          </ErrorState>
        ) : activeSessions?.length === 0 ? (
          <EmptyState
            action={
              parking.isActive ? <Button onClick={openCheckIn}>Check in vehicle</Button> : undefined
            }
            title="No active sessions"
          >
            Check in a vehicle to begin operations.
          </EmptyState>
        ) : (
          <div className="owner-session-list">
            {activeSessions?.map((session) => (
              <SessionRow key={session.id} session={session} to={`/app/sessions/${session.id}`} />
            ))}
          </div>
        )}
      </section>
      <Sheet
        description="Record a vehicle entering this facility."
        onOpenChange={(open) => {
          setCheckInOpen(open && parking.isActive);
        }}
        open={parking.isActive && checkInOpen}
        title="Check in vehicle"
      >
        <CheckInPanel
          error={checkInError}
          isSubmitting={checkInMutation.isPending}
          onSubmit={async (input) => {
            if (!parking.isActive) {
              setCheckInError('Reactivate this parking before accepting new check-ins.');
              return;
            }
            setCheckInError(undefined);
            try {
              const session = await checkInMutation.mutateAsync(input);
              await queryClient.invalidateQueries({ queryKey: ['active-sessions', parking.id] });
              await queryClient.invalidateQueries({ queryKey: ['parking-sessions', parking.id] });
              showToast(`${session.vehicle.plate} checked in.`);
              setCheckInOpen(false);
            } catch (reason) {
              setCheckInError(
                reason instanceof Error ? reason.message : 'Unable to start this session.',
              );
            }
          }}
        />
      </Sheet>
    </section>
  );
}
