import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { ParkingForm } from '../../features/parking/parking-form.js';
import { localizeApiError } from '../../lib/api/api-error.js';
import { createParking } from '../../lib/api/owner-api.js';
import { Button } from '../../components/ui/button.js';
import { useToast } from '../../components/ui/toast-context.js';

export function OwnerCreateParkingRoute() {
  const { t } = useAppearance();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [error, setError] = useState<string>();
  const mutation = useMutation({ mutationFn: createParking });

  return (
    <section className="owner-page stack-owner" aria-labelledby="create-parking-title">
      <header className="owner-page-header">
        <div>
          <p className="type-label">{t('parkingRoute.management')}</p>
          <h1 className="type-page-title" id="create-parking-title">
            {t('parkingRoute.createTitle')}
          </h1>
        </div>
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            void navigate('/app/parkings');
          }}
        >
          {t('parkingRoute.cancel')}
        </Button>
      </header>
      <ParkingForm
        error={error}
        isSubmitting={mutation.isPending}
        onSubmit={async (input) => {
          setError(undefined);
          try {
            const parking = await mutation.mutateAsync(input);
            await queryClient.invalidateQueries({ queryKey: ['owned-parkings'] });
            showToast(t('parkingRoute.created'));
            await navigate(`/app/parkings/${parking.id}`, { replace: true });
          } catch (reason) {
            setError(localizeApiError(reason, t, 'api.createParking'));
          }
        }}
      />
    </section>
  );
}
