import type { components } from '@parkcore/api-client';

import { useAppearance } from '../../app/appearance-provider.js';
import { Badge } from '../ui/badge.js';

type SessionStatusValue = components['schemas']['ParkingSessionResponse']['status'];

export function ParkingStatus({ isActive }: { isActive: boolean }) {
  const { t } = useAppearance();
  return (
    <Badge
      dot
      dotColor={isActive ? undefined : 'bg-muted-foreground'}
      variant={isActive ? 'success' : 'secondary'}
    >
      {isActive ? t('parking.active') : t('parking.inactive')}
    </Badge>
  );
}

export function SessionStatus({ status }: { status: SessionStatusValue }) {
  const { t } = useAppearance();
  const variant = status === 'ACTIVE' ? 'success' : status === 'COMPLETED' ? 'info' : 'destructive';
  const label =
    status === 'ACTIVE'
      ? t('session.active')
      : status === 'COMPLETED'
        ? t('session.completed')
        : t('session.cancelledStatus');

  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}
