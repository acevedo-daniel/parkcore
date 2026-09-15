import * as React from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { formatNumber } from '../../lib/format.js';
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
  label,
  size = 'default',
  className,
  ...props
}: CapacityGaugeProps) {
  const { locale, t, tPlural } = useAppearance();
  const resolvedLabel = label ?? t('parking.occupancyGauge');
  const safeCapacity = Math.max(0, capacity);
  const safeActive = Math.min(safeCapacity, Math.max(0, active));
  const percentage =
    safeCapacity === 0 ? 0 : Math.min(100, Math.round((safeActive / safeCapacity) * 100));
  const isLocked = safeCapacity > 0 && safeActive >= safeCapacity;

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
    ? t('parking.intakeLocked')
    : percentage >= 95
      ? t('parking.nearlyFull')
      : percentage >= 90
        ? t('parking.criticalCapacity')
        : percentage >= 70
          ? t('parking.elevatedOccupancy')
          : t('parking.optimalCapacity');

  const badgeVariant = isLocked
    ? 'destructive'
    : threshold === 'critical'
      ? 'destructive'
      : threshold === 'warning'
        ? 'warning'
        : 'success';

  const available = Math.max(0, safeCapacity - safeActive);
  const formattedActive = formatNumber(safeActive, locale);
  const formattedAvailable = formatNumber(available, locale);
  const formattedCapacity = formatNumber(safeCapacity, locale);
  const formattedPercentage = formatNumber(percentage, locale);

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
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
          {resolvedLabel}
        </span>
        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant} dot size="sm">
            {formattedPercentage}%
          </Badge>
          <span className="font-mono text-xs sm:text-sm font-bold tabular-nums text-foreground">
            {formattedActive} / {formattedCapacity}
          </span>
        </div>
      </div>

      <div
        aria-label={t('parkingOperation.occupancyLabel', {
          active: formattedActive,
          capacity: formattedCapacity,
        })}
        aria-valuemax={safeCapacity}
        aria-valuemin={0}
        aria-valuenow={safeActive}
        aria-valuetext={t('parking.occupancySummary', {
          active: formattedActive,
          available: formattedAvailable,
          capacity: formattedCapacity,
          percent: formattedPercentage,
        })}
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

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-secondary">
        <p className="flex min-w-0 items-center gap-1.5 break-words font-medium">
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
          {tPlural(
            available,
            { one: 'parking.spot', other: 'parking.spots' },
            {
              count: formattedAvailable,
            },
          )}{' '}
          {t('parking.openSpots')}
        </span>
      </div>
    </div>
  );
}
