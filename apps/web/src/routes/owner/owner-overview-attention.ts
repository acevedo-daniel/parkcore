import type { AttentionState } from '../../components/domain/attention-item.js';
import type { Parking, ParkingSession } from '../../lib/api/owner-api.js';

export const LONG_RUNNING_STAY_MS = 8 * 60 * 60 * 1000;

export interface OwnerAttentionSource {
  activeSessions: readonly Pick<ParkingSession, 'id' | 'startTime' | 'vehicle'>[];
  parking: Pick<Parking, 'availabilityState' | 'id' | 'title'>;
}

export interface OwnerAttentionItem {
  durationHours?: number;
  parkingId: string;
  parkingTitle: string;
  plate?: string;
  sessionId?: string;
  startTime?: string;
  state: AttentionState;
  to: string;
}

const attentionRank: Record<AttentionState, number> = {
  FULL: 0,
  LIMITED: 1,
  LONG_RUNNING: 2,
  PAUSED: 3,
};

export function deriveOwnerAttentionItems(
  sources: readonly OwnerAttentionSource[],
  now: Date,
): OwnerAttentionItem[] {
  const items: OwnerAttentionItem[] = [];

  for (const { activeSessions, parking } of sources) {
    if (parking.availabilityState === 'FULL') {
      items.push({
        parkingId: parking.id,
        parkingTitle: parking.title,
        state: 'FULL',
        to: `/app/parkings/${parking.id}`,
      });
    } else if (parking.availabilityState === 'LIMITED') {
      items.push({
        parkingId: parking.id,
        parkingTitle: parking.title,
        state: 'LIMITED',
        to: `/app/parkings/${parking.id}`,
      });
    }

    for (const session of activeSessions) {
      const startedAt = Date.parse(session.startTime);
      const elapsedMs = now.getTime() - startedAt;
      if (!Number.isFinite(startedAt) || elapsedMs < LONG_RUNNING_STAY_MS) continue;

      items.push({
        durationHours: Math.floor(elapsedMs / (60 * 60 * 1000)),
        parkingId: parking.id,
        parkingTitle: parking.title,
        plate: session.vehicle.plate,
        sessionId: session.id,
        startTime: session.startTime,
        state: 'LONG_RUNNING',
        to: `/app/sessions/${session.id}`,
      });
    }

    if (parking.availabilityState === 'PAUSED') {
      items.push({
        parkingId: parking.id,
        parkingTitle: parking.title,
        state: 'PAUSED',
        to: `/app/parkings/${parking.id}`,
      });
    }
  }

  return items.sort((left, right) => attentionRank[left.state] - attentionRank[right.state]);
}
