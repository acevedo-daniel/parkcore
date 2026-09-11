import * as ToastPrimitive from '@radix-ui/react-toast';
import { AlertTriangle, Inbox, RefreshCw, X } from 'lucide-react';
import { useCallback, useId, useState, type ReactNode } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { IconButton } from './button.js';
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
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {messages.map((message) => (
          <ToastPrimitive.Root
            key={message.id}
            className="toast"
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
        <ToastPrimitive.Viewport className="toast-viewport" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-busy="true" aria-hidden="true" className={`skeleton animate-pulse ${className}`} />
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
      aria-live="polite"
      className="flex min-h-56 flex-col items-start justify-center rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface p-6 text-foreground sm:p-8"
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
      aria-labelledby={titleId}
      className="flex min-h-56 flex-col items-start justify-center rounded-[var(--radius-xl)] border border-border-strong bg-surface-emphasis p-6 text-foreground sm:p-8"
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
        <button
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          {t('feedback.retry')}
        </button>
      ) : null}
    </section>
  );
}
