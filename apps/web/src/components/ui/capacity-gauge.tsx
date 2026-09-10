import * as React from 'react';

import { cn } from '../../lib/cn.js';
import { Badge } from './badge.js';

export interface CapacityGaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  active: number;
  capacity: number;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function CapacityGauge({
  active,
  capacity,
  label = 'Occupancy gauge',
  size = 'default',
  className,
  ...props
}: CapacityGaugeProps) {
  const percentage = capacity === 0 ? 0 : Math.min(100, Math.round((active / capacity) * 100));
  const isLocked = active >= capacity;

  const threshold: 'neutral' | 'warning' | 'critical' | 'full' = isLocked
    ? 'full'
    : percentage >= 95
      ? 'critical'
      : percentage >= 90
        ? 'critical'
        : percentage >= 70
          ? 'warning'
          : 'neutral';

  const statusText = isLocked
    ? 'Intake locked · facility full'
    : percentage >= 95
      ? 'Critical capacity · nearly full'
      : percentage >= 90
        ? 'Critical capacity'
        : percentage >= 70
          ? 'Elevated occupancy'
          : 'Optimal capacity';

  const badgeVariant = isLocked
    ? 'destructive'
    : threshold === 'critical'
      ? 'destructive'
      : threshold === 'warning'
        ? 'warning'
        : 'success';

  const available = Math.max(0, capacity - active);

  return (
    <div
      data-slot="capacity-gauge"
      className={cn(
        'capacity-gauge rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-xs',
        `capacity-gauge-${threshold}`,
        `occupancy-${threshold}`,
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary font-mono">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant} dot size="sm">
            {percentage}%
          </Badge>
          <span className="font-mono text-xs sm:text-sm font-bold tabular-nums text-foreground">
            {active} / {capacity}
          </span>
        </div>
      </div>

      <div
        aria-label={`${String(active)} of ${String(capacity)} spots occupied`}
        aria-valuemax={capacity}
        aria-valuemin={0}
        aria-valuenow={active}
        className={cn(
          'capacity-gauge-track relative w-full overflow-hidden rounded-full bg-surface-subtle',
          size === 'sm' && 'h-2',
          size === 'default' && 'h-2.5',
          size === 'lg' && 'h-3.5',
        )}
        role="progressbar"
      >
        <div
          className={cn(
            'capacity-gauge-fill h-full rounded-full transition-all duration-300 ease-out',
            isLocked || threshold === 'critical'
              ? 'bg-danger'
              : threshold === 'warning'
                ? 'bg-warning'
                : 'bg-success',
          )}
          style={{ width: `${String(percentage)}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-foreground-secondary">
        <p className="flex items-center gap-1.5 font-medium">
          <span
            className={cn(
              'size-1.5 rounded-full shrink-0',
              isLocked || threshold === 'critical'
                ? 'bg-danger'
                : threshold === 'warning'
                  ? 'bg-warning'
                  : 'bg-success',
            )}
            aria-hidden="true"
          />
          {statusText}
        </p>
        <span className="font-mono text-foreground-muted tabular-nums">
          {available} {available === 1 ? 'spot' : 'spots'} left
        </span>
      </div>
    </div>
  );
}
