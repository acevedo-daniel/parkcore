import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/cn.js';

interface DialogProps {
  children: ReactNode;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}

export function Dialog({ children, description, onOpenChange, open, title }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content className="dialog-content">
          <header className="dialog-header">
            <div className="stack-tight">
              <p className="type-label">ParkCore</p>
              <DialogPrimitive.Title className="type-section-title">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="field-help">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <button aria-label={`Close ${title}`} className="icon-button" type="button">
                <X aria-hidden="true" size={17} />
              </button>
            </DialogPrimitive.Close>
          </header>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Sheet({ children, description, onOpenChange, open, title }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content className={cn('dialog-content', 'sheet-content')}>
          <header className="dialog-header">
            <div className="stack-tight">
              <p className="type-label">Operation</p>
              <DialogPrimitive.Title className="type-section-title">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="field-help">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <button aria-label={`Close ${title}`} className="icon-button" type="button">
                <X aria-hidden="true" size={17} />
              </button>
            </DialogPrimitive.Close>
          </header>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
