import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { getPublicParking, PublicApiError } from '../../lib/api/public-api.js';
import { publicUrl, useDocumentMeta } from '../../lib/document-meta.js';
import { formatMoney } from '../../lib/format.js';

export function ParkingDetailRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const { parkingId } = useParams();
  const parkingQuery = useQuery({
    queryKey: ['public-parking', parkingId],
    enabled: Boolean(parkingId),
    queryFn: () => getPublicParking(parkingId ?? ''),
  });
  const parking = parkingQuery.data;
  const [unavailableImage, setUnavailableImage] = useState<string | null>();

  useDocumentMeta({
    description: parking
      ? es
        ? `${parking.title}, cochera activa en ${parking.address}.`
        : `${parking.title} is an active ParkCore parking facility at ${parking.address}.`
      : es
        ? 'Consultá los detalles de una cochera ParkCore.'
        : 'View public ParkCore parking facility details.',
    noIndex: parkingQuery.isError,
    publicUrl: parking ? publicUrl(`/parkings/${parking.id}`) : undefined,
    title: parking
      ? `${parking.title} | ParkCore`
      : es
        ? 'Detalle de cochera | ParkCore'
        : 'Parking details | ParkCore',
  });

  if (parkingQuery.isLoading) return <ParkingDetailSkeleton />;
  if (parkingQuery.isError) {
    const notFound =
      parkingQuery.error instanceof PublicApiError && parkingQuery.error.status === 404;
    return (
      <section className="min-h-full bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div
          className="mx-auto max-w-3xl rounded-[2rem] border border-[#121417]/20 bg-[#f5f5f5] p-8 sm:p-10"
          role="alert"
        >
          <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
            {es ? 'Directorio de cocheras' : 'Parking directory'}
          </p>
          <h1 className="mt-4 font-display text-3xl font-black tracking-[-0.04em] text-[#1d241f]">
            {notFound
              ? es
                ? 'Esta cochera ya no está disponible.'
                : 'No parking here'
              : es
                ? 'No pudimos cargar esta cochera.'
                : 'Unable to load parking'}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#3f3f3f]">
            {notFound
              ? es
                ? 'Volvé al directorio para explorar las cocheras activas.'
                : 'This parking is no longer publicly available.'
              : es
                ? 'Probá de nuevo o volvé al directorio.'
                : 'Try loading this parking again.'}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {!notFound ? (
              <button
                className="rounded-full bg-[#121417] px-5 py-3 text-sm font-bold text-white hover:bg-[#ffcc00] hover:text-[#121417]"
                onClick={() => {
                  void parkingQuery.refetch();
                }}
                type="button"
              >
                {es ? 'Reintentar' : 'Try again'}
              </button>
            ) : null}
            <Link
              className="rounded-full border border-[#121417]/15 px-5 py-3 text-sm font-bold text-[#121417] hover:bg-[#ffcc00]"
              to="/parkings"
            >
              {es ? 'Volver a cocheras' : 'Return to directory'}
            </Link>
          </div>
        </div>
      </section>
    );
  }
  if (!parking) return null;

  const mapUrl = `https://www.openstreetmap.org/?mlat=${String(parking.lat)}&mlon=${String(parking.lng)}#map=17/${String(parking.lat)}/${String(parking.lng)}`;

  return (
    <article className="min-h-full bg-white pb-20 pt-10 sm:pb-28 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[#121417] underline decoration-[#ffcc00] decoration-2 underline-offset-4"
          to="/parkings"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {es ? 'Volver a cocheras' : 'Back to parkings'}
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-start">
          <header className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f5f5] px-3 py-1.5 text-xs font-bold text-[#121417]">
              <span className="size-1.5 rounded-full bg-[#121417]" />
              {parking.isActive
                ? es
                  ? 'Cochera activa'
                  : 'Facility active'
                : es
                  ? 'Consultar antes de ir'
                  : 'Check before going'}
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[#1d241f] sm:text-6xl">
              {parking.title}
            </h1>
            <p className="mt-5 flex max-w-xl items-start gap-2 text-base leading-relaxed text-[#526052] sm:text-lg">
              <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-[#121417]" />
              {parking.address}
            </p>
          </header>

          <aside className="rounded-[2rem_2rem_4rem_2rem] border border-[#121417]/10 bg-white p-6 shadow-[0_8px_0_rgba(18,20,23,0.08)] lg:col-span-4 lg:col-start-9">
            <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
              {es ? 'Lo importante' : 'The essentials'}
            </p>
            <div className="mt-6 grid gap-5 border-y border-[#1d241f]/10 py-5 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <p className="text-xs font-medium text-[#526052]">
                  {es ? 'Tarifa por hora' : 'Hourly rate'}
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-[#1d241f]">
                  {formatMoney(parking.hourlyRateCents, parking.currency)}{' '}
                  <span className="text-sm">/ h</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#526052]">
                  {es ? 'Capacidad total' : 'Total capacity'}
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#1d241f]">
                  {parking.capacity}{' '}
                  <span className="text-sm font-medium">{es ? 'vehículos' : 'vehicles'}</span>
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[#526052]">
              {es
                ? 'La disponibilidad en el momento se confirma al llegar. Esta ficha muestra la información pública de la cochera.'
                : 'Availability is confirmed on arrival. This page shows the facility’s public information.'}
            </p>
          </aside>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <div className="overflow-hidden rounded-[2.5rem_2.5rem_5rem_2.5rem] border border-[#121417]/10 bg-[#f5f5f5] lg:col-span-7">
            {parking.image && unavailableImage !== parking.image ? (
              <img
                alt={`${parking.title} parking facility`}
                className="aspect-[16/10] h-full w-full object-cover"
                decoding="async"
                fetchPriority="high"
                onError={() => {
                  setUnavailableImage(parking.image);
                }}
                src={parking.image}
              />
            ) : (
              <div
                aria-label="Parking image not available"
                className="flex aspect-[16/10] items-end bg-[#121417] p-8"
              >
                <div className="max-w-64 border-l-4 border-[#ffcc00] bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
                    {es ? 'La cochera' : 'The facility'}
                  </p>
                  <p className="mt-2 font-display text-xl font-extrabold leading-tight text-[#1d241f]">
                    {es
                      ? 'Una ficha clara también llega sin foto.'
                      : 'A clear profile still works without a photo.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:col-span-4 lg:col-start-9">
            <section className="rounded-[2rem] border border-[#121417]/10 bg-white p-6 sm:p-7">
              <p className="text-xs font-bold tracking-[0.12em] text-[#121417] uppercase">
                {es ? 'Sobre esta cochera' : 'About this facility'}
              </p>
              <p className="mt-4 text-base leading-relaxed text-[#526052]">
                {parking.description ??
                  (es
                    ? 'Esta cochera todavía no sumó una descripción pública. La tarifa, dirección y capacidad están disponibles arriba.'
                    : 'This facility has not added a public description yet. Its rate, address, and capacity are available above.')}
              </p>
            </section>
            <section className="rounded-[2rem] bg-[#121417] p-6 text-white sm:p-7">
              <p className="text-xs font-bold tracking-[0.12em] text-[#ffcc00] uppercase">
                {es ? 'Ubicación' : 'Location'}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[#f5f5f5]">
                {es
                  ? 'Abrí el mapa para armar tu recorrido hasta la cochera.'
                  : 'Open the map to plan your route to this facility.'}
              </p>
              <a
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ffcc00] px-5 py-3 text-sm font-bold text-[#121417] hover:bg-white"
                href={mapUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {es ? `Abrir mapa de ${parking.title}` : `Open ${parking.title} map`}
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
  return (
    <div aria-label="Loading parking" className="min-h-full bg-white px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-5 w-36 rounded bg-[#e5ded0]" />
        <div className="mt-10 h-16 max-w-2xl rounded bg-[#e5ded0]" />
        <div className="mt-5 h-6 max-w-lg rounded bg-[#e5ded0]" />
        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <div className="aspect-[16/10] rounded-[2.5rem] bg-[#e5ded0] lg:col-span-7" />
          <div className="min-h-64 rounded-[2rem] bg-[#e5ded0] lg:col-span-4 lg:col-start-9" />
        </div>
      </div>
    </div>
  );
}
