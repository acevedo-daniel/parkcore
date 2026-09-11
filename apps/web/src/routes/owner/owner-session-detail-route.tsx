import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Check, ChevronLeft, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Plate } from '../../components/domain/plate.js';
import {
  CheckoutSummary,
  OperationalReceipt,
  OperationalTimestamp,
} from '../../components/domain/session.js';
import { Button } from '../../components/ui/button.js';
import { Dialog } from '../../components/ui/dialog.js';
import { ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { useToast } from '../../components/ui/toast-context.js';
import {
  cancelParkingSession,
  checkOut,
  getOwnedParkings,
  getParkingSession,
  type ParkingSession,
} from '../../lib/api/owner-api.js';
import { formatMoney } from '../../lib/format.js';

export function OwnerSessionDetailRoute() {
  const { language, locale } = useAppearance();
  const es = language === 'es';
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
        {es ? 'No pudimos cargar esta estadía.' : 'We could not load this session.'}
      </ErrorState>
    );
  }
  const session = resolvedSession ?? sessionQuery.data;
  if (!session) return null;
  const parking = parkingsQuery.data?.find((item) => item.id === session.parkingId);
  const canOperate = session.status === 'ACTIVE';

  const refreshOperation = async () => {
    await queryClient.invalidateQueries({ queryKey: ['parking-session', session.id] });
    await queryClient.invalidateQueries({ queryKey: ['active-sessions', session.parkingId] });
    await queryClient.invalidateQueries({ queryKey: ['parking-sessions', session.parkingId] });
  };
  const completeCheckout = async () => {
    setActionError(undefined);
    try {
      const completedSession = await checkoutMutation.mutateAsync();
      setResolvedSession(completedSession);
      await refreshOperation();
      showToast(es ? 'La estadía se cerró.' : 'Session checked out.');
      setCheckoutOpen(false);
    } catch (reason) {
      setActionError(
        reason instanceof Error ? reason.message : 'Unable to check out this session.',
      );
    }
  };
  const cancelSession = async () => {
    setActionError(undefined);
    try {
      const cancelledSession = await cancelMutation.mutateAsync();
      setResolvedSession(cancelledSession);
      await refreshOperation();
      showToast(es ? 'La estadía se canceló.' : 'Session cancelled.');
      setCancelOpen(false);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Unable to cancel this session.');
    }
  };

  return (
    <section className="owner-page space-y-9" aria-labelledby="session-detail-title">
      <header className="border-b border-border-strong pb-7">
        <Link
          className="inline-flex items-center gap-1 text-sm font-bold underline decoration-accent decoration-4 underline-offset-4"
          to={`/app/parkings/${session.parkingId}`}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />{' '}
          {es ? 'Operación de cochera' : 'Parking operation'}
        </Link>
        <div className="mt-7 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="type-label text-foreground-muted">
              {session.status === 'ACTIVE'
                ? es
                  ? 'Estadía activa'
                  : 'Active session'
                : session.status === 'COMPLETED'
                  ? es
                    ? 'Estadía finalizada'
                    : 'Completed session'
                  : es
                    ? 'Estadía cancelada'
                    : 'Cancelled session'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Plate plate={session.vehicle.plate} />
              <span className="rounded-full border border-border-strong px-3 py-1.5 text-xs font-bold">
                {session.status === 'ACTIVE'
                  ? es
                    ? 'Activa'
                    : 'Active'
                  : session.status === 'COMPLETED'
                    ? es
                      ? 'Completada'
                      : 'Completed'
                    : es
                      ? 'Cancelada'
                      : 'Cancelled'}
              </span>
            </div>
            <h1
              className="mt-5 font-display text-4xl font-bold leading-[0.92] tracking-[-0.065em] sm:text-5xl"
              id="session-detail-title"
            >
              {session.vehicle.type.replaceAll('_', ' ')}
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
                <Check aria-hidden="true" className="size-4" />{' '}
                {es ? 'Cobrar y cerrar' : 'Check out'}
              </Button>
              <Button
                onClick={() => {
                  setActionError(undefined);
                  setCancelOpen(true);
                }}
                variant="danger"
              >
                <Ban aria-hidden="true" className="size-4" />{' '}
                {es ? 'Cancelar estadía' : 'Cancel session'}
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <DetailCard
          entries={[
            [es ? 'Tipo' : 'Type', session.vehicle.type.replaceAll('_', ' ')],
            [es ? 'Marca' : 'Brand', session.vehicle.brand ?? 'N/A'],
            [es ? 'Modelo' : 'Model', session.vehicle.model ?? 'N/A'],
          ]}
          title={es ? 'Vehículo' : 'Vehicle'}
        />
        <DetailCard
          entries={[
            [es ? 'Cliente' : 'Customer', session.customerName ?? 'N/A'],
            [es ? 'Teléfono' : 'Phone', session.customerPhone ?? 'N/A'],
            [es ? 'Notas' : 'Notes', session.notes ?? 'N/A'],
          ]}
          title={es ? 'Visita' : 'Visit'}
        />
        <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="type-label text-foreground-muted">{es ? 'Cochera' : 'Parking'}</p>
          <dl className="mt-5 space-y-4">
            <DetailItem label={es ? 'Cochera' : 'Facility'}>
              {parking ? (
                <Link
                  className="font-bold underline decoration-accent decoration-4 underline-offset-4"
                  to={`/app/parkings/${parking.id}`}
                >
                  {parking.title}
                </Link>
              ) : (
                session.parkingId
              )}
            </DetailItem>
            {parking ? (
              <DetailItem label={es ? 'Dirección' : 'Address'}>
                <span className="flex items-start gap-1.5">
                  <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  {parking.address}
                </span>
              </DetailItem>
            ) : null}
            <DetailItem label={es ? 'Ingreso' : 'Started'}>
              <OperationalTimestamp value={session.startTime} timezone={parking?.timezone} />
            </DetailItem>
            <DetailItem label={es ? 'Tarifa registrada' : 'Rate snapshot'}>
              {formatMoney(session.hourlyRateCents, session.currency, locale)} / H
            </DetailItem>
            <DetailItem label={es ? 'Total' : 'Total'}>
              {session.totalAmountCents === null
                ? es
                  ? 'Pendiente de cobro'
                  : 'Pending checkout'
                : formatMoney(session.totalAmountCents, session.currency, locale)}
            </DetailItem>
          </dl>
        </section>
      </div>

      {session.status === 'COMPLETED' ? (
        <OperationalReceipt session={session} timezone={parking?.timezone} />
      ) : null}
      {session.status === 'CANCELLED' ? (
        <section
          aria-label={es ? 'Estadía cancelada' : 'Cancelled session'}
          className="rounded-[var(--radius-lg)] border border-warning-foreground bg-warning-surface p-6 text-warning-text"
        >
          <p className="type-label">{es ? 'Estado terminal' : 'Terminal state'}</p>
          <h2 className="mt-3 font-display text-2xl font-bold">
            {es ? 'Esta estadía fue cancelada.' : 'This session was cancelled.'}
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            {es
              ? 'No se cobró esta estadía y no se puede volver a modificar.'
              : 'This session was not charged and cannot be changed again.'}
          </p>
        </section>
      ) : null}

      <Dialog
        closeLabel={es ? 'Cerrar cobro' : 'Close checkout'}
        description={
          es
            ? 'Revisá el cálculo antes de cerrar la estadía. El importe final se confirma al completar el cobro.'
            : 'Review the current calculation before completing this session. The final amount is confirmed at checkout.'
        }
        onOpenChange={setCheckoutOpen}
        open={checkoutOpen}
        title={es ? 'Cobrar y cerrar estadía' : 'Complete checkout'}
      >
        <div className="space-y-5 pt-6">
          <div className="flex items-center justify-between gap-4">
            <Plate plate={session.vehicle.plate} />
            <span className="text-sm font-semibold text-foreground-secondary">
              {session.vehicle.type.replaceAll('_', ' ')}
            </span>
          </div>
          <CheckoutSummary session={session} timezone={parking?.timezone} />
          {actionError ? (
            <p
              className="rounded-[var(--radius-md)] border border-danger-foreground bg-danger-surface p-3 text-sm font-semibold text-danger-text"
              role="alert"
            >
              {actionError}
            </p>
          ) : null}
          <Button
            disabled={checkoutMutation.isPending}
            fullWidth
            onClick={() => void completeCheckout()}
          >
            {checkoutMutation.isPending
              ? es
                ? 'Cobrando…'
                : 'Completing…'
              : es
                ? 'Cobrar y cerrar estadía'
                : 'Complete checkout'}
          </Button>
        </div>
      </Dialog>

      <Dialog
        closeLabel={es ? 'Cerrar cancelación' : 'Close cancellation'}
        description={
          es
            ? `Cancelar ${session.vehicle.plate} finaliza esta estadía sin cobrar. No se puede deshacer.`
            : `Cancelling ${session.vehicle.plate} ends this active session without a checkout. This cannot be undone.`
        }
        onOpenChange={setCancelOpen}
        open={cancelOpen}
        title={es ? 'Cancelar estadía activa' : 'Cancel active session'}
      >
        <div className="space-y-5 pt-6">
          <Plate plate={session.vehicle.plate} />
          <p className="border-l-4 border-accent pl-4 text-sm leading-relaxed text-foreground-secondary">
            {es
              ? 'La cochera quedará disponible para registrar un nuevo ingreso.'
              : 'The parking will be available for a new check-in after cancellation.'}
          </p>
          {actionError ? (
            <p
              className="rounded-[var(--radius-md)] border border-danger-foreground bg-danger-surface p-3 text-sm font-semibold text-danger-text"
              role="alert"
            >
              {actionError}
            </p>
          ) : null}
          <Button
            disabled={cancelMutation.isPending}
            fullWidth
            onClick={() => void cancelSession()}
          >
            {cancelMutation.isPending
              ? es
                ? 'Cancelando…'
                : 'Cancelling…'
              : es
                ? 'Cancelar estadía'
                : 'Cancel session'}
          </Button>
        </div>
      </Dialog>
    </section>
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
  return (
    <div className="space-y-8" aria-label="Loading parking session">
      <Skeleton className="h-56 rounded-[var(--radius-xl)]" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-[var(--radius-lg)]" />
        <Skeleton className="h-64 rounded-[var(--radius-lg)]" />
        <Skeleton className="h-64 rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
