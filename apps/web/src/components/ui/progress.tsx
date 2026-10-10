import * as React from 'react';
import { Progress as ProgressPrimitive } from 'radix-ui';

import { cn } from '@/lib/cn';

export type ProgressTone = 'success' | 'warning' | 'destructive';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  value?: number | null;
  tone?: ProgressTone;
}

const indicatorByTone: Record<ProgressTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
};

function Progress({ className, tone = 'success', value, max = 100, ...props }: ProgressProps) {
  const percentage =
    max <= 0 || value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-tone={tone}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      max={max}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        data-tone={tone}
        className={cn('h-full w-full flex-1 transition-transform', indicatorByTone[tone])}
        style={{ transform: `translateX(-${String(100 - percentage)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
