import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
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
  const { language } = useAppearance();
  const es = language === 'es';
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
        {es
          ? 'No pudimos cargar el historial de esta cochera.'
          : 'We could not load this parking history.'}
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
  const sessions = sessionsQuery.data?.data ?? [];
  const pagination = sessionsQuery.data?.meta;

  return (
    <section className="owner-page space-y-7" aria-labelledby="history-title">
      <header className="flex flex-col gap-5 border-b border-[#121417] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#6d695f]">
            {parking.title}
          </p>
          <h1
            className="mt-3 font-display text-4xl font-bold tracking-[-0.055em] text-[#121417] sm:text-5xl"
            id="history-title"
          >
            {es ? 'Historial de estadías' : 'Session history'}
          </h1>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#121417]/15 bg-white px-4 py-2 text-sm font-bold text-[#121417] transition-colors hover:bg-[#ffcc00]"
          to={`/app/parkings/${parking.id}`}
        >
          {es ? 'Volver a la cochera' : 'Back to parking'}
        </Link>
      </header>
      <div className="grid gap-4 rounded-[1.5rem] border border-[#121417]/12 bg-[#f5f5f5] p-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_auto] sm:p-6">
        <Field htmlFor="session-plate" label={es ? 'Buscar patente' : 'Search plate'}>
          <Input
            id="session-plate"
            onChange={(event) => {
              setPlateInput(event.target.value);
            }}
            placeholder="AB123CD"
            value={plateInput}
          />
        </Field>
        <Field htmlFor="session-status" label={es ? 'Estado' : 'Status'}>
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
            <option value="ALL">{es ? 'Todas las estadías' : 'All sessions'}</option>
            <option value="ACTIVE">{es ? 'Activas' : 'Active'}</option>
            <option value="COMPLETED">{es ? 'Finalizadas' : 'Completed'}</option>
            <option value="CANCELLED">{es ? 'Canceladas' : 'Cancelled'}</option>
          </Select>
        </Field>
        <Button
          className="self-end rounded-full"
          type="button"
          variant="secondary"
          onClick={() => {
            void sessionsQuery.refetch();
          }}
        >
          {es ? 'Actualizar' : 'Refresh'}
        </Button>
      </div>
      {sessionsQuery.isFetching ? (
        <p className="query-status" role="status">
          {es ? 'Actualizando historial…' : 'Refreshing history…'}
        </p>
      ) : null}
      {sessions.length === 0 ? (
        <EmptyState title={es ? 'No encontramos estadías' : 'No sessions found'}>
          {es ? 'Probá con otro estado o una patente distinta.' : 'Try a different status filter.'}
        </EmptyState>
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
        <nav
          aria-label={es ? 'Paginación del historial' : 'Session history pagination'}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-[#121417]/12 pt-5"
        >
          <Button
            disabled={!pagination.hasPreviousPage}
            type="button"
            variant="secondary"
            onClick={() => {
              updateSearch({ page: pagination.page - 1, plate: debouncedPlate, status: filter });
            }}
          >
            {es ? 'Anterior' : 'Previous'}
          </Button>
          <span className="type-operational" aria-live="polite">
            {es ? 'Página' : 'Page'} {pagination.page} {es ? 'de' : 'of'} {pagination.totalPages}
          </span>
          <Button
            disabled={!pagination.hasNextPage}
            type="button"
            variant="secondary"
            onClick={() => {
              updateSearch({ page: pagination.page + 1, plate: debouncedPlate, status: filter });
            }}
          >
            {es ? 'Siguiente' : 'Next'}
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
