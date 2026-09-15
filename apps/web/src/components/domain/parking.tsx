import type { components } from '@parkcore/api-client';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { cn } from '../../lib/cn.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { ParkingStatus } from './status.js';

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
  return (
    <div
      className={cn(
        'capacity-gauge',
        compact && 'border-0 bg-transparent p-0 shadow-none',
        `capacity-gauge-${threshold}`,
        `occupancy-${threshold === 'optimal' ? 'neutral' : threshold}`,
      )}
    >
      <div className="capacity-gauge-heading">
        <span className="type-label">{t('parking.occupancyGauge')}</span>
        <span className="type-operational">
          {formattedActive} / {formattedCapacity} {t('parking.inside')}
        </span>
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
        className="capacity-gauge-track"
        role="progressbar"
      >
        <div className="capacity-gauge-fill" style={{ width: `${String(percentage)}%` }} />
      </div>
      <p className="capacity-gauge-status break-words">
        <span aria-hidden="true">●</span> {status} · {formattedAvailable}{' '}
        {tPlural(
          safeAvailable,
          { one: 'parking.spot', other: 'parking.spots' },
          {
            count: formattedAvailable,
          },
        )}{' '}
        {t('parking.openSpots')}
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
