import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ASSET_DIRECTORY,
  CANONICAL_REFERENCE_TIME,
  CANONICAL_SCENARIO_EXPECTATIONS,
  buildCanonicalScenario,
} from './canonical-scenario.js';

const referenceTime = new Date(CANONICAL_REFERENCE_TIME);

describe('canonical scenario generator', () => {
  it('creates the required facilities, operational states, and session volume', () => {
    const scenario = buildCanonicalScenario('owner-1', referenceTime);
    const activeSessions = scenario.sessions.filter((session) => session.status === 'ACTIVE');
    const completedSessions = scenario.sessions.filter((session) => session.status === 'COMPLETED');
    const cancelledSessions = scenario.sessions.filter((session) => session.status === 'CANCELLED');
    const activeByParking = new Map<string, number>();
    for (const session of activeSessions) {
      activeByParking.set(session.parkingId, (activeByParking.get(session.parkingId) ?? 0) + 1);
    }

    expect(scenario.facilities).toHaveLength(CANONICAL_SCENARIO_EXPECTATIONS.facilities);
    expect(
      scenario.facilities.filter((facility) => facility.isActive && facility.isListed),
    ).toHaveLength(CANONICAL_SCENARIO_EXPECTATIONS.listedActiveFacilities);
    expect(
      scenario.facilities.filter((facility) => !facility.isActive && !facility.isListed),
    ).toHaveLength(CANONICAL_SCENARIO_EXPECTATIONS.pausedUnlistedFacilities);
    expect(completedSessions).toHaveLength(CANONICAL_SCENARIO_EXPECTATIONS.completedSessions);
    expect(cancelledSessions).toHaveLength(CANONICAL_SCENARIO_EXPECTATIONS.cancelledSessions);
    expect(new Set(scenario.facilities.map((facility) => facility.currency))).toEqual(
      new Set(['ARS']),
    );
    expect(new Set(scenario.sessions.map((session) => session.currency))).toEqual(new Set(['ARS']));

    const facilitiesByTitle = new Map(
      scenario.facilities.map((facility) => [facility.title, facility]),
    );
    const facilityId = (title: string): string => {
      const facility = facilitiesByTitle.get(title);
      if (!facility) throw new Error(`Missing fixture facility: ${title}`);
      return facility.id;
    };
    expect(activeByParking.get(facilityId('Central Corrientes'))).toBe(4);
    expect(activeByParking.get(facilityId('Palermo Plaza'))).toBe(16);
    expect(activeByParking.get(facilityId('Recoleta Patio'))).toBe(12);
    expect(activeByParking.get(facilityId('Puerto Madero Dock'))).toBe(3);
    expect(activeByParking.get(facilityId('Belgrano Norte'))).toBe(2);
    expect(activeByParking.get(facilityId('San Telmo Mercado'))).toBe(2);
    expect(
      scenario.facilities.find((facility) => facility.title === 'San Telmo Mercado')?.isActive,
    ).toBe(false);
    expect(
      scenario.sessions.some(
        (session) =>
          session.status === 'COMPLETED' && session.endTime?.getTime() === referenceTime.getTime(),
      ),
    ).toBe(true);
    expect(
      scenario.sessions.some(
        (session) =>
          session.status === 'ACTIVE' &&
          session.startTime.getTime() < referenceTime.getTime() - 35 * 1440 * 60_000,
      ),
    ).toBe(true);
  });

  it('rebases time-dependent records while keeping facility and asset identity stable', () => {
    const original = buildCanonicalScenario('owner-1', referenceTime);
    const rebased = buildCanonicalScenario(
      'owner-1',
      new Date(referenceTime.getTime() + 3 * 1440 * 60_000),
    );

    expect(rebased.facilities.map(({ id, title, image }) => ({ id, title, image }))).toEqual(
      original.facilities.map(({ id, title, image }) => ({ id, title, image })),
    );
    expect(rebased.sessions.map((session) => session.id)).toEqual(
      original.sessions.map((session) => session.id),
    );
    const originalFirstSession = original.sessions[0];
    const rebasedFirstSession = rebased.sessions[0];
    expect(rebasedFirstSession.startTime.getTime()).toBe(
      originalFirstSession.startTime.getTime() + 3 * 1440 * 60_000,
    );
  });

  it('is repeatable and gives vehicles returning session history', () => {
    const first = buildCanonicalScenario('owner-1', referenceTime);
    const second = buildCanonicalScenario('owner-1', referenceTime);
    const sessionsByVehicle = new Map<string, number>();

    for (const session of first.sessions) {
      sessionsByVehicle.set(session.vehicleId, (sessionsByVehicle.get(session.vehicleId) ?? 0) + 1);
    }

    expect(second).toEqual(first);
    expect(first.vehicles).toHaveLength(120);
    expect([...sessionsByVehicle.values()].some((count) => count > 1)).toBe(true);
    expect(new Set(first.sessions.map((session) => session.id)).size).toBe(first.sessions.length);
  });

  it('references only committed canonical assets with provenance', () => {
    const scenario = buildCanonicalScenario('owner-1', referenceTime);
    const assetRoot = fileURLToPath(
      new URL('../../../web/public/assets/canonical/', import.meta.url),
    );

    expect(existsSync(`${assetRoot}PROVENANCE.md`)).toBe(true);
    for (const facility of scenario.facilities) {
      expect(facility.image.startsWith(`${CANONICAL_ASSET_DIRECTORY}/`)).toBe(true);
      expect(
        existsSync(`${assetRoot}${facility.image.slice(CANONICAL_ASSET_DIRECTORY.length + 1)}`),
      ).toBe(true);
      expect(facility.image).not.toMatch(/^https?:\/\//);
    }
  });
});
