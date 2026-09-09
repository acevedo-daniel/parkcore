import type { components } from '@parkcore/api-client';

import { Badge } from '../ui/badge.js';

type SessionStatusValue = components['schemas']['ParkingSessionResponse']['status'];

export function ParkingStatus({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'success' : 'secondary'} dot>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

export function SessionStatus({ status }: { status: SessionStatusValue }) {
  const variant =
    status === 'ACTIVE' ? 'success' : status === 'COMPLETED' ? 'secondary' : 'destructive';

  return (
    <Badge variant={variant} dot>
      {status[0]}
      {status.slice(1).toLowerCase()}
    </Badge>
  );
}
