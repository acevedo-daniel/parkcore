import { useState } from 'react';
import { SquareParking } from 'lucide-react';

import { useAppearance } from '../../app/appearance-provider.js';

interface PublicParkingImageProps {
  alt: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  image?: string | null;
  imageClassName?: string;
  loading?: 'eager' | 'lazy';
}

export function PublicParkingImage({
  alt,
  fetchPriority,
  image,
  imageClassName,
  loading = 'lazy',
}: PublicParkingImageProps) {
  const { t } = useAppearance();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageUnavailable = Boolean(image && failedImage === image);

  if (image && !imageUnavailable) {
    return (
      <img
        alt={alt}
        className={imageClassName}
        decoding="async"
        fetchPriority={fetchPriority}
        loading={loading}
        onError={() => {
          setFailedImage(image);
        }}
        src={image}
      />
    );
  }

  return (
    <div
      aria-label={t('public.detail.imageUnavailable')}
      className="flex h-full w-full items-center justify-center bg-muted"
      role="img"
    >
      <div className="flex size-12 items-center justify-center rounded-full border border-border-subtle bg-card">
        <SquareParking aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>
    </div>
  );
}
