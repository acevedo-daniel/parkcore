import * as ToastPrimitive from '@radix-ui/react-toast';
import { AlertTriangle, Inbox, RefreshCw, X } from 'lucide-react';
import { useCallback, useId, useState, type ReactNode } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button, IconButton } from './button.js';
import { ToastContext } from './toast-context.js';

interface ToastMessage {
  id: number;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useAppearance();
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const showToast = useCallback((message: string) => {
    setMessages((current) => [...current, { id: Date.now(), message }]);
  }, []);
  const dismiss = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <ToastPrimitive.Provider label={t('feedback.toastRegion')} swipeDirection="right">
        {children}
        {messages.map((message) => (
          <ToastPrimitive.Root
            key={message.id}
            className="parkcore-toast toast"
            data-slot="toast"
            duration={4200}
            onOpenChange={(open) => {
              if (!open) dismiss(message.id);
            }}
          >
            <ToastPrimitive.Description>{message.message}</ToastPrimitive.Description>
            <ToastPrimitive.Close asChild>
              <IconButton aria-label={t('feedback.dismiss')}>
                <X aria-hidden="true" size={16} />
              </IconButton>
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport
          className="parkcore-toast-viewport toast-viewport"
          data-slot="toast-viewport"
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-hidden="true"
      className={`parkcore-skeleton skeleton animate-pulse ${className}`}
      data-slot="skeleton"
    />
  );
}

export function EmptyState({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  const { t } = useAppearance();
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      aria-atomic="true"
      aria-live="polite"
      className="flex min-h-56 flex-col items-start justify-center rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-6 text-foreground sm:p-8"
      data-slot="empty-state"
      role="status"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Inbox aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-muted">
        {t('feedback.emptyEyebrow')}
      </p>
      <h2
        className="mt-2 font-display text-2xl font-bold leading-none tracking-[-0.045em]"
        id={titleId}
      >
        {title}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-foreground-secondary">{children}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}

export function ErrorState({
  children,
  onRetry,
  title,
}: {
  children: ReactNode;
  onRetry?: () => void;
  title?: string;
}) {
  const { t } = useAppearance();
  const titleId = useId();
  const resolvedTitle = title ?? t('feedback.errorTitle');
  return (
    <section
      aria-atomic="true"
      aria-labelledby={titleId}
      className="flex min-h-56 flex-col items-start justify-center rounded-[var(--radius-xl)] border border-border-strong bg-surface-emphasis p-6 text-foreground sm:p-8"
      data-slot="error-state"
      role="alert"
    >
      <span className="flex size-10 items-center justify-center rounded-full border border-border-strong bg-surface text-foreground">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-muted">
        {t('feedback.errorEyebrow')}
      </p>
      <h2
        className="mt-2 font-display text-2xl font-bold leading-none tracking-[-0.045em]"
        id={titleId}
      >
        {resolvedTitle}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-foreground-secondary">{children}</p>
      {onRetry ? (
        <Button className="mt-6 rounded-full" onClick={onRetry} type="button" variant="outline">
          <RefreshCw aria-hidden="true" className="size-4" />
          {t('feedback.retry')}
        </Button>
      ) : null}
    </section>
  );
}
