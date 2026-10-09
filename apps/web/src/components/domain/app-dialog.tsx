import { X } from 'lucide-react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../ui/button.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog.js';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '../ui/sheet.js';

export interface DialogProps {
  children: ReactNode;
  closeLabel?: string;
  description: string;
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
    const target = focusBeforeOpen.current;
    if (!target?.isConnected) return;

    event.preventDefault();
    target.focus();
    focusBeforeOpen.current = null;
  };
}

function DialogHeading({
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
      <div className="min-w-0">
        <p className="type-eyebrow text-foreground-secondary">{t('dialog.eyebrow')}</p>
        <DialogTitle className="mt-3 break-words type-heading text-foreground">{title}</DialogTitle>
        <DialogDescription className="mt-3 max-w-xl break-words text-sm leading-relaxed">
          {description}
        </DialogDescription>
      </div>
      <DialogClose asChild>
        <Button
          aria-label={closeLabel ?? t('dialog.close', { title })}
          className="rounded-full"
          data-slot="dialog-close"
          size="icon"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </DialogClose>
    </header>
  );
}

function SheetHeading({
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
      <div className="min-w-0">
        <p className="type-eyebrow text-foreground-secondary">{t('dialog.eyebrow')}</p>
        <SheetTitle className="mt-3 break-words type-heading text-foreground">{title}</SheetTitle>
        <SheetDescription className="mt-3 max-w-xl break-words text-sm leading-relaxed">
          {description}
        </SheetDescription>
      </div>
      <SheetClose asChild>
        <Button
          aria-label={closeLabel ?? t('dialog.close', { title })}
          className="rounded-full"
          data-slot="dialog-close"
          size="icon"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </SheetClose>
    </header>
  );
}

export function AppDialog({
  children,
  closeLabel,
  description,
  onOpenChange,
  open,
  title,
}: DialogProps) {
  const restoreFocus = useFocusRestoration(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-xl pb-safe-overlay shadow-xl"
        onCloseAutoFocus={restoreFocus}
      >
        <DialogHeading closeLabel={closeLabel} description={description} title={title} />
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function AppSheet({
  children,
  closeLabel,
  description,
  onOpenChange,
  open,
  title,
}: DialogProps) {
  const restoreFocus = useFocusRestoration(open);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="rounded-xl pb-safe-overlay shadow-xl"
        onCloseAutoFocus={restoreFocus}
      >
        <SheetHeading closeLabel={closeLabel} description={description} title={title} />
        {children}
      </SheetContent>
    </Sheet>
  );
}
