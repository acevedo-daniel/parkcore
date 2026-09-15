import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { ParkingForm } from '../../features/parking/parking-form.js';
import { Button } from '../../components/ui/button.js';
import { ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { getOwnedParkings, updateParking } from '../../lib/api/owner-api.js';
import { UnsavedChangesPrompt } from '../../components/ui/unsaved-changes-prompt.js';
import { useToast } from '../../components/ui/toast-context.js';
import { localizeParkingMutationError } from './parking-route-errors.js';

export function OwnerEditParkingRoute() {
  const { t } = useAppearance();
  const { parkingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [error, setError] = useState<string>();
  const [isDirty, setIsDirty] = useState(false);
  const allowNavigationRef = useRef(false);
  const parkingsQuery = useQuery({ queryKey: ['owned-parkings'], queryFn: getOwnedParkings });
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof updateParking>[1]) =>
      updateParking(parkingId ?? '', input),
  });

  if (parkingsQuery.isLoading) {
    return (
      <section aria-labelledby="edit-parking-loading-title" className="owner-page space-y-6">
        <h1 className="visually-hidden" id="edit-parking-loading-title">
          {t('parkingRoute.editTitle')}
        </h1>
        <p className="visually-hidden" role="status">
          {t('parkingRoute.loading')}
        </p>
        <Skeleton className="min-h-96 w-full" />
      </section>
    );
  }
  if ((parkingsQuery.isError && parkingsQuery.data === undefined) || !parkingId)
    return (
      <section aria-labelledby="edit-parking-error-title" className="owner-page">
        <h1 className="visually-hidden" id="edit-parking-error-title">
          {t('parkingRoute.editTitle')}
        </h1>
        <ErrorState
          onRetry={() => {
            void parkingsQuery.refetch();
          }}
        >
          {t('parkingRoute.loadError')}
        </ErrorState>
      </section>
    );
  const parking = parkingsQuery.data?.find((item) => item.id === parkingId);
  if (!parking)
    return (
      <section aria-labelledby="edit-parking-unavailable-title" className="owner-page">
        <h1 className="visually-hidden" id="edit-parking-unavailable-title">
          {t('parkingRoute.editTitle')}
        </h1>
        <ErrorState title={t('parkingOperation.unavailableTitle')}>
          {t('api.parkingUnavailable')}
        </ErrorState>
      </section>
    );

  const hasStaleData = parkingsQuery.isError;

  return (
    <section className="owner-page space-y-8" aria-labelledby="edit-parking-title">
      <header className="flex flex-col justify-between gap-5 border-b border-border-strong pb-7 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="type-label">{t('parkingRoute.management')}</p>
          <h1 className="break-words type-page-title" id="edit-parking-title">
            {t('parkingRoute.editTitle')}
          </h1>
        </div>
        <Button
          className="shrink-0 self-start"
          variant="secondary"
          type="button"
          onClick={() => {
            allowNavigationRef.current = true;
            setIsDirty(false);
            void navigate(`/app/parkings/${parking.id}`);
          }}
        >
          {t('parkingRoute.cancel')}
        </Button>
      </header>
      <ParkingForm
        error={error}
        isSubmitting={mutation.isPending}
        onDirtyChange={setIsDirty}
        parking={parking}
        onSubmit={async (input) => {
          setError(undefined);
          try {
            await mutation.mutateAsync(input);
            allowNavigationRef.current = true;
            setIsDirty(false);
            await queryClient.invalidateQueries({ queryKey: ['owned-parkings'] });
            showToast(t('parkingRoute.updated'));
            await navigate(`/app/parkings/${parking.id}`, { replace: true });
          } catch (reason) {
            setError(localizeParkingMutationError(reason, t, 'api.updateParking'));
          }
        }}
      />
      {hasStaleData ? (
        <div
          className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-warning-foreground bg-warning-surface p-4 text-warning-text sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="break-words text-sm font-semibold">{t('parkingRoute.stale')}</p>
          <Button
            className="shrink-0 self-start sm:self-auto"
            onClick={() => {
              void parkingsQuery.refetch();
            }}
            type="button"
            variant="secondary"
          >
            {t('parkingRoute.retryStale')}
          </Button>
        </div>
      ) : null}
      <UnsavedChangesPrompt
        allowNavigationRef={allowNavigationRef}
        when={isDirty && !mutation.isPending}
      />
    </section>
  );
}
