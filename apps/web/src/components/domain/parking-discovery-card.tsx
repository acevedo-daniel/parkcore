import { ArrowRight, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import type { PublicParking } from '../../lib/api/public-api.js';
import { formatMoney } from '../../lib/format.js';

interface ParkingDiscoveryCardProps {
  es: boolean;
  parking: PublicParking;
  to: string;
}

export function ParkingDiscoveryCard({ es, parking, to }: ParkingDiscoveryCardProps) {
  const [imageUnavailable, setImageUnavailable] = useState(false);

  return (
    <Link
      aria-label={`${es ? 'Abrir' : 'Open'} ${parking.title}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface text-foreground shadow-xs transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-hover focus-visible:outline-none"
      to={to}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-emphasis">
        {parking.image && !imageUnavailable ? (
          <img
            alt={`${parking.title} ${es ? 'cochera' : 'parking facility'}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            decoding="async"
            loading="lazy"
            onError={() => {
              setImageUnavailable(true);
            }}
            src={parking.image}
          />
        ) : (
          <div className="flex h-full items-end bg-surface-inverse p-5 text-foreground-on-inverse">
            <div className="max-w-52 border-l-4 border-accent pl-4">
              <p className="type-label text-accent">{es ? 'La cochera' : 'The facility'}</p>
              <p className="mt-2 font-display text-lg font-bold leading-tight">
                {es ? 'Información clara para llegar.' : 'Clear information before you arrive.'}
              </p>
            </div>
          </div>
        )}
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-xs backdrop-blur-sm">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
          {es ? 'Disponible ahora' : 'Available now'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold leading-tight tracking-[-0.03em]">
            {parking.title}
          </h2>
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-foreground-secondary">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
            {parking.address}
          </p>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4 border-t border-border-subtle pt-5">
          <span>
            <span className="block text-xs font-medium text-foreground-muted">
              {es ? 'Tarifa por hora' : 'Hourly rate'}
            </span>
            <span className="font-mono text-lg font-bold tabular-nums">
              {formatMoney(parking.hourlyRateCents, parking.currency)}
              <span className="text-xs font-medium"> / h</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold">
            {es ? 'Ver detalles' : 'View details'}
            <ArrowRight
              aria-hidden="true"
              className="size-3.5 transition-transform group-hover:translate-x-1"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
