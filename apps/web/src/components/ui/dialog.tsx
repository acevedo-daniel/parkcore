import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { IconButton } from './button.js';

export interface DialogProps {
  children: ReactNode;
  closeLabel?: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}

const overlayClassName =
  'fixed inset-0 z-50 bg-overlay-backdrop backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in';

function useFocusRestoration(open: boolean) {
  const focusBeforeOpen = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(open);

  useLayoutEffect(() => {
    if (open && !wasOpen.current) {
      focusBeforeOpen.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    wasOpen.current = open;
  }, [open]);

  return (event: Event) => {
    const target = focusBeforeOpen.current;
    if (!target?.isConnected) return;

    event.preventDefault();
    target.focus();
    focusBeforeOpen.current = null;
  };
}

function DialogHeader({
  closeLabel,
  description,
  title,
}: Pick<DialogProps, 'closeLabel' | 'description' | 'title'>) {
  const { t } = useAppearance();
  return (
    <header
      className="flex items-start justify-between gap-5 border-b border-border-strong pb-5"
      data-slot="dialog-header"
    >
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-muted">
          {t('dialog.eyebrow')}
        </p>
        <DialogPrimitive.Title className="mt-3 font-display text-3xl font-bold leading-none tracking-[-0.055em] text-foreground">
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-3 max-w-xl text-sm leading-relaxed text-foreground-secondary">
            {description}
          </DialogPrimitive.Description>
        ) : null}
      </div>
      <DialogPrimitive.Close asChild>
        <IconButton
          aria-label={closeLabel ?? t('dialog.close', { title })}
          className="rounded-full"
          data-slot="dialog-close"
        >
          <X aria-hidden="true" className="size-4" />
        </IconButton>
      </DialogPrimitive.Close>
    </header>
  );
}

function DialogOverlay() {
  return <DialogPrimitive.Overlay className={overlayClassName} data-slot="dialog-overlay" />;
}

export function Dialog({
  children,
  closeLabel,
  description,
  onOpenChange,
  open,
  title,
}: DialogProps) {
  const restoreFocus = useFocusRestoration(open);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-[var(--radius-xl)] border border-border-strong bg-surface-raised p-6 text-foreground shadow-dialog focus:outline-none sm:p-8"
          data-slot="dialog-content"
          onCloseAutoFocus={restoreFocus}
        >
          <DialogHeader closeLabel={closeLabel} description={description} title={title} />
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Sheet({
  children,
  closeLabel,
  description,
  onOpenChange,
  open,
  title,
}: DialogProps) {
  const restoreFocus = useFocusRestoration(open);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 h-dvh max-h-dvh w-full max-w-2xl overflow-y-auto overscroll-contain border-l border-border-strong bg-surface-raised p-6 text-foreground shadow-dialog focus:outline-none sm:rounded-l-[var(--radius-xl)] sm:p-8"
          data-slot="sheet-content"
          onCloseAutoFocus={restoreFocus}
        >
          <DialogHeader closeLabel={closeLabel} description={description} title={title} />
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
