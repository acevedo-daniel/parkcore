import { ArrowUpRight, MapPin } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import type { Parking } from '../../lib/api/owner-api.js';
import { formatMoney } from '../../lib/format.js';

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
  const { language } = useAppearance();
  const es = language === 'es';
  const occupancy =
    activeSessionCount === undefined || parking.capacity === 0
      ? 0
      : Math.min(100, Math.round((activeSessionCount / parking.capacity) * 100));
  const available = Math.max(0, parking.capacity - (activeSessionCount ?? 0));

  return (
    <Link
      aria-label={
        es ? `Abrir operaciones de ${parking.title}` : `Open operations for ${parking.title}`
      }
      className="owner-parking-panel group flex min-h-72 flex-col justify-between rounded-[var(--radius-xl)] border border-border bg-surface p-5 text-foreground shadow-xs transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-surface-hover hover:shadow-hover focus-visible:outline-none"
      to={`/app/parkings/${parking.id}`}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-border-strong px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
            {es ? 'Cochera' : 'Facility'} {String(identifier).padStart(2, '0')}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold">
            {es ? 'Abrir' : 'Open'}
            <ArrowUpRight
              aria-hidden="true"
              className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </div>

        <h3 className="mt-7 font-display text-2xl font-bold leading-[0.95] tracking-[-0.055em]">
          {parking.title}
        </h3>
        <p className="mt-3 flex items-start gap-2 text-sm leading-snug text-foreground-secondary">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{parking.address}</span>
        </p>
      </div>

      <div className="mt-8 border-t border-border-subtle pt-4">
        {occupancyError ? (
          <p className="text-sm text-foreground-secondary" role="status">
            {es ? 'La ocupación no está disponible ahora.' : 'Occupancy is unavailable right now.'}
          </p>
        ) : occupancyLoading || activeSessionCount === undefined ? (
          <div
            className="animate-pulse space-y-2"
            aria-label={es ? 'Cargando ocupación' : 'Loading occupancy'}
          >
            <div className="h-3 w-28 rounded-full bg-surface-emphasis" />
            <div className="h-2 w-full rounded-full bg-surface-emphasis" />
          </div>
        ) : (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-sm font-bold tabular-nums">
                {activeSessionCount} / {parking.capacity}
              </p>
              <p className="text-xs font-semibold text-foreground-secondary">
                {available} {es ? 'libres' : 'open'} · {occupancy}%
              </p>
            </div>
            <div
              aria-label={
                es
                  ? `${String(activeSessionCount)} de ${String(parking.capacity)} plazas ocupadas`
                  : `${String(activeSessionCount)} of ${String(parking.capacity)} spots occupied`
              }
              aria-valuemax={parking.capacity}
              aria-valuemin={0}
              aria-valuenow={activeSessionCount}
              className="mt-3 h-2 overflow-hidden rounded-full bg-surface-emphasis"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${String(occupancy)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-foreground-secondary">
            {parking.isActive ? (es ? 'En operación' : 'Operating') : es ? 'Pausada' : 'Paused'}
          </span>
          <span className="font-mono text-sm font-bold tabular-nums">
            {formatMoney(parking.hourlyRateCents, parking.currency)}
            <span className="font-sans text-xs font-medium text-foreground-secondary"> / h</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
