import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { ParkingForm } from '../../features/parking/parking-form.js';
import { getOwnedParkings, updateParking } from '../../lib/api/owner-api.js';
import { Button } from '../../components/ui/button.js';
import { ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { useToast } from '../../components/ui/toast-context.js';

export function OwnerEditParkingRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const { parkingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [error, setError] = useState<string>();
  const parkingsQuery = useQuery({ queryKey: ['owned-parkings'], queryFn: getOwnedParkings });
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof updateParking>[1]) =>
      updateParking(parkingId ?? '', input),
  });

  if (parkingsQuery.isLoading) return <Skeleton className="owner-form-skeleton" />;
  if (parkingsQuery.isError || !parkingId)
    return (
      <ErrorState
        onRetry={() => {
          void parkingsQuery.refetch();
        }}
      >
        {es ? 'No pudimos cargar esta cochera.' : 'We could not load this parking.'}
      </ErrorState>
    );
  const parking = parkingsQuery.data?.find((item) => item.id === parkingId);
  if (!parking)
    return (
      <ErrorState title={es ? 'Cochera no disponible' : 'Parking unavailable'}>
        {es
          ? 'Esta cochera no está disponible en tu cuenta.'
          : 'This parking is not available in your account.'}
      </ErrorState>
    );

  return (
    <section className="owner-page stack-owner" aria-labelledby="edit-parking-title">
      <header className="owner-page-header">
        <div>
          <p className="type-label">{es ? 'Gestión' : 'Management'}</p>
          <h1 className="type-page-title" id="edit-parking-title">
            {es ? 'Editar cochera' : 'Edit parking'}
          </h1>
        </div>
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            void navigate(`/app/parkings/${parking.id}`);
          }}
        >
          {es ? 'Cancelar' : 'Cancel'}
        </Button>
      </header>
      <ParkingForm
        error={error}
        isSubmitting={mutation.isPending}
        parking={parking}
        onSubmit={async (input) => {
          setError(undefined);
          try {
            await mutation.mutateAsync(input);
            await queryClient.invalidateQueries({ queryKey: ['owned-parkings'] });
            showToast(es ? 'La cochera fue actualizada.' : 'Parking updated.');
            await navigate(`/app/parkings/${parking.id}`, { replace: true });
          } catch (reason) {
            setError(
              reason instanceof Error
                ? reason.message
                : es
                  ? 'No pudimos actualizar esta cochera.'
                  : 'Unable to update this parking.',
            );
          }
        }}
      />
    </section>
  );
}
