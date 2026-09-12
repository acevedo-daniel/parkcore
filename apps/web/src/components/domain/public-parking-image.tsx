import { useState } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { cn } from '../../lib/cn.js';

interface PublicParkingImageProps {
  alt: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  image?: string | null;
  imageClassName?: string;
  loading?: 'eager' | 'lazy';
  variant?: 'card' | 'detail';
}

export function PublicParkingImage({
  alt,
  fetchPriority,
  image,
  imageClassName,
  loading = 'lazy',
  variant = 'card',
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
      className={cn(
        'flex h-full w-full items-end bg-surface-inverse text-foreground-on-inverse',
        variant === 'card' ? 'p-5' : 'p-8',
      )}
      role="img"
    >
      <div
        className={cn(
          'border-l-4 border-accent pl-4',
          variant === 'card' ? 'max-w-52' : 'max-w-64 bg-surface p-5 text-foreground shadow-xs',
        )}
      >
        <p className="type-label text-accent">{t('parking.fallbackEyebrow')}</p>
        <p className="mt-2 font-display text-lg font-bold leading-tight">
          {t('parking.fallbackMessage')}
        </p>
      </div>
    </div>
  );
}
