import { useState } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { BrandMark } from './brand-mark.js';

const BAY_LINES = [0, 1, 2, 3, 4, 5];

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
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted"
      role="img"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 flex h-1/3 justify-around">
        {BAY_LINES.map((line) => (
          <span className="w-1 rounded-b-full bg-border-subtle" key={line} />
        ))}
      </div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-1/3 justify-around">
        {BAY_LINES.map((line) => (
          <span className="w-1 rounded-t-full bg-border-subtle" key={line} />
        ))}
      </div>
      <BrandMark className="relative size-14" />
    </div>
  );
}
