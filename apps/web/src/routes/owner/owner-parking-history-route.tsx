import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { PageHeader } from '../../components/domain/page-header.js';
import { SessionHistoryRow } from '../../components/domain/session.js';
import { Button } from '../../components/ui/button.js';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { Field, Input, Select } from '../../components/ui/field.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import {
  getOwnedParkings,
  getParkingSessions,
  getParkingSessionsCsv,
  type ParkingSession,
  type ParkingSessionFilter,
} from '../../lib/api/owner-api.js';
import { normalizePlate } from '../../lib/plate.js';
import { useDebouncedValue } from '../../lib/use-debounced-value.js';
import {
  parkingHistorySearchParamsFromState,
  parseParkingHistoryUrlState,
  type ParkingHistoryUrlState,
} from './parking-history-query.js';

type SessionFilter = 'ALL' | ParkingSession['status'];
type ExportStatus = 'idle' | 'pending' | 'success' | 'error';
type ExportResult = { key: string; status: Exclude<ExportStatus, 'idle'> } | null;
type HistorySearchUpdater = (changes: Partial<ParkingHistoryUrlState>, replace?: boolean) => void;

function toSessionFilter(state: ParkingHistoryUrlState): ParkingSessionFilter {
  return {
    period: state.period,
    ...(state.status ? { status: state.status } : {}),
    ...(state.plate ? { plate: state.plate } : {}),
  };
}

