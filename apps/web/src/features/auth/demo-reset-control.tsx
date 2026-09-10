import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { resetDemo } from '../../lib/api/auth-api.js';
import { Button } from '../../components/ui/button.js';
import { Dialog } from '../../components/ui/dialog.js';
import { useToast } from '../../components/ui/toast-context.js';

export function DemoResetControl() {
  const { language } = useAppearance();
  const es = language === 'es';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const resetMutation = useMutation({ mutationFn: resetDemo });

  const confirmReset = async () => {
    setError(undefined);
    try {
      await resetMutation.mutateAsync();
      await queryClient.invalidateQueries();
      showToast(
        es
          ? 'El ejemplo volvió a su estado inicial.'
          : 'The example is back to its starting point.',
      );
      setOpen(false);
      void navigate('/app', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to reset the demo.');
    }
  };

  return (
    <>
      <button
        className="owner-nav-link owner-reset-demo flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2 text-left text-sm font-medium text-foreground-secondary transition-colors hover:bg-[#f1eee7] hover:text-foreground"
        onClick={() => {
          setOpen(true);
        }}
        type="button"
      >
        <RotateCcw aria-hidden="true" className="shrink-0" size={16} />
        <span>{es ? 'Restaurar ejemplo' : 'Restore example'}</span>
      </button>
      <Dialog
        description={
          es
            ? 'Esto deshace los cambios del ejemplo y lo devuelve a su punto de partida.'
            : 'This removes changes from the example and takes it back to its starting point.'
        }
        onOpenChange={setOpen}
        open={open}
        title={es ? 'Restaurar el ejemplo' : 'Restore the example'}
      >
        <div className="operation-dialog">
          <p className="field-help">
            {es
              ? 'Usalo solo si querés volver a empezar con la información de ejemplo.'
              : 'Use this only if you want to start again with the example information.'}
          </p>
          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button disabled={resetMutation.isPending} onClick={() => void confirmReset()}>
            <RotateCcw aria-hidden="true" size={16} />
            {resetMutation.isPending
              ? es
                ? 'Restaurando…'
                : 'Restoring…'
              : es
                ? 'Restaurar ejemplo'
                : 'Restore example'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
