import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';

import { Metric, ParkingIdentity, RateDisplay } from '../../components/domain/parking.js';
import { ParkingStatus } from '../../components/domain/status.js';
import { ErrorState, Skeleton } from '../../components/ui/feedback.js';
import { publicUrl, useDocumentMeta } from '../../lib/document-meta.js';
import { getPublicParking, PublicApiError } from '../../lib/api/public-api.js';

export function ParkingDetailRoute() {
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
      ? `${parking.title} is an active ParkCore parking facility at ${parking.address}.`
      : 'View public ParkCore parking facility details.',
    noIndex: parkingQuery.isError,
    publicUrl: parking ? publicUrl(`/parkings/${parking.id}`) : undefined,
    title: parking ? `${parking.title} | ParkCore` : 'Parking details | ParkCore',
  });
  if (parkingQuery.isLoading) return <ParkingDetailSkeleton />;
  if (parkingQuery.isError) {
    const notFound =
      parkingQuery.error instanceof PublicApiError && parkingQuery.error.status === 404;
    return (
      <ErrorState
        title={notFound ? 'No parking here' : 'Unable to load parking'}
        onRetry={() => {
          void parkingQuery.refetch();
        }}
      >
        {notFound
          ? 'This parking is no longer publicly available.'
          : 'Try loading this parking again.'}
      </ErrorState>
    );
  }
  if (!parking) return null;
  const mapUrl = `https://www.openstreetmap.org/?mlat=${String(parking.lat)}&mlon=${String(parking.lng)}#map=17/${String(parking.lat)}/${String(parking.lng)}`;
  return (
    <article className="parking-detail stack-landing">
      <Link className="back-link" to="/parkings">
        <ArrowLeft aria-hidden="true" size={16} /> Parkings
      </Link>
      <header className="detail-header">
        <ParkingIdentity parking={parking} />
        <ParkingStatus isActive={parking.isActive} />
      </header>
      <div className="detail-metrics">
        <RateDisplay currency={parking.currency} hourlyRateCents={parking.hourlyRateCents} />
        <Metric label="Capacity" value={parking.capacity} />
      </div>
      {parking.image && unavailableImage !== parking.image ? (
        <img
          alt={`${parking.title} parking facility`}
          className="parking-image"
          decoding="async"
          fetchPriority="high"
          onError={() => {
            setUnavailableImage(parking.image);
          }}
          src={parking.image}
        />
      ) : (
        <div className="parking-image-placeholder" aria-label="Parking image not available">
          <span className="type-label">P / 01</span>
          <span className="type-operational">Parking facility</span>
        </div>
      )}
      <section className="detail-section">
        <p className="type-label">About</p>
        <p className="type-body">
          {parking.description ?? 'No public description has been provided for this parking.'}
        </p>
      </section>
      <section className="detail-section">
        <p className="type-label">Location</p>
        <p className="type-operational">
          {parking.lat.toFixed(4)}, {parking.lng.toFixed(4)}
        </p>
        <a className="button button-secondary" href={mapUrl} rel="noreferrer" target="_blank">
          Open location <ExternalLink aria-hidden="true" size={15} />
        </a>
      </section>
    </article>
  );
}

function ParkingDetailSkeleton() {
  return (
    <div className="stack-landing" aria-label="Loading parking">
      <Skeleton className="skeleton-title" />
      <Skeleton className="skeleton-metrics" />
      <Skeleton className="skeleton-image" />
    </div>
  );
}
