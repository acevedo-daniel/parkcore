import * as React from 'react';
import { Car, Bike, Truck } from 'lucide-react';

import { useAppearance } from '../../app/appearance-provider.js';
import { cn } from '../../lib/cn.js';

export interface LicensePlateBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  plate: string;
  vehicleType?: 'CAR' | 'MOTORCYCLE' | 'VAN' | 'TRUCK' | (string & {});
  size?: 'sm' | 'default' | 'lg';
}

export function LicensePlateBadge({
  plate,
  vehicleType,
  size = 'default',
  className,
  ...props
}: LicensePlateBadgeProps) {
  const { t } = useAppearance();
  // Format plate nicely if it contains alphanumeric characters (e.g. ABC 1234 or AA 123 BB)
  const cleanPlate = plate.trim().toUpperCase();

  const renderIcon = () => {
    switch (vehicleType?.toUpperCase()) {
      case 'MOTORCYCLE':
      case 'MOTO':
        return <Bike className="size-3.5 text-foreground-muted" aria-hidden="true" />;
      case 'TRUCK':
      case 'VAN':
        return <Truck className="size-3.5 text-foreground-muted" aria-hidden="true" />;
      default:
        return vehicleType ? (
          <Car className="size-3.5 text-foreground-muted" aria-hidden="true" />
        ) : null;
    }
  };

  return (
    <span
      aria-label={t('parking.vehiclePlate', { plate: cleanPlate })}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong bg-surface-raised font-mono font-bold tracking-wider text-foreground shadow-xs select-all',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'default' && 'px-2.5 py-1 text-xs sm:text-sm',
        size === 'lg' && 'px-3.5 py-1.5 text-sm sm:text-base tracking-widest',
        className,
      )}
      {...props}
    >
      {renderIcon()}
      <span className="tabular-nums drop-shadow-xs">{cleanPlate}</span>
    </span>
  );
}
