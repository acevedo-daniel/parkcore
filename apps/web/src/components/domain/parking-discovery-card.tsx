import { ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import type { PublicParking } from '../../lib/api/public-api.js';
import { formatMoney, formatNumber } from '../../lib/format.js';
import { Badge } from '../ui/badge.js';
import { AvailabilityIndicator } from './availability-indicator.js';
import { PublicParkingImage } from './public-parking-image.js';

interface ParkingDiscoveryCardProps {
  parking: PublicParking;
  to: string;
}

export function ParkingDiscoveryCard({ parking, to }: ParkingDiscoveryCardProps) {
  const { locale, t } = useAppearance();
  const availabilityId = `parking-${parking.id}-availability`;

  return (
    <Link
      aria-label={`${t('parking.open')} ${parking.title}`}
      aria-describedby={availabilityId}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-xs transition-lift duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-md"
      to={to}
    >
      <div
        className="relative aspect-4/3 overflow-hidden bg-accent"
        data-slot="discovery-card-media"
      >
        <PublicParkingImage
          alt={t('parking.discoveryImageAlt', { title: parking.title })}
          image={parking.image}
          imageClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
        />
        <div className="absolute inset-x-4 top-4 flex flex-wrap items-start justify-between gap-2">
          <AvailabilityIndicator
            className="bg-card/95 backdrop-blur-sm"
            id={availabilityId}
            state={parking.availabilityState}
            timezone={parking.timezone}
            nextOpeningAt={parking.nextOpeningAt}
          />
          {parking.isShowcase ? (
            <Badge size="sm" variant="brand">
              {t('parking.demo')}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex-1">
          <h2 className="max-w-full break-words font-display text-2xl font-bold leading-tight tracking-title">
            {parking.title}
          </h2>
          <p className="max-w-full break-words text-sm font-semibold text-foreground-secondary">
            {parking.neighborhood}
          </p>
          <p className="mt-3 flex min-w-0 items-start gap-2 text-sm leading-relaxed text-foreground-secondary">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
            <span className="min-w-0 break-words">{parking.address}</span>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-border-subtle pt-5">
          <span>
            <span className="block text-xs font-medium text-muted-foreground">
              {t('parking.hourlyRate')}
            </span>
            <span className="type-operational text-lg font-bold">
              {formatMoney(parking.hourlyRateCents, parking.currency, locale)}
              <span className="text-xs font-medium"> / h</span>
            </span>
          </span>
          <span className="text-right text-xs font-semibold text-foreground-secondary">
            {t('parking.availableSpaces', {
              available: formatNumber(parking.availableSpaces, locale),
              capacity: formatNumber(parking.capacity, locale),
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
