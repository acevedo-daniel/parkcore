import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';

import { SessionHistoryRow } from '../../components/domain/session.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { Field, Input, Select } from '../../components/ui/field.js';
import { normalizePlate } from '../../lib/plate.js';
import { useDebouncedValue } from '../../lib/use-debounced-value.js';
import {
  getOwnedParkings,
  getParkingSessions,
  type ParkingSession,
} from '../../lib/api/owner-api.js';

type SessionFilter = 'ALL' | ParkingSession['status'];

export function OwnerParkingHistoryRoute() {
  const { parkingId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawStatus = searchParams.get('status');
  const filter: SessionFilter =
    rawStatus === 'ACTIVE' || rawStatus === 'COMPLETED' || rawStatus === 'CANCELLED'
      ? rawStatus
      : 'ALL';
  const urlPlate = normalizePlate(searchParams.get('plate') ?? '');
  const [plateInput, setPlateInput] = useState(urlPlate);
  const debouncedPlate = useDebouncedValue(normalizePlate(plateInput), 250);
  const updateSearch = (next: { page?: number; plate?: string; status?: SessionFilter }) => {
    const params = new URLSearchParams(searchParams);
    if (next.status === undefined || next.status === 'ALL') params.delete('status');
    else params.set('status', next.status);
    if (next.page === undefined || next.page <= 1) params.delete('page');
    else params.set('page', String(next.page));
    if (next.plate === undefined || next.plate.length === 0) params.delete('plate');
    else params.set('plate', next.plate);
    setSearchParams(params);
  };

  useEffect(() => {
    if (debouncedPlate === urlPlate) return;
    const params = new URLSearchParams(searchParams);
    if (debouncedPlate) params.set('plate', debouncedPlate);
    else params.delete('plate');
    params.delete('page');
    setSearchParams(params);
  }, [debouncedPlate, searchParams, setSearchParams, urlPlate]);
  const parkingsQuery = useQuery({ queryKey: ['owned-parkings'], queryFn: getOwnedParkings });
  const parking = parkingsQuery.data?.find((item) => item.id === parkingId);
  const sessionsQuery = useQuery({
    enabled: Boolean(parkingId),
    queryKey: ['parking-sessions', parkingId, filter, debouncedPlate, page],
    queryFn: () =>
      getParkingSessions(parkingId ?? '', {
        page,
        ...(filter === 'ALL' ? {} : { status: filter }),
        ...(debouncedPlate ? { plate: debouncedPlate } : {}),
      }),
    placeholderData: (previousData) => previousData,
  });

  if (parkingsQuery.isLoading || sessionsQuery.isLoading) {
    return <Skeleton className="owner-list-skeleton" />;
  }
  if (parkingsQuery.isError || sessionsQuery.isError || !parkingId) {
    return (
      <ErrorState
        onRetry={() => {
          void parkingsQuery.refetch();
          void sessionsQuery.refetch();
        }}
      >
        We could not load this parking history.
      </ErrorState>
    );
  }
  if (!parking) {
    return (
      <ErrorState title="Parking unavailable">
        This parking is not available in your account.
      </ErrorState>
    );
  }
  const sessions = sessionsQuery.data?.data ?? [];
  const pagination = sessionsQuery.data?.meta;

  return (
    <section className="owner-page stack-owner" aria-labelledby="history-title">
      <header className="owner-page-header">
        <div>
          <p className="type-label">{parking.title}</p>
          <h1 className="type-page-title" id="history-title">
            Session history
          </h1>
        </div>
        <Link className="button button-secondary" to={`/app/parkings/${parking.id}`}>
          Back to parking
        </Link>
      </header>
      <div className="history-controls">
        <Field htmlFor="session-plate" label="Search plate">
          <Input
            id="session-plate"
            onChange={(event) => {
              setPlateInput(event.target.value);
            }}
            placeholder="AB123CD"
            value={plateInput}
          />
        </Field>
        <Field htmlFor="session-status" label="Status">
          <Select
            id="session-status"
            value={filter}
            onChange={(event) => {
              updateSearch({
                page: 1,
                plate: debouncedPlate,
                status: event.target.value as SessionFilter,
              });
            }}
          >
            <option value="ALL">All sessions</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </Field>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void sessionsQuery.refetch();
          }}
        >
          Refresh
        </Button>
      </div>
      {sessionsQuery.isFetching ? (
        <p className="query-status" role="status">
          Refreshing history…
        </p>
      ) : null}
      {sessions.length === 0 ? (
        <EmptyState title="No sessions found">Try a different status filter.</EmptyState>
      ) : (
        <div className="session-history-list">
          {sessions.map((session) => (
            <SessionHistoryRow
              key={session.id}
              session={session}
              to={`/app/sessions/${session.id}`}
            />
          ))}
        </div>
      )}
      {pagination ? (
        <nav aria-label="Session history pagination" className="pagination-controls">
          <Button
            disabled={!pagination.hasPreviousPage}
            type="button"
            variant="secondary"
            onClick={() => {
              updateSearch({ page: pagination.page - 1, plate: debouncedPlate, status: filter });
            }}
          >
            Previous
          </Button>
          <span className="type-operational" aria-live="polite">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            disabled={!pagination.hasNextPage}
            type="button"
            variant="secondary"
            onClick={() => {
              updateSearch({ page: pagination.page + 1, plate: debouncedPlate, status: filter });
            }}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
