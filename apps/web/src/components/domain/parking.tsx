import type { components } from '@parkcore/api-client';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

import { cn } from '../../lib/cn.js';
import { formatMoney } from '../../lib/format.js';
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
  return (
    <div className="rate-display">
      <span className="type-operational">{formatMoney(hourlyRateCents, currency)}</span>
      <span className="type-label">Per hour</span>
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

export function OccupancyMeter({ active, capacity }: { active: number; capacity: number }) {
  const percentage = capacity === 0 ? 0 : Math.min(100, Math.round((active / capacity) * 100));
  const threshold = percentage >= 90 ? 'critical' : percentage >= 70 ? 'warning' : 'neutral';
  return (
    <div className={cn('occupancy', `occupancy-${threshold}`)}>
      <div className="occupancy-heading">
        <span className="type-metric">
          {active} / {capacity}
        </span>
        <span className="type-label">Occupied</span>
      </div>
      <div
        aria-label={`${String(active)} of ${String(capacity)} spaces occupied`}
        aria-valuemax={capacity}
        aria-valuemin={0}
        aria-valuenow={active}
        className="occupancy-track"
        role="progressbar"
      >
        <div className="occupancy-fill" style={{ width: `${String(percentage)}%` }} />
      </div>
    </div>
  );
}

interface ParkingListItemProps {
  activeSessions?: number;
  identifier?: number;
  parking: Parking;
  to: string;
}

export function ParkingListItem({ activeSessions, identifier, parking, to }: ParkingListItemProps) {
  const available =
    activeSessions === undefined ? undefined : Math.max(0, parking.capacity - activeSessions);
  return (
    <Link aria-label={`Open ${parking.title}`} className="parking-list-item" to={to}>
      <div>
        <ParkingIdentity identifier={identifier} parking={parking} />
      </div>
      <div className="parking-list-metrics">
        <ParkingStatus isActive={parking.isActive} />
        <RateDisplay currency={parking.currency} hourlyRateCents={parking.hourlyRateCents} />
        {available === undefined ? (
          <span className="type-small">Capacity {parking.capacity}</span>
        ) : (
          <span className="type-operational">{available} free</span>
        )}
        <ArrowUpRight aria-hidden="true" size={18} />
      </div>
    </Link>
  );
}
