import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  children: ReactNode;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}

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
    event.preventDefault();
    focusBeforeOpen.current?.focus();
  };
}

function DialogHeader({ description, title }: Pick<DialogProps, 'description' | 'title'>) {
  return (
    <header className="flex items-start justify-between gap-5 border-b border-border-strong pb-5">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-muted">
          ParkCore / operation
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
        <button
          aria-label={`Close ${title}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface text-foreground transition-colors hover:bg-surface-hover"
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </DialogPrimitive.Close>
    </header>
  );
}

export function Dialog({ children, description, onOpenChange, open, title }: DialogProps) {
  const restoreFocus = useFocusRestoration(open);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay-backdrop backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--radius-xl)] border border-border-strong bg-surface-raised p-6 text-foreground shadow-dialog sm:p-8"
          onCloseAutoFocus={restoreFocus}
        >
          <DialogHeader description={description} title={title} />
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Sheet({ children, description, onOpenChange, open, title }: DialogProps) {
  const restoreFocus = useFocusRestoration(open);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay-backdrop backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto border-l border-border-strong bg-surface-raised p-6 text-foreground shadow-dialog sm:p-8"
          onCloseAutoFocus={restoreFocus}
        >
          <DialogHeader description={description} title={title} />
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
