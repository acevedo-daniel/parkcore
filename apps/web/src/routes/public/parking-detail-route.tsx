import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { AvailabilityIndicator } from '../../components/domain/availability-indicator.js';
import { PublicParkingImage } from '../../components/domain/public-parking-image.js';
import { Button } from '../../components/ui/button.js';
import { ParkingCalculatorWidget } from '../../features/parking/parking-calculator-widget.js';
import { getPublicParking, PublicApiError } from '../../lib/api/public-api.js';
import { publicUrl, useDocumentMeta } from '../../lib/document-meta.js';
import { formatMoney } from '../../lib/format.js';

export function ParkingDetailRoute() {
  const { locale, t } = useAppearance();
  const { parkingId } = useParams();
  const parkingQuery = useQuery({
    queryKey: ['public-parking', parkingId],
    enabled: Boolean(parkingId),
    queryFn: () => getPublicParking(parkingId ?? ''),
  });
  const parking = parkingQuery.data;

  useDocumentMeta({
    description: parking
      ? t('public.detail.metaDescription', { address: parking.address, title: parking.title })
      : t('public.detail.metaDescriptionFallback'),
    noIndex: parkingQuery.isError,
    publicUrl: parking ? publicUrl(`/parkings/${parking.id}`) : undefined,
    title: parking
      ? t('public.detail.metaTitleWithTitle', { title: parking.title })
      : t('public.detail.metaTitle'),
  });

  if (parkingQuery.isLoading) return <ParkingDetailSkeleton />;
  if (parkingQuery.isError) {
    const notFound =
      parkingQuery.error instanceof PublicApiError && parkingQuery.error.status === 404;
    return (
      <section className="min-h-full bg-canvas px-4 py-16 sm:px-6 lg:px-8">
        <div
          className="mx-auto max-w-3xl rounded-[2rem] border border-border-strong bg-surface-emphasis p-8 sm:p-10"
          role="alert"
        >
          <p className="type-label text-foreground-muted">{t('public.detail.directoryEyebrow')}</p>
          <h1 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-foreground">
            {t(notFound ? 'public.detail.notFoundTitle' : 'public.detail.errorTitle')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-foreground-secondary">
            {t(notFound ? 'public.detail.notFoundDescription' : 'public.detail.errorDescription')}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {!notFound ? (
              <Button
                onClick={() => {
                  void parkingQuery.refetch();
                }}
                variant="primary"
              >
                {t('public.detail.retry')}
              </Button>
            ) : null}
            <Button asChild variant="secondary">
              <Link to="/parkings">{t('public.detail.back')}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }
  if (!parking) return null;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${String(parking.lat)},${String(parking.lng)}`;
  const scheduleLabel = parking.is24Hours
    ? t('public.detail.schedule24')
    : parking.opensAt && parking.closesAt
      ? t('public.detail.scheduleRange', {
          closesAt: parking.closesAt,
          opensAt: parking.opensAt,
        })
      : t('public.detail.scheduleUnavailable');

  return (
    <article className="min-h-full bg-canvas pb-20 pt-10 text-foreground sm:pb-28 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          className="inline-flex items-center gap-2 rounded-sm text-sm font-bold text-foreground underline decoration-accent decoration-2 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset"
          to="/parkings"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('public.detail.back')}
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-start">
          <header className="lg:col-span-7">
            {parking.isShowcase ? (
              <span className="mb-4 inline-flex rounded-full border border-accent-strong bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent-foreground">
                {t('parking.demo')}
              </span>
            ) : null}
            <h1 className="mt-2 max-w-3xl font-display text-5xl font-black leading-[0.98] tracking-[-0.055em] text-foreground sm:text-6xl">
              {parking.title}
            </h1>
            <AvailabilityIndicator
              className="mt-5"
              nextOpeningAt={parking.nextOpeningAt}
              state={parking.availabilityState}
              timezone={parking.timezone}
            />
            <p className="mt-5 flex max-w-xl items-start gap-2 text-base leading-relaxed text-foreground-secondary sm:text-lg">
              <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-foreground" />
              <span>
                {parking.neighborhood} · {parking.address}
              </span>
            </p>
          </header>

          <aside className="rounded-[2rem_2rem_4rem_2rem] border border-border bg-surface p-6 shadow-hover lg:col-span-4 lg:col-start-9">
            <p className="type-label text-foreground-muted">{t('public.detail.essentials')}</p>
            <div className="mt-6 grid gap-5 border-y border-border-subtle py-5 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <p className="text-xs font-medium text-foreground-secondary">
                  {t('public.detail.hourlyRate')}
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-foreground">
                  {formatMoney(parking.hourlyRateCents, parking.currency, locale)}{' '}
                  <span className="text-sm">{t('public.detail.perHour')}</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground-secondary">
                  {t('public.detail.availableSpaces')}
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold text-foreground">
                  {parking.availableSpaces}{' '}
                  <span className="text-sm font-medium">{t('public.detail.spacesUnit')}</span>
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-foreground-secondary">
              {t('public.detail.availabilityNote')}
            </p>
            <div className="mt-5 border-t border-border-subtle pt-5">
              <p className="text-xs font-medium text-foreground-secondary">
                {t('public.detail.hours')}
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">{scheduleLabel}</p>
              {parking.nextOpeningAt ? (
                <p className="mt-1 text-xs text-foreground-secondary">
                  {t('public.detail.nextOpening')}{' '}
                  {new Intl.DateTimeFormat(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: parking.timezone,
                  }).format(new Date(parking.nextOpeningAt))}
                </p>
              ) : null}
            </div>
            <div className="mt-6 border-t border-border-subtle pt-5">
              <p className="type-label text-foreground-muted">{t('public.detail.location')}</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
                {t('public.detail.directionsDescription')}
              </p>
              <a
                aria-label={t('public.detail.directionsAction', { title: parking.title })}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-foreground outline-none transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset"
                href={directionsUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('public.detail.directionsAction', { title: parking.title })}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </div>
            {parking.isShowcase ? (
              <p className="mt-5 rounded-2xl bg-accent-soft p-4 text-sm font-medium leading-relaxed text-accent-foreground">
                {t('public.detail.showcaseDisclosure')}
              </p>
            ) : null}
          </aside>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-12">
          <div className="aspect-[16/10] overflow-hidden rounded-[2.5rem_2.5rem_5rem_2.5rem] border border-border bg-surface-emphasis md:col-span-7">
            <PublicParkingImage
              alt={t('parking.discoveryImageAlt', { title: parking.title })}
              fetchPriority="high"
              image={parking.image}
              imageClassName="h-full w-full object-cover"
              loading="eager"
              variant="detail"
            />
          </div>

          <div className="grid gap-6 md:col-span-5 md:col-start-8 xl:col-span-4 xl:col-start-9">
            <section className="rounded-[2rem] border border-border bg-surface p-6 sm:p-7">
              <p className="type-label text-foreground-muted">{t('public.detail.about')}</p>
              <p className="mt-4 text-base leading-relaxed text-foreground-secondary">
                {parking.description ?? t('public.detail.missingDescription')}
              </p>
            </section>
            <ParkingCalculatorWidget className="max-w-none" parking={parking} />
          </div>
        </div>
      </div>
    </article>
  );
}

function ParkingDetailSkeleton() {
  const { t } = useAppearance();
  return (
    <div
      aria-label={t('public.detail.loading')}
      className="min-h-full bg-canvas px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-5 w-36 rounded bg-surface-emphasis" />
        <div className="mt-10 h-16 max-w-2xl rounded bg-surface-emphasis" />
        <div className="mt-5 h-6 max-w-lg rounded bg-surface-emphasis" />
        <div className="mt-12 grid gap-8 md:grid-cols-12">
          <div className="aspect-[16/10] rounded-[2.5rem] bg-surface-emphasis md:col-span-7" />
          <div className="min-h-64 rounded-[2rem] bg-surface-emphasis md:col-span-5 md:col-start-8 xl:col-span-4 xl:col-start-9" />
        </div>
      </div>
    </div>
  );
}
