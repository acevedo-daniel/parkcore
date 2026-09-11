import { ArrowRight, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import type { PublicParking } from '../../lib/api/public-api.js';
import { formatMoney } from '../../lib/format.js';
import { AvailabilityIndicator } from './availability-indicator.js';

interface ParkingDiscoveryCardProps {
  parking: PublicParking;
  to: string;
}

export function ParkingDiscoveryCard({ parking, to }: ParkingDiscoveryCardProps) {
  const { locale, t } = useAppearance();
  const [imageUnavailable, setImageUnavailable] = useState(false);

  return (
    <Link
      aria-label={`${t('parking.open')} ${parking.title}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface text-foreground shadow-xs transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-hover focus-visible:outline-none"
      to={to}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-emphasis">
        {parking.image && !imageUnavailable ? (
          <img
            alt={t('parking.discoveryImageAlt', { title: parking.title })}
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
              <p className="type-label text-accent">{t('parking.fallbackEyebrow')}</p>
              <p className="mt-2 font-display text-lg font-bold leading-tight">
                {t('parking.fallbackMessage')}
              </p>
            </div>
          </div>
        )}
        <AvailabilityIndicator
          className="absolute left-4 top-4 bg-surface/95 backdrop-blur-sm"
          state={parking.availabilityState}
          timezone={parking.timezone}
          nextOpeningAt={parking.nextOpeningAt}
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold leading-tight tracking-[-0.03em]">
            {parking.title}
          </h2>
          {parking.isShowcase ? (
            <span className="mt-2 inline-flex rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-foreground">
              {t('parking.demo')}
            </span>
          ) : null}
          <p className="mt-2 text-sm font-semibold text-foreground-secondary">
            {parking.neighborhood}
          </p>
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-foreground-secondary">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
            {parking.address}
          </p>
        </div>

        <div className="mt-8 flex items-end justify-between gap-4 border-t border-border-subtle pt-5">
          <span>
            <span className="block text-xs font-medium text-foreground-muted">
              {t('parking.hourlyRate')}
            </span>
            <span className="font-mono text-lg font-bold tabular-nums">
              {formatMoney(parking.hourlyRateCents, parking.currency, locale)}
              <span className="text-xs font-medium"> / h</span>
            </span>
          </span>
          <span className="text-right text-xs font-semibold text-foreground-secondary">
            {t('parking.availableSpaces', {
              available: parking.availableSpaces,
              capacity: parking.capacity,
            })}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold">
            {t('parking.viewDetails')}
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
