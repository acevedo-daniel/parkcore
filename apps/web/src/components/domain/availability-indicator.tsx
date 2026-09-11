import { useAppearance } from '../../app/appearance-provider.js';
import type { MessageKey } from '../../lib/localization.js';
import { Badge, type BadgeProps } from '../ui/badge.js';

export type AvailabilityState = 'AVAILABLE' | 'LIMITED' | 'FULL' | 'CLOSED' | 'PAUSED';

interface AvailabilityIndicatorProps {
  className?: string;
  nextOpeningAt?: string | null;
  state: AvailabilityState;
  timezone?: string;
}

const variantByState: Record<AvailabilityState, BadgeProps['variant']> = {
  AVAILABLE: 'success',
  CLOSED: 'secondary',
  FULL: 'danger',
  LIMITED: 'warning',
  PAUSED: 'warning',
};

const labelKeyByState: Record<AvailabilityState, MessageKey> = {
  AVAILABLE: 'availability.available',
  CLOSED: 'availability.closed',
  FULL: 'availability.full',
  LIMITED: 'availability.limited',
  PAUSED: 'availability.paused',
};

export function AvailabilityIndicator({
  className,
  nextOpeningAt,
  state,
  timezone,
}: AvailabilityIndicatorProps) {
  const { locale, t } = useAppearance();
  const label = t(labelKeyByState[state]);
  const nextOpening =
    state === 'CLOSED' && nextOpeningAt
      ? new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          ...(timezone ? { timeZone: timezone } : {}),
        }).format(new Date(nextOpeningAt))
      : undefined;

  return (
    <Badge className={className} dot variant={variantByState[state]}>
      {nextOpening ? `${label} · ${t('availability.opensAt', { time: nextOpening })}` : label}
    </Badge>
  );
}
