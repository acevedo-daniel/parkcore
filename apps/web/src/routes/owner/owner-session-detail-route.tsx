import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Check, ChevronLeft, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Plate } from '../../components/domain/plate.js';
import { CheckoutSummary, OperationalTimestamp } from '../../components/domain/session.js';
import { Button } from '../../components/ui/button.js';
import { Dialog } from '../../components/ui/dialog.js';
import { ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { useToast } from '../../components/ui/toast-context.js';
import {
  cancelParkingSession,
  checkOut,
  getOwnedParkings,
  getParkingSession,
} from '../../lib/api/owner-api.js';
import { formatMoney } from '../../lib/format.js';

export function OwnerSessionDetailRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const { sessionId } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionError, setActionError] = useState<string>();
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
  const session = sessionQuery.data;
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
      await checkoutMutation.mutateAsync();
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
      await cancelMutation.mutateAsync();
      await refreshOperation();
      showToast(es ? 'La estadía se canceló.' : 'Session cancelled.');
      setCancelOpen(false);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Unable to cancel this session.');
    }
  };

  return (
    <section className="owner-page space-y-9" aria-labelledby="session-detail-title">
      <header className="border-b border-[#121417] pb-7">
        <Link
          className="inline-flex items-center gap-1 text-sm font-bold text-[#121417] underline decoration-[#ffcc00] decoration-4 underline-offset-4"
          to={`/app/parkings/${session.parkingId}`}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />{' '}
          {es ? 'Operación de cochera' : 'Parking operation'}
        </Link>
        <div className="mt-7 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d695f]">
              {canOperate
                ? es
                  ? 'Estadía activa'
                  : 'Active session'
                : es
                  ? 'Estadía finalizada'
                  : 'Completed session'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Plate plate={session.vehicle.plate} />
              <span className="rounded-full border border-[#121417] px-3 py-1.5 text-xs font-bold">
                {session.status[0]}
                {session.status.slice(1).toLowerCase()}
              </span>
            </div>
            <h1
              className="mt-5 font-display text-4xl font-bold leading-[0.92] tracking-[-0.065em] text-[#121417] sm:text-5xl"
              id="session-detail-title"
            >
              {session.vehicle.type.replaceAll('_', ' ')}
            </h1>
          </div>
          {canOperate ? (
            <div className="flex flex-wrap gap-2">
              <Button
                className="border-[#ffcc00] bg-[#ffcc00] text-[#121417] hover:bg-[#ffe066]"
                onClick={() => {
                  setCheckoutOpen(true);
                }}
              >
                <Check aria-hidden="true" className="size-4" />{' '}
                {es ? 'Cobrar y salir' : 'Check out'}
              </Button>
              <Button
                className="border-[#121417] bg-white text-[#121417] hover:bg-[#f1eee7]"
                onClick={() => {
                  setCancelOpen(true);
                }}
                variant="outline"
              >
                <Ban aria-hidden="true" className="size-4" />{' '}
                {es ? 'Cancelar estadía' : 'Cancel session'}
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      {actionError ? (
        <p
          className="border border-[#121417] bg-[#ffcc00] p-4 text-sm font-semibold text-[#121417]"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}

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
        <section className="rounded-[1.35rem] border border-[#121417] bg-white p-5 text-[#121417]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
            {es ? 'Cochera' : 'Parking'}
          </p>
          <dl className="mt-5 space-y-4">
            <DetailItem label={es ? 'Cochera' : 'Facility'}>
              {parking ? (
                <Link
                  className="font-bold underline decoration-[#ffcc00] decoration-4 underline-offset-4"
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
              <OperationalTimestamp value={session.startTime} />
            </DetailItem>
            <DetailItem label={es ? 'Tarifa registrada' : 'Rate snapshot'}>
              {formatMoney(session.hourlyRateCents, session.currency)} / H
            </DetailItem>
            <DetailItem label={es ? 'Total' : 'Total'}>
              {session.totalAmountCents === null
                ? es
                  ? 'Pendiente de cobro'
                  : 'Pending checkout'
                : formatMoney(session.totalAmountCents, session.currency)}
            </DetailItem>
          </dl>
        </section>
      </div>

      <Dialog
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
            <span className="text-sm font-semibold text-[#45423c]">
              {session.vehicle.type.replaceAll('_', ' ')}
            </span>
          </div>
          <CheckoutSummary session={session} />
          <Button
            className="border-[#121417] bg-[#121417] text-white hover:bg-[#30312d]"
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
          <p className="border-l-4 border-[#ffcc00] pl-4 text-sm leading-relaxed text-[#45423c]">
            {es
              ? 'La cochera quedará disponible para registrar un nuevo ingreso.'
              : 'The parking will be available for a new check-in after cancellation.'}
          </p>
          <Button
            className="border-[#121417] bg-[#121417] text-white hover:bg-[#30312d]"
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
    <section className="rounded-[1.35rem] border border-[#121417] bg-white p-5 text-[#121417]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d695f]">
        {title}
      </p>
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
      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#6d695f]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold leading-relaxed text-[#121417]">{children}</dd>
    </div>
  );
}

function SessionDetailSkeleton() {
  return (
    <div className="space-y-8" aria-label="Loading parking session">
      <Skeleton className="h-56 rounded-[1.75rem]" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-[1.35rem]" />
        <Skeleton className="h-64 rounded-[1.35rem]" />
        <Skeleton className="h-64 rounded-[1.35rem]" />
      </div>
    </div>
  );
}
