import type { ReactNode } from 'react';

import { cn } from '../../lib/cn.js';

export interface PageHeaderProps {
  actions?: ReactNode;
  backAction?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  id?: string;
  title: ReactNode;
}

export function PageHeader({
  actions,
  backAction,
  className,
  description,
  eyebrow,
  id,
  title,
}: PageHeaderProps) {
  return (
    <header className={cn('border-b border-border-strong pb-7', className)}>
      {backAction ? <div>{backAction}</div> : null}
      <div
        className={cn(
          'flex flex-col justify-between gap-6 sm:flex-row sm:items-end',
          backAction && 'mt-7',
        )}
      >
        <div className="max-w-3xl">
          {eyebrow ? <p className="type-label text-foreground-muted">{eyebrow}</p> : null}
          <h1
            className="mt-3 font-display text-4xl font-bold leading-[0.92] tracking-[-0.065em] sm:text-5xl"
            id={id}
          >
            {title}
          </h1>
          {description ? (
            <div className="mt-4 max-w-2xl text-base leading-relaxed text-foreground-secondary">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
