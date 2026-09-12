import { ArrowUpRight, History as HistoryIcon, MapPin, Pencil } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import {
  AvailabilityIndicator,
  type AvailabilityState,
} from '../../components/domain/availability-indicator.js';
import type { Parking } from '../../lib/api/owner-api.js';
import { formatMoney } from '../../lib/format.js';

const occupancyFillByState: Record<AvailabilityState, string> = {
  AVAILABLE: 'bg-success',
  CLOSED: 'bg-foreground-muted',
  FULL: 'bg-danger',
  LIMITED: 'bg-warning',
  PAUSED: 'bg-warning',
};

export function OwnerParkingPanel({
  identifier,
  parking,
}: {
  identifier: number;
  parking: Parking;
}) {
  const { locale, t } = useAppearance();
  const capacity = Math.max(0, parking.capacity);
  const activeSessionCount = Math.min(capacity, Math.max(0, parking.activeSessionCount));
  const availableSpaces = Math.min(capacity, Math.max(0, parking.availableSpaces));
  const occupancyPercent = Math.min(100, Math.max(0, parking.occupancyPercent));

  return (
    <article className="owner-parking-panel grid gap-6 bg-surface p-5 text-foreground sm:p-6 md:grid-cols-[minmax(0,1.4fr)_minmax(12rem,1fr)] md:items-center md:gap-8 lg:grid-cols-[minmax(14rem,1.4fr)_minmax(12rem,1fr)_minmax(10rem,0.8fr)_auto]">
      <div className="min-w-0">
        <p className="type-label text-foreground-muted">
          {t('ownerParkings.facilityNumber', { number: String(identifier).padStart(2, '0') })}
        </p>
        <h3 className="mt-2 truncate font-display text-2xl font-bold leading-tight tracking-[-0.045em]">
          {parking.title}
        </h3>
        <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-foreground-secondary">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-semibold text-foreground">{parking.neighborhood}</span>
            <span aria-hidden="true"> · </span>
            {parking.address}
          </span>
        </p>
        <p className="mt-4 text-sm text-foreground-secondary">
          <span className="type-label mr-2 text-foreground-muted">{t('ownerParkings.rate')}</span>
          <span className="font-mono font-semibold tabular-nums">
            {formatMoney(parking.hourlyRateCents, parking.currency, locale)}
          </span>{' '}
          <span>{t('parking.perHour')}</span>
        </p>
      </div>

      <div className="min-w-0">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="type-label text-foreground-muted">{t('ownerParkings.occupancy')}</p>
            <p className="mt-2 font-mono text-lg font-bold tabular-nums">
              {t('ownerParkings.occupancyValue', {
                active: activeSessionCount,
                capacity,
              })}
            </p>
          </div>
          <span className="font-mono text-sm font-bold tabular-nums text-foreground-secondary">
            {occupancyPercent}%
          </span>
        </div>
        <div
          aria-label={t('ownerParkings.occupancySummary', {
            active: activeSessionCount,
            available: availableSpaces,
            capacity,
            percent: occupancyPercent,
          })}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={occupancyPercent}
          aria-valuetext={t('ownerParkings.occupancySummary', {
            active: activeSessionCount,
            available: availableSpaces,
            capacity,
            percent: occupancyPercent,
          })}
          className="mt-4 h-2 overflow-hidden rounded-full bg-surface-emphasis"
          role="progressbar"
        >
          <div
            className={`h-full rounded-full ${occupancyFillByState[parking.availabilityState]}`}
            style={{ width: `${String(occupancyPercent)}%` }}
          />
        </div>
        <p className="mt-3 text-sm font-semibold text-foreground-secondary">
          {t('ownerParkings.availableSpaces', { count: availableSpaces })}
        </p>
      </div>

      <div className="flex items-start justify-between gap-4 md:flex-col md:justify-center">
        <div>
          <p className="type-label text-foreground-muted">{t('ownerParkings.status')}</p>
          <AvailabilityIndicator
            className="mt-2"
            nextOpeningAt={parking.nextOpeningAt}
            state={parking.availabilityState}
            timezone={parking.timezone}
          />
        </div>
        <div className="text-right md:text-left">
          <p className="type-label text-foreground-muted">{t('ownerParkings.listing')}</p>
          <p className="mt-2 text-sm font-semibold">
            {parking.isListed ? t('ownerParkings.listed') : t('ownerParkings.notListed')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-5 md:flex-col md:items-stretch md:border-t-0 md:pt-0">
        <Link
          aria-label={t('ownerParkings.openAria', { title: parking.title })}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset"
          to={`/app/parkings/${parking.id}`}
        >
          {t('ownerParkings.open')}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
        <div className="flex items-center justify-end gap-1 md:justify-start">
          <Link
            aria-label={t('ownerParkings.editAria', { title: parking.title })}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-semibold text-foreground-secondary underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset"
            to={`/app/parkings/${parking.id}/edit`}
          >
            <Pencil aria-hidden="true" className="size-3.5" />
            {t('ownerParkings.edit')}
          </Link>
          <Link
            aria-label={t('ownerParkings.historyAria', { title: parking.title })}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-semibold text-foreground-secondary underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset"
            to={`/app/parkings/${parking.id}/sessions`}
          >
            <HistoryIcon aria-hidden="true" className="size-3.5" />
            {t('ownerParkings.history')}
          </Link>
        </div>
      </div>
    </article>
  );
}
