import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { useId, type ReactNode } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../ui/button.js';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from '../ui/empty.js';

interface EmptyStateProps {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  compactLayout?: 'split' | 'stacked';
  title: string;
  variant?: 'compact' | 'default';
}

export function EmptyState({
  action,
  children,
  className,
  compactLayout = 'stacked',
  title,
  variant = 'default',
}: EmptyStateProps) {
  const { t } = useAppearance();
  const titleId = useId();
  const isCompact = variant === 'compact';
  const isSplitCompact = isCompact && compactLayout === 'split';

  return (
    <Empty
      aria-atomic="true"
      aria-labelledby={titleId}
      aria-live="polite"
      className={cnEmptyState(isCompact, isSplitCompact, className)}
      data-layout={isCompact ? compactLayout : undefined}
      data-slot="empty-state"
      data-variant={variant}
      role="status"
    >
      {isCompact ? (
        <EmptyHeader className={isSplitCompact ? 'min-w-0 sm:max-w-2xl' : 'min-w-0'}>
          <p className="type-label text-muted-foreground" id={titleId}>
            {title}
          </p>
          <EmptyDescription className="mt-2 max-w-lg leading-relaxed text-foreground-secondary">
            {children}
          </EmptyDescription>
        </EmptyHeader>
      ) : (
        <EmptyHeader className="max-w-none items-start gap-0 text-left">
          <EmptyMedia
            className="mb-0 size-10 rounded-full bg-brand text-brand-foreground"
            variant="icon"
          >
            <Inbox aria-hidden="true" className="size-5" />
          </EmptyMedia>
          <p className="mt-5 type-eyebrow text-muted-foreground">{t('feedback.emptyEyebrow')}</p>
          <h2 className="mt-2 type-heading" id={titleId}>
            {title}
          </h2>
          <EmptyDescription className="mt-3 max-w-lg leading-relaxed text-foreground-secondary">
            {children}
          </EmptyDescription>
        </EmptyHeader>
      )}
      {action ? (
        <EmptyContent
          className={
            isCompact
              ? `mt-4 items-start gap-0 ${isSplitCompact ? 'sm:mt-0 sm:shrink-0' : ''}`
              : 'mt-6 items-start gap-0'
          }
        >
          {action}
        </EmptyContent>
      ) : null}
    </Empty>
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
    <Empty
      aria-atomic="true"
      aria-labelledby={titleId}
      className="min-h-56 flex-none items-start gap-0 rounded-xl border border-border-strong bg-accent p-6 text-left text-foreground sm:p-8"
      data-slot="error-state"
      role="alert"
    >
      <EmptyHeader className="max-w-none items-start gap-0 text-left">
        <EmptyMedia
          className="mb-0 size-10 rounded-full border border-border-strong bg-card text-foreground"
          variant="icon"
        >
          <AlertTriangle aria-hidden="true" className="size-5" />
        </EmptyMedia>
        <p className="mt-5 type-eyebrow text-muted-foreground">{t('feedback.errorEyebrow')}</p>
        <h2 className="mt-2 type-heading" id={titleId}>
          {resolvedTitle}
        </h2>
        <EmptyDescription className="mt-3 max-w-lg leading-relaxed text-foreground-secondary">
          {children}
        </EmptyDescription>
      </EmptyHeader>
      {onRetry ? (
        <EmptyContent className="mt-6 items-start gap-0">
          <Button className="rounded-full" onClick={onRetry} type="button" variant="outline">
            <RefreshCw aria-hidden="true" className="size-4" />
            {t('feedback.retry')}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

function cnEmptyState(isCompact: boolean, isSplitCompact: boolean, className?: string) {
  const base = isCompact
    ? 'flex-none min-w-0 flex-col items-start justify-center gap-0 rounded-none border-0 bg-transparent p-0 text-left text-foreground'
    : 'min-h-56 flex-none flex-col items-start justify-center gap-0 rounded-xl border border-dashed border-border-strong bg-card p-6 text-left text-foreground sm:p-8';
  return [
    base,
    isSplitCompact && 'sm:flex-row sm:items-center sm:justify-between sm:gap-8',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
