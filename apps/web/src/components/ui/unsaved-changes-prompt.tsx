import { useCallback, useEffect, type RefObject } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from './button.js';
import { Dialog } from './dialog.js';

export function UnsavedChangesPrompt({
  allowNavigationRef,
  when,
}: {
  allowNavigationRef?: RefObject<boolean>;
  when: boolean;
}) {
  const { t } = useAppearance();
  const shouldBlock = useCallback(() => {
    if (allowNavigationRef?.current) {
      allowNavigationRef.current = false;
      return false;
    }
    return when;
  }, [allowNavigationRef, when]);
  const blocker = useBlocker(shouldBlock);
  const beforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (!when) return;
      event.preventDefault();
      // Required by browsers that use returnValue for the native prompt.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      event.returnValue = '';
    },
    [when],
  );

  useBeforeUnload(beforeUnload, { capture: true });

  useEffect(() => {
    if (!when && blocker.state === 'blocked') blocker.reset();
  }, [blocker, when]);

  return (
    <Dialog
      description={t('dirty.description')}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked') blocker.reset();
      }}
      open={blocker.state === 'blocked'}
      title={t('dirty.title')}
    >
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button
          onClick={() => {
            if (blocker.state === 'blocked') blocker.reset();
          }}
          type="button"
          variant="secondary"
        >
          {t('dirty.stay')}
        </Button>
        <Button
          onClick={() => {
            if (blocker.state === 'blocked') blocker.proceed();
          }}
          type="button"
          variant="destructive"
        >
          {t('dirty.leave')}
        </Button>
      </div>
    </Dialog>
  );
}
