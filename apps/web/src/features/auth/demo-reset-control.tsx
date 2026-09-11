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
      <button
        className="owner-nav-link owner-reset-demo flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2 text-left text-sm font-medium text-foreground-secondary transition-colors hover:bg-[#f1eee7] hover:text-foreground"
        onClick={() => {
          setOpen(true);
        }}
        type="button"
      >
        <RotateCcw aria-hidden="true" className="shrink-0" size={16} />
        <span>{t('demo.restore')}</span>
      </button>
      <Dialog
        description={t('demo.restoreDescription')}
        onOpenChange={setOpen}
        open={open}
        title={t('demo.restoreTitle')}
      >
        <div className="operation-dialog">
          <p className="field-help">{t('demo.restoreHelp')}</p>
          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button disabled={resetMutation.isPending} onClick={() => void confirmReset()}>
            <RotateCcw aria-hidden="true" size={16} />
            {resetMutation.isPending ? t('demo.restoring') : t('demo.restore')}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