export function OwnerParkingHistoryRoute() {
  const { locale, t } = useAppearance();
  const { parkingId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const historyState = useMemo(() => parseParkingHistoryUrlState(searchParams), [searchParams]);
  const canonicalSearchParams = useMemo(
    () => parkingHistorySearchParamsFromState(historyState),
    [historyState],
  );
  const rawSearch = searchParams.toString();
  const canonicalSearch = canonicalSearchParams.toString();
  const [exportResult, setExportResult] = useState<ExportResult>(null);

  useEffect(() => {
    if (rawSearch === canonicalSearch) return;
    setSearchParams(canonicalSearchParams, { replace: true });
  }, [canonicalSearch, canonicalSearchParams, rawSearch, setSearchParams]);

  const updateSearch = useCallback(
    (changes: Partial<ParkingHistoryUrlState>, replace = false) => {
      setSearchParams(parkingHistorySearchParamsFromState({ ...historyState, ...changes }), {
        replace,
      });
    },
    [historyState, setSearchParams],
  );

  const parkingsQuery = useQuery({ queryKey: ['owned-parkings'], queryFn: getOwnedParkings });
  const parking = parkingsQuery.data?.find((item) => item.id === parkingId);
  const sessionFilter = useMemo<ParkingSessionFilter>(
    () => toSessionFilter(historyState),
    [historyState],
  );
  const sessionsQuery = useQuery({
    enabled: Boolean(parkingId),
    queryKey: ['parking-sessions', parkingId, historyState.page, sessionFilter],
    queryFn: () =>
      getParkingSessions(parkingId ?? '', {
        page: historyState.page,
        ...sessionFilter,
      }),
  });
  const exportStatus: ExportStatus =
    exportResult?.key === canonicalSearch ? exportResult.status : 'idle';

  const exportHistory = async () => {
    if (!parkingId || exportStatus === 'pending') return;
    setExportResult({ key: canonicalSearch, status: 'pending' });
    try {
      const csv = await getParkingSessionsCsv(parkingId, sessionFilter);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${parking?.title ?? 'parking'}-history.csv`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setExportResult({ key: canonicalSearch, status: 'success' });
    } catch {
      setExportResult({ key: canonicalSearch, status: 'error' });
    }
  };

  if (parkingsQuery.isLoading || sessionsQuery.isLoading) {
    return (
      <section aria-labelledby="history-loading-title" className="owner-page space-y-6">
        <h1 className="visually-hidden" id="history-loading-title">
          {t('parkingHistory.title')}
        </h1>
        <p className="visually-hidden" role="status">
          {t('parkingHistory.loading')}
        </p>
        <Skeleton className="owner-list-skeleton" />
      </section>
    );
  }
  if (
    !parkingId ||
    (parkingsQuery.isError && parkingsQuery.data === undefined) ||
    (sessionsQuery.isError && sessionsQuery.data === undefined)
  ) {
    return (
      <section aria-labelledby="history-error-title" className="owner-page">
        <h1 className="visually-hidden" id="history-error-title">
          {t('parkingHistory.title')}
        </h1>
        <ErrorState
          onRetry={() => {
            void parkingsQuery.refetch();
            void sessionsQuery.refetch();
          }}
        >
          {t('api.loadParkingHistory')}
        </ErrorState>
      </section>
    );
  }
  if (!parking) {
    return (
      <section aria-labelledby="history-unavailable-title" className="owner-page">
        <h1 className="visually-hidden" id="history-unavailable-title">
          {t('parkingHistory.title')}
        </h1>
        <ErrorState title={t('parkingOperation.unavailableTitle')}>
          {t('api.parkingUnavailable')}
        </ErrorState>
      </section>
    );
  }

  const sessions = sessionsQuery.data?.data ?? [];
  const pagination = sessionsQuery.data?.meta;
  const aggregate = sessionsQuery.data?.aggregate;
  const historyTimezone = sessionsQuery.data?.timezone ?? parking.timezone;
  const exporting = exportStatus === 'pending';
  const hasStaleData = parkingsQuery.isError || sessionsQuery.isError;

  return (
    <section aria-labelledby="history-title" className="owner-page space-y-7">
      <PageHeader
        actions={
          <Button
            aria-busy={exporting}
            aria-describedby={exportStatus === 'pending' ? 'history-export-status' : undefined}
            disabled={exporting}
            onClick={() => void exportHistory()}
            variant="outline"
          >
            {exporting ? t('parkingHistory.exporting') : t('parkingHistory.export')}
          </Button>
        }
        backAction={
          <Link
            className="inline-flex min-h-[var(--touch-target-min)] items-center gap-1 text-sm font-bold underline decoration-accent decoration-4 underline-offset-4"
            to={`/app/parkings/${parking.id}`}
          >
            {t('parkingHistory.backToParking')}
          </Link>
        }
        description={t('parkingHistory.description')}
        eyebrow={parking.title}
        id="history-title"
        title={t('parkingHistory.title')}
      />

      <div className="flex flex-col gap-2 border-b border-border-subtle pb-5 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="type-label text-foreground-muted">{t('parkingHistory.timezone')}</p>
          <p className="mt-1 type-operational">{historyTimezone}</p>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-foreground-secondary">
          {t('parkingHistory.timezoneDescription', { timezone: historyTimezone })}
        </p>
      </div>

      <HistoryFilters
        key={historyState.plate ?? ''}
        historyState={historyState}
        isFetching={sessionsQuery.isFetching}
        onRefresh={() => {
          void sessionsQuery.refetch();
        }}
        updateSearch={updateSearch}
      />

      {hasStaleData ? (
        <div
          className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-warning-foreground bg-warning-surface p-4 text-warning-text sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="break-words text-sm font-semibold">{t('parkingHistory.stale')}</p>
          <Button
            className="shrink-0 self-start sm:self-auto"
            onClick={() => {
              void parkingsQuery.refetch();
              void sessionsQuery.refetch();
            }}
            type="button"
            variant="secondary"
          >
            {t('parkingHistory.retryStale')}
          </Button>
        </div>
      ) : null}

      {exportStatus === 'pending' || exportStatus === 'success' ? (
        <p
          aria-live="polite"
          className="text-sm font-semibold text-foreground-secondary"
          id="history-export-status"
          role="status"
        >
          {exportStatus === 'pending'
            ? t('parkingHistory.exporting')
            : t('parkingHistory.exported')}
        </p>
      ) : null}
      {exportStatus === 'error' ? (
        <div
          aria-live="assertive"
          className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-danger-foreground bg-danger-surface p-4 text-danger-text sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="text-sm font-semibold">{t('parkingHistory.exportError')}</p>
          <Button onClick={() => void exportHistory()} type="button" variant="secondary">
            {t('parkingHistory.retryExport')}
          </Button>
        </div>
      ) : null}

      {aggregate ? (
        <section
          aria-labelledby="history-summary-title"
          className="border-b border-border-subtle pb-7"
        >
          <h2 className="type-label text-foreground-muted" id="history-summary-title">
            {t('parkingHistory.summary')}
          </h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <HistoryMetric
              label={t('parkingHistory.total')}
              value={formatNumber(aggregate.totalSessions, locale)}
            />
            <HistoryMetric
              label={t('parkingHistory.activeCount')}
              value={formatNumber(aggregate.activeSessions, locale)}
            />
            <HistoryMetric
              label={t('parkingHistory.completedCount')}
              value={formatNumber(aggregate.completedSessions, locale)}
            />
            <HistoryMetric
              label={t('parkingHistory.cancelledCount')}
              value={formatNumber(aggregate.cancelledSessions, locale)}
            />
            <HistoryMetric
              label={t('parkingHistory.revenue')}
              value={
                aggregate.revenueByCurrency.length > 0 ? (
                  <span className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
                    {aggregate.revenueByCurrency.map(({ currency, revenueCents }) => (
                      <span className="min-w-0 break-words" key={currency}>
                        {formatMoney(revenueCents, currency, locale)}
                      </span>
                    ))}
                  </span>
                ) : (
                  t('parkingHistory.noRevenue')
                )
              }
            />
          </dl>
        </section>
      ) : null}

      {sessionsQuery.isFetching ? (
        <p className="query-status" role="status">
          {t('parkingHistory.refreshing')}
        </p>
      ) : null}

      <section aria-labelledby="history-results-title">
        <div className="flex items-baseline justify-between gap-4 border-b border-border-subtle pb-4">
          <h2 className="type-label text-foreground-muted" id="history-results-title">
            {t('parkingHistory.results')}
          </h2>
        </div>
        {sessions.length === 0 ? (
          <div className="mt-5">
            <EmptyState title={t('parkingHistory.emptyTitle')}>
              {t('parkingHistory.emptyDescription')}
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="mt-4 hidden grid-cols-[minmax(10rem,1.25fr)_minmax(9rem,1fr)_minmax(7rem,0.9fr)_minmax(8rem,auto)_auto] gap-x-4 border-b border-border-subtle px-1 py-3 md:grid">
              <span className="type-label text-foreground-muted">{t('session.plate')}</span>
              <span className="type-label text-foreground-muted">{t('session.date')}</span>
              <span className="type-label text-foreground-muted">{t('session.elapsed')}</span>
              <span className="type-label text-foreground-muted">{t('parkingHistory.status')}</span>
              <span className="type-label text-right text-foreground-muted">
                {t('session.total')}
              </span>
            </div>
            <ul className="session-history-list m-0 list-none p-0">
              {sessions.map((session) => (
                <li key={session.id}>
                  <SessionHistoryRow
                    session={session}
                    timezone={historyTimezone}
                    to={`/app/sessions/${session.id}`}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {pagination ? (
        <nav
          aria-label={t('parkingHistory.pagination')}
          className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5"
        >
          <Button
            disabled={!pagination.hasPreviousPage}
            onClick={() => {
              updateSearch({ page: pagination.page - 1 });
            }}
            type="button"
            variant="secondary"
          >
            {t('parkingHistory.previous')}
          </Button>
          <span aria-live="polite" className="type-operational">
            {t('parkingHistory.page')} {formatNumber(pagination.page, locale)}{' '}
            {t('parkingHistory.of')} {formatNumber(Math.max(1, pagination.totalPages), locale)}
          </span>
          <Button
            disabled={!pagination.hasNextPage}
            onClick={() => {
              updateSearch({ page: pagination.page + 1 });
            }}
            type="button"
            variant="secondary"
          >
            {t('parkingHistory.next')}
          </Button>
        </nav>
      ) : null}
    </section>
  );
}

function HistoryMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="type-label text-foreground-muted">{label}</dt>
      <dd className="mt-2 min-w-0 break-words type-metric">{value}</dd>
    </div>
  );
}

function HistoryFilters({
  historyState,
  isFetching,
  onRefresh,
  updateSearch,
}: {
  historyState: ParkingHistoryUrlState;
  isFetching: boolean;
  onRefresh: () => void;
  updateSearch: HistorySearchUpdater;
}) {
  const { t } = useAppearance();
  const [plateInput, setPlateInput] = useState(historyState.plate ?? '');
  const debouncedPlate = useDebouncedValue(normalizePlate(plateInput), 250);

  useEffect(() => {
    if (debouncedPlate === (historyState.plate ?? '')) return;
    updateSearch({ page: 1, plate: debouncedPlate || undefined });
  }, [debouncedPlate, historyState.plate, updateSearch]);

  return (
    <section aria-labelledby="history-filters-title" className="border-b border-border-subtle pb-7">
      <h2 className="type-label text-foreground-muted" id="history-filters-title">
        {t('parkingHistory.filters')}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]">
        <Field htmlFor="session-plate" label={t('parkingHistory.plate')}>
          <Input
            id="session-plate"
            onChange={(event) => {
              setPlateInput(event.target.value);
            }}
            placeholder={t('parkingHistory.platePlaceholder')}
            value={plateInput}
          />
        </Field>
        <Field htmlFor="session-status" label={t('parkingHistory.status')}>
          <Select
            id="session-status"
            value={historyState.status ?? 'ALL'}
            onChange={(event) => {
              const value = event.target.value as SessionFilter;
              updateSearch({ page: 1, status: value === 'ALL' ? undefined : value });
            }}
          >
            <option value="ALL">{t('parkingHistory.allStatuses')}</option>
            <option value="ACTIVE">{t('parkingHistory.active')}</option>
            <option value="COMPLETED">{t('parkingHistory.completed')}</option>
            <option value="CANCELLED">{t('parkingHistory.cancelled')}</option>
          </Select>
        </Field>
        <Field htmlFor="session-period" label={t('parkingHistory.period')}>
          <Select
            id="session-period"
            value={historyState.period}
            onChange={(event) => {
              updateSearch({
                page: 1,
                period: event.target.value as ParkingHistoryUrlState['period'],
              });
            }}
          >
            <option value="today">{t('parkingHistory.today')}</option>
            <option value="7d">{t('parkingHistory.sevenDays')}</option>
            <option value="30d">{t('parkingHistory.thirtyDays')}</option>
          </Select>
        </Field>
        <Button
          aria-busy={isFetching}
          className="self-end rounded-full"
          disabled={isFetching}
          onClick={onRefresh}
          type="button"
          variant="secondary"
        >
          {isFetching ? t('parkingHistory.refreshing') : t('parkingHistory.refresh')}
        </Button>
      </div>
    </section>
  );
}
