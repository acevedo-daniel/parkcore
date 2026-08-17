import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';

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
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
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
  return (
    <section className="empty-state">
      <p className="type-label">No data</p>
      <h2 className="type-section-title">{title}</h2>
      <p className="field-help">{children}</p>
      {action}
    </section>
  );
}

export function ErrorState({
  children,
  onRetry,
  title = 'Something went wrong',
}: {
  children: ReactNode;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <section className="empty-state" role="alert">
      <p className="type-label">Error</p>
      <h2 className="type-section-title">{title}</h2>
      <p className="field-help">{children}</p>
      {onRetry ? (
        <button className="button button-secondary" type="button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </section>
  );
}
