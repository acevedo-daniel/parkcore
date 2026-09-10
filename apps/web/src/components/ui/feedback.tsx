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
              <IconButton aria-label="Dismiss notification">
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
  const { language } = useAppearance();
  const titleId = useId();
  const es = language === 'es';
  return (
    <section
      aria-labelledby={titleId}
      aria-live="polite"
      className="flex min-h-56 flex-col items-start justify-center rounded-[1.5rem] border border-dashed border-[#121417] bg-white p-6 text-[#121417] sm:p-8"
      role="status"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-[#ffcc00] text-[#121417]">
        <Inbox aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#6d695f]">
        {es ? 'Todavía no hay nada acá' : 'Nothing here yet'}
      </p>
      <h2
        className="mt-2 font-display text-2xl font-bold leading-none tracking-[-0.045em]"
        id={titleId}
      >
        {title}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#45423c]">{children}</p>
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
  const { language } = useAppearance();
  const titleId = useId();
  const es = language === 'es';
  const resolvedTitle =
    title ?? (es ? 'No pudimos completar esa acción' : 'We could not complete that action');
  return (
    <section
      aria-labelledby={titleId}
      className="flex min-h-56 flex-col items-start justify-center rounded-[1.5rem] border border-[#121417] bg-[#f1eee7] p-6 text-[#121417] sm:p-8"
      role="alert"
    >
      <span className="flex size-10 items-center justify-center rounded-full border border-[#121417] bg-white text-[#121417]">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#6d695f]">
        {es ? 'Necesita atención' : 'Needs attention'}
      </p>
      <h2
        className="mt-2 font-display text-2xl font-bold leading-none tracking-[-0.045em]"
        id={titleId}
      >
        {resolvedTitle}
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#45423c]">{children}</p>
      {onRetry ? (
        <button
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#121417] bg-white px-4 text-sm font-bold text-[#121417] transition-colors hover:bg-[#ffcc00]"
          onClick={onRetry}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          {es ? 'Reintentar' : 'Try again'}
        </button>
      ) : null}
    </section>
  );
}
