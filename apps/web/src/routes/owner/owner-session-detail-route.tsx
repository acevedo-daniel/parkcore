import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Check, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { Plate } from '../../components/domain/plate.js';
import { CheckoutSummary, OperationalTimestamp } from '../../components/domain/session.js';
import { SessionStatus } from '../../components/domain/status.js';
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

  if (sessionQuery.isLoading || parkingsQuery.isLoading) {
    return <Skeleton className="owner-overview-skeleton" />;
  }
  if (sessionQuery.isError || !sessionId) {
    return (
      <ErrorState
        onRetry={() => {
          void sessionQuery.refetch();
          void parkingsQuery.refetch();
        }}
      >
        We could not load this session.
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
      showToast('Session checked out.');
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
      showToast('Session cancelled.');
      setCancelOpen(false);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Unable to cancel this session.');
    }
  };

  return (
    <section
      className="owner-page session-detail stack-owner"
      aria-labelledby="session-detail-title"
    >
      <Link className="back-link" to={`/app/parkings/${session.parkingId}`}>
        <ChevronLeft aria-hidden="true" size={16} /> Parking operation
      </Link>
      <header className="session-detail-header">
        <div>
          <p className="type-label">Parking session</p>
          <Plate plate={session.vehicle.plate} />
          <h1 className="type-page-title" id="session-detail-title">
            {session.vehicle.type.replaceAll('_', ' ')}
          </h1>
        </div>
        <SessionStatus status={session.status} />
      </header>
      {canOperate ? (
        <div className="session-detail-actions">
          <Button
            onClick={() => {
              setCheckoutOpen(true);
            }}
          >
            <Check aria-hidden="true" size={17} /> Check out
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setCancelOpen(true);
            }}
          >
            <Ban aria-hidden="true" size={17} /> Cancel session
          </Button>
        </div>
      ) : null}
      {actionError ? (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      ) : null}
      <div className="session-detail-grid">
        <DetailBlock
          entries={[
            ['Type', session.vehicle.type.replaceAll('_', ' ')],
            ['Brand', session.vehicle.brand ?? '—'],
            ['Model', session.vehicle.model ?? '—'],
          ]}
          title="Vehicle"
        />
        <DetailBlock
          entries={[
            ['Customer', session.customerName ?? '—'],
            ['Phone', session.customerPhone ?? '—'],
            ['Notes', session.notes ?? '—'],
          ]}
          title="Visit"
        />
        <section>
          <p className="type-label">Parking</p>
          <dl>
            <div>
              <dt>Facility</dt>
              <dd>
                {parking ? (
                  <Link to={`/app/parkings/${parking.id}`}>{parking.title}</Link>
                ) : (
                  session.parkingId
                )}
              </dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>
                <OperationalTimestamp value={session.startTime} />
              </dd>
            </div>
            <div>
              <dt>Rate snapshot</dt>
              <dd className="type-operational">
                {formatMoney(session.hourlyRateCents, session.currency)} / H
              </dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd className="type-operational">
                {session.totalAmountCents === null
                  ? 'Pending checkout'
                  : formatMoney(session.totalAmountCents, session.currency)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
      <Dialog
        description="Review the current calculation before completing this session. The backend confirms the final amount."
        onOpenChange={setCheckoutOpen}
        open={checkoutOpen}
        title="Complete checkout"
      >
        <div className="operation-dialog">
          <Plate plate={session.vehicle.plate} />
          <p className="type-small">{session.vehicle.type.replaceAll('_', ' ')}</p>
          <CheckoutSummary session={session} />
          <Button
            disabled={checkoutMutation.isPending}
            onClick={() => {
              void completeCheckout();
            }}
          >
            {checkoutMutation.isPending ? 'Completing…' : 'Complete checkout'}
          </Button>
        </div>
      </Dialog>
      <Dialog
        description={`Cancelling ${session.vehicle.plate} ends this active session without a checkout. This cannot be undone.`}
        onOpenChange={setCancelOpen}
        open={cancelOpen}
        title="Cancel active session"
      >
        <div className="operation-dialog">
          <Plate plate={session.vehicle.plate} />
          <p className="field-help">
            The parking will be available for a new check-in after cancellation.
          </p>
          <Button
            disabled={cancelMutation.isPending}
            variant="danger"
            onClick={() => {
              void cancelSession();
            }}
          >
            {cancelMutation.isPending ? 'Cancelling…' : 'Cancel session'}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

function DetailBlock({ entries, title }: { entries: [string, string][]; title: string }) {
  return (
    <section>
      <p className="type-label">{title}</p>
      <dl>
        {entries.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
