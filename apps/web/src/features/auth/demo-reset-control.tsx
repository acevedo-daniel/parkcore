import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { resetDemo } from '../../lib/api/auth-api.js';
import { Button } from '../../components/ui/button.js';
import { Dialog } from '../../components/ui/dialog.js';
import { useToast } from '../../components/ui/toast-context.js';

export function DemoResetControl() {
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
      showToast('Demo data restored.');
      setOpen(false);
      void navigate('/app', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to reset the demo.');
    }
  };

  return (
    <>
      <button
        className="owner-nav-link owner-reset-demo"
        onClick={() => {
          setOpen(true);
        }}
        type="button"
      >
        <RotateCcw aria-hidden="true" size={16} />
        <span>Reset demo</span>
      </button>
      <Dialog
        description="This replaces shared demo changes with the documented canonical data. Other demo users may see their current work disappear."
        onOpenChange={setOpen}
        open={open}
        title="Reset demo data"
      >
        <div className="operation-dialog">
          <p className="field-help">
            Only use this when you are ready to discard the shared demo state.
          </p>
          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button disabled={resetMutation.isPending} onClick={() => void confirmReset()}>
            <RotateCcw aria-hidden="true" size={16} />
            {resetMutation.isPending ? 'Restoring demo…' : 'Restore canonical data'}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
