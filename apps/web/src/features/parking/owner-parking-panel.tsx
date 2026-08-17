import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';

import type { Parking } from '../../lib/api/owner-api.js';
import {
  Metric,
  OccupancyMeter,
  ParkingIdentity,
  RateDisplay,
} from '../../components/domain/parking.js';
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
      className="owner-parking-panel"
      to={`/app/parkings/${parking.id}`}
    >
      <div className="owner-parking-panel-header">
        <ParkingIdentity identifier={identifier} parking={parking} />
        <span className="owner-panel-link">
          Open <ArrowUpRight aria-hidden="true" size={17} />
        </span>
      </div>
      <div className="owner-parking-panel-data">
        <ParkingStatus isActive={parking.isActive} />
        {occupancyError ? (
          <span className="type-small" role="status">
            Occupancy unavailable
          </span>
        ) : occupancyLoading || activeSessionCount === undefined ? (
          <span className="type-small">Loading occupancy…</span>
        ) : (
          <OccupancyMeter active={activeSessionCount} capacity={parking.capacity} />
        )}
        <Metric label="Capacity" value={parking.capacity} />
        <RateDisplay currency={parking.currency} hourlyRateCents={parking.hourlyRateCents} />
      </div>
    </Link>
  );
}
