import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { UnsavedChangesPrompt } from '../../components/ui/unsaved-changes-prompt.js';
import { useToast } from '../../components/ui/toast-context.js';
import { useAuth } from '../../features/auth/use-auth.js';
import { ParkingForm } from '../../features/parking/parking-form.js';
import { createParking } from '../../lib/api/owner-api.js';
import { localizeParkingMutationError } from './parking-route-errors.js';

export function OwnerCreateParkingRoute() {
  const { t } = useAppearance();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [error, setError] = useState<string>();
  const [isDirty, setIsDirty] = useState(false);
  const allowNavigationRef = useRef(false);
  const mutation = useMutation({ mutationFn: createParking });

  return (
    <section className="owner-page space-y-8" aria-labelledby="create-parking-title">
      <header className="flex flex-col justify-between gap-5 border-b border-border-strong pb-7 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="type-label">{t('parkingRoute.management')}</p>
          <h1 className="break-words type-page-title" id="create-parking-title">
            {t('parkingRoute.createTitle')}
          </h1>
        </div>
        <Button
          className="shrink-0 self-start"
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
      </header>
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
            showToast(t('parkingRoute.created'));
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
