import { ArrowUpRight, MapPin } from 'lucide-react';
import { Link } from 'react-router';

import type { Parking } from '../../lib/api/owner-api.js';
import { formatMoney } from '../../lib/format.js';
import { CapacityGauge } from '../../components/ui/capacity-gauge.js';
import { ParkingStatus } from '../../components/domain/status.js';

export function OwnerParkingPanel({
  activeSessionCount,
  identifier,
  occupancyError = false,
  occupancyLoading = false,
  parking,
}: {
  activeSessionCount?: number;
  identifier: number;
  occupancyError?: boolean;
  occupancyLoading?: boolean;
  parking: Parking;
}) {
  return (
    <Link
      aria-label={`Open operations for ${parking.title}`}
      className="owner-parking-panel group relative flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-hover parkcore-pressable focus-visible:outline-none"
      to={`/app/parkings/${parking.id}`}
    >
      <div>
        <div className="owner-parking-panel-header flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            P / {String(identifier).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-3">
            <ParkingStatus isActive={parking.isActive} />
            <span className="owner-panel-link flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
              Open{' '}
              <ArrowUpRight
                aria-hidden="true"
                className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </span>
          </div>
        </div>

        <h3 className="font-display text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {parking.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground-secondary line-clamp-1">
          <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-foreground-muted" />
          <span>{parking.address}</span>
        </p>
      </div>

      <div className="owner-parking-panel-data space-y-4">
        {occupancyError ? (
          <div
            className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-subtle p-3 text-center text-xs text-foreground-muted"
            role="status"
          >
            Occupancy unavailable
          </div>
        ) : occupancyLoading || activeSessionCount === undefined ? (
          <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-subtle p-4 animate-pulse">
            <div className="h-4 w-1/3 bg-surface-hover rounded mb-2" />
            <div className="h-2 w-full bg-surface-hover rounded-full" />
          </div>
        ) : (
          <CapacityGauge active={activeSessionCount} capacity={parking.capacity} />
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-foreground-secondary">
          <span className="font-mono uppercase tracking-wider text-foreground-muted">
            Hourly rate
          </span>
          <span className="font-mono font-bold text-sm tabular-nums text-foreground">
            {formatMoney(parking.hourlyRateCents, parking.currency)}
            <span className="text-foreground-muted text-xs font-normal"> / hr</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
