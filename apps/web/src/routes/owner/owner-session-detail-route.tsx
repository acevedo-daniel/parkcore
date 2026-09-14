import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Check, ChevronLeft, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Plate } from '../../components/domain/plate.js';
import {
  CheckoutSummary,
  OperationalCancellation,
  OperationalReceipt,
  OperationalTimestamp,
} from '../../components/domain/session.js';
import { SessionStatus } from '../../components/domain/status.js';
import { Button } from '../../components/ui/button.js';
import { Dialog } from '../../components/ui/dialog.js';
import { ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { useToast } from '../../components/ui/toast-context.js';
import {
  ApiError,
  getApiErrorCode,
  localizeApiError,
  type ApiErrorCodeMessages,
} from '../../lib/api/api-error.js';
import {
  cancelParkingSession,
  checkOut,
  getOwnedParkings,
  getParkingSession,
  type ParkingSession,
} from '../../lib/api/owner-api.js';
import { formatMoney } from '../../lib/format.js';
import type { Locale, Translator } from '../../lib/localization.js';
import { invalidateOwnerMutationQueries } from '../../lib/query-invalidation.js';

const sessionErrorMessages: ApiErrorCodeMessages = {
  SESSION_NOT_ACTIVE: 'session.stateChanged',
};

function isSessionStateConflict(error: unknown) {
  return (
    getApiErrorCode(error) === 'SESSION_NOT_ACTIVE' ||
    (error instanceof ApiError && error.status === 409)
  );
}

export function OwnerSessionDetailRoute() {
  const { locale, t } = useAppearance();
  const { sessionId } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionError, setActionError] = useState<string>();
  const [resolvedSession, setResolvedSession] = useState<ParkingSession>();
  const sessionQuery = useQuery({
    enabled: Boolean(sessionId),
    queryKey: ['parking-session', sessionId],
    queryFn: () => getParkingSession(sessionId ?? ''),
  });
  const parkingsQuery = useQuery({ queryKey: ['owned-parkings'], queryFn: getOwnedParkings });
  const checkoutMutation = useMutation({ mutationFn: () => checkOut(sessionId ?? '') });
  const cancelMutation = useMutation({ mutationFn: () => cancelParkingSession(sessionId ?? '') });

  if (sessionQuery.isLoading || parkingsQuery.isLoading) return <SessionDetailSkeleton />;
  if (sessionQuery.isError || !sessionId) {
    return (
      <ErrorState
        onRetry={() => {
          void sessionQuery.refetch();
          void parkingsQuery.refetch();
        }}
      >
        {t('api.loadSession')}
      </ErrorState>
    );
  }
  if (parkingsQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void sessionQuery.refetch();
          void parkingsQuery.refetch();
        }}
      >
        {t('api.loadParkings')}
      </ErrorState>
    );
  }
  const session = resolvedSession ?? sessionQuery.data;
  if (!session) {
    return (
      <ErrorState title={t('api.sessionUnavailable')}>{t('api.sessionUnavailable')}</ErrorState>
    );
  }
  const parking = parkingsQuery.data?.find((item) => item.id === session.parkingId);
  if (!parking) {
    return (
      <ErrorState
        onRetry={() => {
          void sessionQuery.refetch();
          void parkingsQuery.refetch();
        }}
        title={t('parkingOperation.unavailableTitle')}
      >
        {t('api.parkingUnavailable')}
      </ErrorState>
    );
  }
  const canOperate = session.status === 'ACTIVE';

  const refreshOperation = async () => {
    await invalidateOwnerMutationQueries(queryClient, {
      parking,
      parkingId: session.parkingId,
      sessionId: session.id,
    });
  };
  const reconcileStateConflict = async () => {
    const [freshSession] = await Promise.all([
      sessionQuery.refetch().catch(() => undefined),
      parkingsQuery.refetch().catch(() => undefined),
    ]);
    if (freshSession?.data) setResolvedSession(freshSession.data);
    setCheckoutOpen(false);
    setCancelOpen(false);
  };
  const handleActionError = async (
    reason: unknown,
    fallback: 'api.checkoutSession' | 'api.cancelSession',
  ) => {
    if (isSessionStateConflict(reason)) await reconcileStateConflict();
    setActionError(localizeApiError(reason, t, fallback, {}, sessionErrorMessages));
  };
  const completeCheckout = async () => {
    setActionError(undefined);
    try {
      const completedSession = await checkoutMutation.mutateAsync();
      setResolvedSession(completedSession);
      showToast(t('session.checkedOut'));
      setCheckoutOpen(false);
      await refreshOperation().catch(() => undefined);
    } catch (reason) {
      await handleActionError(reason, 'api.checkoutSession');
    }
  };
  const cancelSession = async () => {
    setActionError(undefined);
    try {
      const cancelledSession = await cancelMutation.mutateAsync();
      setResolvedSession(cancelledSession);
      showToast(t('session.cancelled'));
      setCancelOpen(false);
      await refreshOperation().catch(() => undefined);
    } catch (reason) {
      await handleActionError(reason, 'api.cancelSession');
    }
  };

  return (
    <section className="owner-page space-y-9" aria-labelledby="session-detail-title">
      <header className="border-b border-border-strong pb-7">
        <Link
          className="inline-flex items-center gap-1 text-sm font-bold underline decoration-accent decoration-4 underline-offset-4"
          to={`/app/parkings/${session.parkingId}`}
        >
          <ChevronLeft aria-hidden="true" className="size-4" /> {t('session.operation')}
        </Link>
        <div className="mt-7 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="type-label text-foreground-muted">
              {getSessionStateTitle(session.status, t)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Plate plate={session.vehicle.plate} />
              <SessionStatus status={session.status} />
            </div>
            <h1
              className="mt-5 font-display text-4xl font-bold leading-[0.92] tracking-[-0.065em] sm:text-5xl"
              id="session-detail-title"
            >
              {getVehicleTypeLabel(session.vehicle.type, t)}
            </h1>
          </div>
          {canOperate ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setActionError(undefined);
                  setCheckoutOpen(true);
                }}
              >
                <Check aria-hidden="true" className="size-4" /> {t('session.checkOut')}
              </Button>
              <Button
                onClick={() => {
                  setActionError(undefined);
                  setCancelOpen(true);
                }}
                variant="danger"
              >
                <Ban aria-hidden="true" className="size-4" /> {t('session.cancel')}
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <DetailCard
          entries={[
            [t('session.type'), getVehicleTypeLabel(session.vehicle.type, t)],
            [t('session.brand'), session.vehicle.brand ?? t('common.notAvailable')],
            [t('session.model'), session.vehicle.model ?? t('common.notAvailable')],
          ]}
          title={t('session.vehicle')}
        />
        <DetailCard
          entries={[
            [t('session.customer'), session.customerName ?? t('common.notAvailable')],
            [t('session.phone'), session.customerPhone ?? t('common.notAvailable')],
            [t('session.notes'), session.notes ?? t('common.notAvailable')],
          ]}
          title={t('session.visit')}
        />
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="type-label text-foreground-muted">{t('session.parking')}</p>
          <dl className="mt-5 space-y-4">
            <DetailItem label={t('session.facility')}>
              <Link
                className="font-bold underline decoration-accent decoration-4 underline-offset-4"
                to={`/app/parkings/${parking.id}`}
              >
                {parking.title}
              </Link>
            </DetailItem>
            <DetailItem label={t('session.address')}>
              <span className="flex items-start gap-1.5">
                <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                {parking.address}
              </span>
            </DetailItem>
            <DetailItem label={t('session.started')}>
              <OperationalTimestamp value={session.startTime} timezone={parking.timezone} />
            </DetailItem>
            <DetailItem label={t('session.rateSnapshot')}>
              {formatMoney(session.hourlyRateCents, session.currency, locale)} /{' '}
              {t('session.perHourShort')}
            </DetailItem>
            <DetailItem label={t('session.total')}>
              {formatSessionTotal(session, t, locale)}
            </DetailItem>
          </dl>
        </section>
      </div>

      {session.status === 'COMPLETED' ? (
        <OperationalReceipt
          historyHref={`/app/parkings/${parking.id}/sessions`}
          parkingHref={`/app/parkings/${parking.id}`}
          parkingTitle={parking.title}
          session={session}
          timezone={parking.timezone}
        />
      ) : null}
      {session.status === 'CANCELLED' ? (
        <OperationalCancellation
          historyHref={`/app/parkings/${parking.id}/sessions`}
          parkingHref={`/app/parkings/${parking.id}`}
          parkingTitle={parking.title}
          session={session}
          timezone={parking.timezone}
        />
      ) : null}

      {actionError && !checkoutOpen && !cancelOpen ? <ActionError message={actionError} /> : null}

      <Dialog
        closeLabel={t('session.checkoutClose')}
        description={t('session.checkoutDescription')}
        onOpenChange={setCheckoutOpen}
        open={checkoutOpen}
        title={t('session.checkoutTitle')}
      >
        <div className="space-y-5 pt-6">
          <div className="flex items-center justify-between gap-4">
            <Plate plate={session.vehicle.plate} />
            <span className="text-sm font-semibold text-foreground-secondary">
              {getVehicleTypeLabel(session.vehicle.type, t)}
            </span>
          </div>
          <CheckoutSummary session={session} timezone={parking.timezone} />
          {actionError ? <ActionError message={actionError} /> : null}
          <Button
            disabled={checkoutMutation.isPending}
            fullWidth
            onClick={() => void completeCheckout()}
          >
            {checkoutMutation.isPending ? t('session.completing') : t('session.completeCheckout')}
          </Button>
        </div>
      </Dialog>

      <Dialog
        closeLabel={t('session.cancelClose')}
        description={t('session.cancelDescription', { plate: session.vehicle.plate })}
        onOpenChange={setCancelOpen}
        open={cancelOpen}
        title={t('session.cancelTitle')}
      >
        <div className="space-y-5 pt-6">
          <Plate plate={session.vehicle.plate} />
          <p className="border-l-4 border-accent pl-4 text-sm leading-relaxed text-foreground-secondary">
            {t('session.availableAfterCancel')}
          </p>
          {actionError ? <ActionError message={actionError} /> : null}
          <Button
            disabled={cancelMutation.isPending}
            fullWidth
            onClick={() => void cancelSession()}
          >
            {cancelMutation.isPending ? t('session.cancelling') : t('session.cancel')}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

function getSessionStateTitle(status: ParkingSession['status'], translate: Translator) {
  return status === 'ACTIVE'
    ? translate('session.activeTitle')
    : status === 'COMPLETED'
      ? translate('session.completedTitle')
      : translate('session.cancelledTitle');
}

function getVehicleTypeLabel(type: ParkingSession['vehicle']['type'], translate: Translator) {
  return type === 'CAR'
    ? translate('checkIn.car')
    : type === 'MOTORCYCLE'
      ? translate('checkIn.motorcycle')
      : translate('checkIn.largeVehicle');
}

function formatSessionTotal(session: ParkingSession, translate: Translator, locale: Locale) {
  if (session.status === 'CANCELLED') return translate('session.notCharged');
  if (session.totalAmountCents === null) {
    return translate('session.pendingCheckout');
  }
  return formatMoney(session.totalAmountCents, session.currency, locale);
}

function ActionError({ message }: { message: string }) {
  return (
    <p
      className="rounded-[var(--radius-md)] border border-danger-foreground bg-danger-surface p-3 text-sm font-semibold text-danger-text"
      role="alert"
    >
      {message}
    </p>
  );
}

function DetailCard({ entries, title }: { entries: [string, string][]; title: string }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <p className="type-label text-foreground-muted">{title}</p>
      <dl className="mt-5 space-y-4">
        {entries.map(([label, value]) => (
          <DetailItem key={label} label={label}>
            {value}
          </DetailItem>
        ))}
      </dl>
    </section>
  );
}

function DetailItem({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <dt className="type-label text-foreground-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-relaxed">{children}</dd>
    </div>
  );
}

function SessionDetailSkeleton() {
  const { t } = useAppearance();
  return (
    <div className="space-y-8" aria-label={t('api.loadSession')}>
      <Skeleton className="h-56 rounded-[var(--radius-xl)]" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-[var(--radius-lg)]" />
        <Skeleton className="h-64 rounded-[var(--radius-lg)]" />
        <Skeleton className="h-64 rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
