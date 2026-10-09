import type { components } from '@parkcore/api-client';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { cn } from '../../lib/cn.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { ParkingStatus } from './status.js';
import { Progress, type ProgressTone } from '../ui/progress.js';

type Parking = components['schemas']['ParkingResponse'];

export function ParkingIdentity({
  identifier,
  parking,
}: {
  identifier?: number | string;
  parking: Pick<Parking, 'title' | 'address'>;
}) {
  return (
    <div className="parking-identity">
      {identifier !== undefined ? (
        <p className="type-label">P / {String(identifier).padStart(2, '0')}</p>
      ) : null}
      <h2 className="parking-name">{parking.title}</h2>
      <p className="field-help">{parking.address}</p>
    </div>
  );
}

export function RateDisplay({
  currency,
  hourlyRateCents,
}: Pick<Parking, 'currency' | 'hourlyRateCents'>) {
  const { locale, t } = useAppearance();
  return (
    <div className="rate-display">
      <span className="type-operational">{formatMoney(hourlyRateCents, currency, locale)}</span>
      <span className="type-label">{t('parking.perHour')}</span>
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span className="type-metric">{value}</span>
      <span className="type-label metric-label">{label}</span>
    </div>
  );
}

export function OccupancyMeter({
  active,
  availableSpaces,
  capacity,
  compact = false,
  occupancyPercent,
}: {
  active: number;
  availableSpaces?: number;
  capacity: number;
  compact?: boolean;
  occupancyPercent?: number;
}) {
  const { locale, t, tPlural } = useAppearance();
  const safeCapacity = Math.max(0, capacity);
  const safeActive = Math.min(safeCapacity, Math.max(0, active));
  const safeAvailable = Math.min(
    safeCapacity,
    Math.max(0, availableSpaces ?? safeCapacity - safeActive),
  );
  const percentage = Math.max(
    0,
    Math.min(100, occupancyPercent ?? (safeCapacity === 0 ? 0 : (safeActive / safeCapacity) * 100)),
  );
  const displayPercentage = Math.round(percentage);
  const formattedActive = formatNumber(safeActive, locale);
  const formattedAvailable = formatNumber(safeAvailable, locale);
  const formattedCapacity = formatNumber(safeCapacity, locale);
  const formattedPercentage = formatNumber(displayPercentage, locale);
  const threshold =
    safeAvailable === 0 && safeCapacity > 0
      ? 'full'
      : percentage >= 90
        ? 'critical'
        : percentage >= 70
          ? 'warning'
          : 'optimal';
  const status =
    threshold === 'full'
      ? t('parking.intakeLocked')
      : threshold === 'critical'
        ? percentage >= 95
          ? t('parking.nearlyFull')
          : t('parking.criticalCapacity')
        : threshold === 'warning'
          ? t('parking.elevatedOccupancy')
          : t('parking.optimalCapacity');
  const tone: ProgressTone =
    threshold === 'optimal' ? 'success' : threshold === 'warning' ? 'warning' : 'destructive';
  return (
    <div
      className={cn(
        'capacity-gauge grid gap-2 rounded-lg border border-border bg-card p-4',
        compact && 'border-0 bg-transparent p-0 shadow-none',
      )}
      data-slot="capacity-gauge"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="type-label">{t('parking.occupancyGauge')}</span>
        <span className="type-operational text-sm">
          {formattedActive} / {formattedCapacity} {t('parking.inside')}
        </span>
      </div>
      <Progress
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
        className="h-2"
        max={Math.max(safeCapacity, 1)}
        tone={tone}
        value={safeActive}
      />
      <p className="flex flex-wrap items-center gap-2 break-words text-xs text-foreground-secondary">
        <span className="flex min-w-0 items-center gap-1.5 font-medium">
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              tone === 'success'
                ? 'bg-success'
                : tone === 'warning'
                  ? 'bg-warning'
                  : 'bg-destructive',
            )}
          />
          {status}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {formattedAvailable}{' '}
          {tPlural(
            safeAvailable,
            { one: 'parking.spot', other: 'parking.spots' },
            {
              count: formattedAvailable,
            },
          )}{' '}
          {t('parking.openSpots')}
        </span>
      </p>
    </div>
  );
}

interface ParkingListItemProps {
  activeSessions?: number;
  identifier?: number;
  occupancyUnavailable?: boolean;
  parking: Parking;
  to: string;
}

export function ParkingListItem({
  activeSessions,
  identifier,
  occupancyUnavailable = false,
  parking,
  to,
}: ParkingListItemProps) {
  const { t } = useAppearance();
  const available =
    activeSessions === undefined ? undefined : Math.max(0, parking.capacity - activeSessions);
  return (
    <Link
      aria-label={`${t('parking.open')} ${parking.title}`}
      className="parking-list-item"
      to={to}
    >
      <div>
        <ParkingIdentity identifier={identifier} parking={parking} />
      </div>
      <div className="parking-list-metrics">
        <ParkingStatus isActive={parking.isActive} />
        <RateDisplay currency={parking.currency} hourlyRateCents={parking.hourlyRateCents} />
        {occupancyUnavailable ? (
          <span className="type-small">{t('parkingOperation.occupancyUnavailable')}</span>
        ) : available === undefined ? (
          <span className="type-small">
            {t('parkingOperation.capacity')} {parking.capacity}
          </span>
        ) : (
          <span className="type-operational">
            {activeSessions} / {parking.capacity} {t('parking.occupied')}
          </span>
        )}
        <ArrowUpRight aria-hidden="true" size={18} />
      </div>
    </Link>
  );
}
