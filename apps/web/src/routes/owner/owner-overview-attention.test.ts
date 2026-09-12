import { describe, expect, it } from 'vitest';

import { parkingFixture, parkingSessionFixture } from '../../test/fixtures.js';
import { deriveOwnerAttentionItems, LONG_RUNNING_STAY_MS } from './owner-overview-attention.js';

const now = new Date('2026-09-11T18:00:00.000Z');

function source(
  parkingOverrides: Parameters<typeof parkingFixture>[0],
  sessionOverrides: Parameters<typeof parkingSessionFixture>[0][] = [],
) {
  const parking = parkingFixture(parkingOverrides);
  return {
    activeSessions: sessionOverrides.map((overrides) =>
      parkingSessionFixture({ parkingId: parking.id, ...overrides }),
    ),
    parking,
  };
}

describe('deriveOwnerAttentionItems', () => {
  it('returns full, nearly full, long-running, and paused states in order', () => {
    const items = deriveOwnerAttentionItems(
      [
        source({ availabilityState: 'PAUSED', id: 'paused', title: 'Paused Parking' }),
        source(
          { availabilityState: 'AVAILABLE', id: 'long-running', title: 'Long-running Parking' },
          [
            {
              id: 'long-session',
              startTime: new Date(now.getTime() - LONG_RUNNING_STAY_MS).toISOString(),
            },
          ],
        ),
        source({ availabilityState: 'LIMITED', id: 'limited', title: 'Nearly Full Parking' }),
        source({ availabilityState: 'FULL', id: 'full', title: 'Full Parking' }),
      ],
      now,
    );

    expect(items.map(({ state, parkingId }) => [state, parkingId])).toEqual([
      ['FULL', 'full'],
      ['LIMITED', 'limited'],
      ['LONG_RUNNING', 'long-running'],
      ['PAUSED', 'paused'],
    ]);
    expect(items[2]).toMatchObject({
      durationHours: 8,
      plate: 'AB123CD',
      sessionId: 'long-session',
      to: '/app/sessions/long-session',
    });
    expect(items[0]?.to).toBe('/app/parkings/full');
    expect(items[3]?.to).toBe('/app/parkings/paused');
  });

  it('uses the eight-hour boundary and does not duplicate mutually exclusive facility states', () => {
    const items = deriveOwnerAttentionItems(
      [
        source(
          {
            activeSessionCount: 12,
            availabilityState: 'FULL',
            id: 'full',
          },
          [
            {
              id: 'at-boundary',
              startTime: new Date(now.getTime() - LONG_RUNNING_STAY_MS).toISOString(),
            },
            {
              id: 'too-new',
              startTime: new Date(now.getTime() - LONG_RUNNING_STAY_MS + 1).toISOString(),
            },
          ],
        ),
      ],
      now,
    );

    expect(items.map(({ state, sessionId }) => [state, sessionId])).toEqual([
      ['FULL', undefined],
      ['LONG_RUNNING', 'at-boundary'],
    ]);
    expect(items.filter(({ state }) => state === 'FULL')).toHaveLength(1);
    expect(items.some(({ state }) => state === 'LIMITED')).toBe(false);
  });

  it('is deterministic for the same timestamp and preserves stable ties', () => {
    const sources = [
      source({ availabilityState: 'AVAILABLE', id: 'first', title: 'First Parking' }, [
        {
          id: 'first-session',
          startTime: new Date(now.getTime() - LONG_RUNNING_STAY_MS - 2_000).toISOString(),
        },
      ]),
      source({ availabilityState: 'AVAILABLE', id: 'second', title: 'Second Parking' }, [
        {
          id: 'second-session',
          startTime: new Date(now.getTime() - LONG_RUNNING_STAY_MS - 2_000).toISOString(),
        },
      ]),
    ];

    const first = deriveOwnerAttentionItems(sources, now);
    const second = deriveOwnerAttentionItems(sources, new Date(now));

    expect(second).toEqual(first);
    expect(first.map(({ sessionId }) => sessionId)).toEqual(['first-session', 'second-session']);
  });
});
