import type { components } from '@parkcore/api-client';

import { cn } from '../../lib/cn.js';

type SessionStatusValue = components['schemas']['ParkingSessionResponse']['status'];

export function ParkingStatus({ isActive }: { isActive: boolean }) {
  return (
    <span className={cn('status', isActive ? 'status-active' : 'status-inactive')}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export function SessionStatus({ status }: { status: SessionStatusValue }) {
  const className =
    status === 'ACTIVE'
      ? 'status-active'
      : status === 'COMPLETED'
        ? 'status-completed'
        : 'status-cancelled';
  return (
    <span className={cn('status', className)}>
      {status[0]}
      {status.slice(1).toLowerCase()}
    </span>
  );
}
