import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../../lib/cn.js';

const toneClasses = {
  destructive:
    'border-destructive-soft-foreground bg-destructive-soft text-destructive-soft-foreground',
  warning: 'border-warning-soft-foreground bg-warning-soft text-warning-soft-foreground',
} as const;

export interface NoticeProps extends Omit<ComponentProps<'div'>, 'children'> {
  action?: ReactNode;
  children: ReactNode;
  layout?: 'inline' | 'stacked';
  tone?: keyof typeof toneClasses;
}

export function Notice({
  action,
  children,
  className,
  layout = 'inline',
  tone = 'warning',
  ...props
}: NoticeProps) {
  return (
    <div
      {...props}
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4',
        layout === 'inline' && action && 'sm:flex-row sm:items-center sm:justify-between',
        toneClasses[tone],
        className,
      )}
      data-slot="notice"
      data-tone={tone}
    >
      <p className="min-w-0 break-words text-sm font-semibold">{children}</p>
      {action ? (
        <div
          className={cn('flex shrink-0 self-start', layout === 'inline' && 'sm:self-auto')}
          data-slot="notice-action"
        >
          {action}
        </div>
      ) : null}
    </div>
  );
}
