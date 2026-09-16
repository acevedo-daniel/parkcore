import { ArrowUpRight, History as HistoryIcon, MapPin, Pencil } from 'lucide-react';
import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import {
  AvailabilityIndicator,
  type AvailabilityState,
} from '../../components/domain/availability-indicator.js';
import type { Parking } from '../../lib/api/owner-api.js';
import { cn } from '../../lib/cn.js';
import { formatMoney, formatNumber } from '../../lib/format.js';

const occupancyFillByState: Record<AvailabilityState, string> = {
  AVAILABLE: 'bg-success',
  CLOSED: 'bg-foreground-muted',
  FULL: 'bg-danger',
  LIMITED: 'bg-warning',
  PAUSED: 'bg-warning',
};

type OwnerParkingPanelPresentation = 'overview' | 'list';

interface OwnerParkingPanelProps {
  identifier: number;
  parking: Parking;
  presentation: OwnerParkingPanelPresentation;
}

export function OwnerParkingPanel({ identifier, parking, presentation }: OwnerParkingPanelProps) {
  const { locale } = useAppearance();
  const capacity = Math.max(0, parking.capacity);
  const activeSessionCount = Math.min(capacity, Math.max(0, parking.activeSessionCount));
  const availableSpaces = Math.min(capacity, Math.max(0, parking.availableSpaces));
  const occupancyPercent = Math.min(100, Math.max(0, parking.occupancyPercent));
  const occupancyProps = {
    activeSessionCount: formatNumber(activeSessionCount, locale),
    availableSpaces: formatNumber(availableSpaces, locale),
    capacity: formatNumber(capacity, locale),
    occupancyPercent: formatNumber(occupancyPercent, locale, {
      maximumFractionDigits: 1,
    }),
    occupancyPercentValue: occupancyPercent,
    parking,
  };

  return (
    <article
      className={cn(
        'owner-parking-panel min-w-0 bg-surface p-5 text-foreground sm:p-6',
        presentation === 'overview'
          ? 'flex flex-col gap-5'
          : 'grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center md:gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,auto)]',
      )}
      data-presentation={presentation}
      data-slot="owner-parking-panel"
    >
      <FacilityIdentity identifier={identifier} parking={parking} />
      {presentation === 'overview' ? (
        <>
          <div className="grid min-w-0 gap-5 border-t border-border-subtle pt-5 wide:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <OccupancySummary {...occupancyProps} />
            <FacilityState parking={parking} presentation={presentation} />
          </div>
          <FacilityActions parking={parking} presentation={presentation} />
        </>
      ) : (
        <>
          <OccupancySummary {...occupancyProps} />
          <FacilityState parking={parking} presentation={presentation} />
          <FacilityActions parking={parking} presentation={presentation} />
        </>
      )}
    </article>
  );
}

function FacilityIdentity({ identifier, parking }: { identifier: number; parking: Parking }) {
  const { locale, t } = useAppearance();

  return (
    <div className="min-w-0">
      <p className="type-label text-foreground-muted">
        {t('ownerParkings.facilityNumber', { number: String(identifier).padStart(2, '0') })}
      </p>
      <h3 className="mt-2 break-words font-display text-2xl font-bold leading-tight tracking-[-0.045em]">
        {parking.title}
      </h3>
      <p className="mt-3 flex min-w-0 items-start gap-2 text-sm leading-relaxed text-foreground-secondary">
        <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span className="min-w-0 break-words">
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
  );
}

interface OccupancySummaryProps {
  activeSessionCount: string;
  availableSpaces: string;
  capacity: string;
  occupancyPercent: string;
  occupancyPercentValue: number;
  parking: Parking;
}

