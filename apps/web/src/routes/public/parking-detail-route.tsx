import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { AvailabilityIndicator } from '../../components/domain/availability-indicator.js';
import { PublicParkingImage } from '../../components/domain/public-parking-image.js';
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
    title: parking ? `${parking.title} | ParkCore` : t('public.detail.metaTitle'),
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
              <button
                className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-hover"
                onClick={() => {
                  void parkingQuery.refetch();
                }}
                type="button"
              >
                {t('public.detail.retry')}
              </button>
            ) : null}
            <Link
              className="rounded-full border border-border px-5 py-3 text-sm font-bold text-foreground hover:bg-accent hover:text-accent-foreground"
              to="/parkings"
            >
              {t('public.detail.back')}
            </Link>
          </div>
        </div>
      </section>
    );
  }
  if (!parking) return null;

  const mapUrl = `https://www.openstreetmap.org/?mlat=${String(parking.lat)}&mlon=${String(parking.lng)}#map=17/${String(parking.lat)}/${String(parking.lng)}`;
  const scheduleLabel = parking.is24Hours
    ? t('public.detail.schedule24')
    : parking.opensAt && parking.closesAt
      ? `${parking.opensAt} - ${parking.closesAt}`
      : t('public.detail.scheduleUnavailable');

  return (
    <article className="min-h-full bg-canvas pb-20 pt-10 text-foreground sm:pb-28 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-foreground underline decoration-accent decoration-2 underline-offset-4"
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
            <AvailabilityIndicator
              nextOpeningAt={parking.nextOpeningAt}
              state={parking.availabilityState}
              timezone={parking.timezone}
            />
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-black leading-[0.98] tracking-[-0.055em] text-foreground sm:text-6xl">
              {parking.title}
            </h1>
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
                  <span className="text-sm">/ h</span>
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
            {parking.isShowcase ? (
              <p className="mt-5 rounded-2xl bg-accent-soft p-4 text-sm font-medium leading-relaxed text-accent-foreground">
                {t('public.detail.showcaseDisclosure')}
              </p>
            ) : null}
          </aside>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <div className="aspect-[16/10] overflow-hidden rounded-[2.5rem_2.5rem_5rem_2.5rem] border border-border bg-surface-emphasis lg:col-span-7">
            <PublicParkingImage
              alt={t('parking.discoveryImageAlt', { title: parking.title })}
              fetchPriority="high"
              image={parking.image}
              imageClassName="h-full w-full object-cover"
              loading="eager"
              variant="detail"
            />
          </div>

          <div className="grid gap-6 lg:col-span-4 lg:col-start-9">
            <section className="rounded-[2rem] border border-border bg-surface p-6 sm:p-7">
              <p className="type-label text-foreground-muted">{t('public.detail.about')}</p>
              <p className="mt-4 text-base leading-relaxed text-foreground-secondary">
                {parking.description ?? t('public.detail.missingDescription')}
              </p>
            </section>
            <section className="rounded-[2rem] bg-surface-inverse p-6 text-foreground-on-inverse sm:p-7">
              <p className="type-label text-accent">{t('public.detail.location')}</p>
              <p className="mt-4 text-sm leading-relaxed text-foreground-on-inverse/75">
                {t('public.detail.directionsDescription')}
              </p>
              <a
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-foreground hover:bg-accent-hover"
                href={mapUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('public.detail.directionsAction', { title: parking.title })}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </a>
            </section>
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
        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <div className="aspect-[16/10] rounded-[2.5rem] bg-surface-emphasis lg:col-span-7" />
          <div className="min-h-64 rounded-[2rem] bg-surface-emphasis lg:col-span-4 lg:col-start-9" />
        </div>
      </div>
    </div>
  );
}
