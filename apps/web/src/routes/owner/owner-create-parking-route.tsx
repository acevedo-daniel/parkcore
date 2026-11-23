import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { PageHeader } from '../../components/domain/page-header.js';
import { Button } from '../../components/ui/button.js';
import { UnsavedChangesPrompt } from '../../components/domain/unsaved-changes-prompt.js';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/use-auth.js';
import { ParkingForm } from '../../features/parking/parking-form.js';
import { createParking } from '../../lib/api/owner-api.js';
import { localizeParkingMutationError } from './parking-route-errors.js';

export function OwnerCreateParkingRoute() {
  const { t } = useAppearance();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const [isDirty, setIsDirty] = useState(false);
  const allowNavigationRef = useRef(false);
  const mutation = useMutation({ mutationFn: createParking });

  return (
    <section className="owner-page space-y-8" aria-labelledby="create-parking-title">
      <PageHeader
        actions={
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              allowNavigationRef.current = true;
              setIsDirty(false);
              void navigate('/app/parkings');
            }}
          >
            {t('parkingRoute.cancel')}
          </Button>
        }
        eyebrow={t('parkingRoute.management')}
        id="create-parking-title"
        title={t('parkingRoute.createTitle')}
      />
      <ParkingForm
        defaultTimezone={user?.timezone}
        error={error}
        isSubmitting={mutation.isPending}
        onDirtyChange={setIsDirty}
        onSubmit={async (input) => {
          setError(undefined);
          try {
            const parking = await mutation.mutateAsync(input);
            allowNavigationRef.current = true;
            setIsDirty(false);
            await queryClient.invalidateQueries({ queryKey: ['owned-parkings'] });
            toast.success(t('parkingRoute.created'));
            await navigate(`/app/parkings/${parking.id}`, { replace: true });
          } catch (reason) {
            setError(localizeParkingMutationError(reason, t, 'api.createParking'));
          }
        }}
      />
      <UnsavedChangesPrompt
        allowNavigationRef={allowNavigationRef}
        when={isDirty && !mutation.isPending}
      />
    </section>
  );
}
