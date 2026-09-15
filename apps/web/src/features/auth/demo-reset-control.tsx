import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { resetDemo } from '../../lib/api/auth-api.js';
import { Button } from '../../components/ui/button.js';
import { Dialog } from '../../components/ui/dialog.js';
import { localizeApiError } from '../../lib/api/api-error.js';
import { useToast } from '../../components/ui/toast-context.js';

export function DemoResetControl() {
  const { t } = useAppearance();
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
      showToast(t('demo.restoreSuccess'));
      setOpen(false);
      void navigate('/app', { replace: true });
    } catch (reason) {
      setError(localizeApiError(reason, t, 'demo.restoreError'));
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
        type="button"
        variant="destructive"
      >
        <RotateCcw aria-hidden="true" className="size-4" />
        {t('demo.restore')}
      </Button>
      <Dialog
        description={t('demo.restoreDescription')}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setError(undefined);
        }}
        open={open}
        title={t('demo.restoreTitle')}
      >
        <div className="mt-6 space-y-5">
          <p className="text-sm leading-relaxed text-foreground-secondary">
            {t('demo.restoreHelp')}
          </p>
          {error ? (
            <p className="text-sm font-semibold text-danger-text" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            disabled={resetMutation.isPending}
            onClick={() => void confirmReset()}
            type="button"
            variant="destructive"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            {resetMutation.isPending ? t('demo.restoring') : t('demo.restore')}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