function OccupancySummary({
  activeSessionCount,
  availableSpaces,
  capacity,
  occupancyPercent,
  occupancyPercentValue,
  parking,
}: OccupancySummaryProps) {
  const { t } = useAppearance();
  const occupancySummary = t('ownerParkings.occupancySummary', {
    active: activeSessionCount,
    available: availableSpaces,
    capacity,
    percent: occupancyPercent,
  });

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="type-label text-foreground-muted">{t('ownerParkings.occupancy')}</p>
          <p className="mt-2 break-words font-mono text-lg font-bold tabular-nums">
            {t('ownerParkings.occupancyValue', {
              active: activeSessionCount,
              capacity,
            })}
          </p>
        </div>
        <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-foreground-secondary">
          {occupancyPercent}%
        </span>
      </div>
      <div
        aria-label={occupancySummary}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={occupancyPercentValue}
        aria-valuetext={occupancySummary}
        className="mt-4 h-2 overflow-hidden rounded-full bg-surface-emphasis"
        role="progressbar"
      >
        <div
          className={`h-full rounded-full ${occupancyFillByState[parking.availabilityState]}`}
          style={{ width: `${String(occupancyPercentValue)}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground-secondary">
        {t('ownerParkings.availableSpaces', { count: availableSpaces })}
      </p>
    </div>
  );
}

function FacilityState({
  parking,
  presentation,
}: {
  parking: Parking;
  presentation: OwnerParkingPanelPresentation;
}) {
  const { t } = useAppearance();
  const isOverview = presentation === 'overview';

  return (
    <div
      className={cn(
        'min-w-0',
        isOverview
          ? 'flex flex-wrap items-start gap-x-5 gap-y-3 wide:flex-col wide:gap-4'
          : 'flex items-start justify-between gap-4 md:flex-col md:justify-center',
      )}
    >
      <div className="min-w-0">
        <p className="type-label text-foreground-muted">{t('ownerParkings.status')}</p>
        <AvailabilityIndicator
          className="mt-2"
          nextOpeningAt={parking.nextOpeningAt}
          state={parking.availabilityState}
          timezone={parking.timezone}
        />
      </div>
      <div className={cn('min-w-0', !isOverview && 'text-right md:text-left')}>
        <p className="type-label text-foreground-muted">{t('ownerParkings.listing')}</p>
        <p className="mt-2 break-words text-sm font-semibold">
          {parking.isListed ? t('ownerParkings.listed') : t('ownerParkings.notListed')}
        </p>
      </div>
    </div>
  );
}

function FacilityActions({
  parking,
  presentation,
}: {
  parking: Parking;
  presentation: OwnerParkingPanelPresentation;
}) {
  const { t } = useAppearance();
  const isOverview = presentation === 'overview';

  return (
    <div
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-2',
        isOverview
          ? 'border-t border-border-subtle pt-5'
          : 'justify-between border-t border-border-subtle pt-5 md:flex-col md:items-stretch md:border-t-0 md:pt-0',
      )}
    >
      <Link
        aria-label={t('ownerParkings.openAria', { title: parking.title })}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset"
        to={`/app/parkings/${parking.id}`}
      >
        {t('ownerParkings.open')}
        <ArrowUpRight aria-hidden="true" className="size-4" />
      </Link>
      <div
        className={cn(
          'flex min-w-0 flex-wrap items-center gap-1',
          !isOverview && 'justify-end md:justify-start',
        )}
      >
        <Link
          aria-label={t('ownerParkings.editAria', { title: parking.title })}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-semibold text-foreground-secondary underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset"
          to={`/app/parkings/${parking.id}/edit`}
        >
          <Pencil aria-hidden="true" className="size-3.5" />
          {t('ownerParkings.edit')}
        </Link>
        <Link
          aria-label={t('ownerParkings.historyAria', { title: parking.title })}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-semibold text-foreground-secondary underline decoration-accent decoration-2 underline-offset-4 transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset"
          to={`/app/parkings/${parking.id}/sessions`}
        >
          <HistoryIcon aria-hidden="true" className="size-3.5" />
          {t('ownerParkings.history')}
        </Link>
      </div>
    </div>
  );
}
