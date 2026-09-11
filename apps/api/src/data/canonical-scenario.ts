import { createHash } from 'node:crypto';
import type { Prisma, PrismaClient, VehicleType } from '../../prisma/generated/client.js';

export const CANONICAL_REFERENCE_TIME = '2026-01-15T12:00:00.000Z';
export const CANONICAL_TIMEZONE = 'America/Argentina/Buenos_Aires';
export const CANONICAL_CURRENCY = 'ARS' as const;
export const CANONICAL_ASSET_DIRECTORY = '/assets/canonical';

export const CANONICAL_SCENARIO_EXPECTATIONS = {
  facilities: 6,
  listedActiveFacilities: 5,
  pausedUnlistedFacilities: 1,
  completedSessions: 360,
  cancelledSessions: 20,
  minimumHistoryDays: 35,
  maximumHistoryDays: 45,
} as const;

type CanonicalSessionStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

interface FacilityDefinition {
  key: string;
  code: string;
  title: string;
  description: string;
  neighborhood: string;
  address: string;
  hourlyRateCents: number;
  capacity: number;
  lat: number;
  lng: number;
  isActive: boolean;
  isListed: boolean;
  is24Hours: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

const facilityDefinitions: readonly FacilityDefinition[] = [
  {
    key: 'central-corrientes',
    code: 'CC',
    title: 'Central Corrientes',
    description: 'A bright downtown garage near theatres, offices, and the city centre.',
    neighborhood: 'San Nicolás',
    address: 'Avenida Corrientes 845, Buenos Aires',
    hourlyRateCents: 5_500,
    capacity: 30,
    lat: -34.6037,
    lng: -58.3816,
    isActive: true,
    isListed: true,
    is24Hours: true,
    opensAt: null,
    closesAt: null,
  },
  {
    key: 'palermo-plaza',
    code: 'PP',
    title: 'Palermo Plaza',
    description: 'A neighborhood garage beside cafés, shops, and the park circuit.',
    neighborhood: 'Palermo',
    address: 'Thames 1762, Buenos Aires',
    hourlyRateCents: 6_800,
    capacity: 20,
    lat: -34.5889,
    lng: -58.4305,
    isActive: true,
    isListed: true,
    is24Hours: true,
    opensAt: null,
    closesAt: null,
  },
  {
    key: 'recoleta-patio',
    code: 'RP',
    title: 'Recoleta Patio',
    description: 'A compact covered patio for museum visits, appointments, and errands.',
    neighborhood: 'Recoleta',
    address: 'Junín 1248, Buenos Aires',
    hourlyRateCents: 7_400,
    capacity: 12,
    lat: -34.5883,
    lng: -58.3974,
    isActive: true,
    isListed: true,
    is24Hours: true,
    opensAt: null,
    closesAt: null,
  },
  {
    key: 'puerto-madero-dock',
    code: 'PM',
    title: 'Puerto Madero Dock',
    description: 'A waterside facility with daytime demand from offices and restaurants.',
    neighborhood: 'Puerto Madero',
    address: 'Avenida Alicia Moreau de Justo 750, Buenos Aires',
    hourlyRateCents: 8_200,
    capacity: 26,
    lat: -34.6119,
    lng: -58.3632,
    isActive: true,
    isListed: true,
    is24Hours: false,
    opensAt: '06:00',
    closesAt: '01:00',
  },
  {
    key: 'belgrano-norte',
    code: 'BN',
    title: 'Belgrano Norte',
    description: 'A calm residential garage with a dependable commuter rhythm.',
    neighborhood: 'Belgrano',
    address: 'Avenida Cabildo 2180, Buenos Aires',
    hourlyRateCents: 6_100,
    capacity: 18,
    lat: -34.5581,
    lng: -58.4564,
    isActive: true,
    isListed: true,
    is24Hours: true,
    opensAt: null,
    closesAt: null,
  },
  {
    key: 'san-telmo-mercado',
    code: 'STM',
    title: 'San Telmo Mercado',
    description: 'A paused market-side facility retained for owner operations and history.',
    neighborhood: 'San Telmo',
    address: 'Defensa 963, Buenos Aires',
    hourlyRateCents: 5_900,
    capacity: 10,
    lat: -34.6206,
    lng: -58.3712,
    isActive: false,
    isListed: false,
    is24Hours: false,
    opensAt: '07:00',
    closesAt: '23:00',
  },
] as const;

const activeCounts: Readonly<Record<string, number>> = {
  'central-corrientes': 4,
  'palermo-plaza': 16,
  'recoleta-patio': 12,
  'puerto-madero-dock': 3,
  'belgrano-norte': 2,
  'san-telmo-mercado': 2,
};

const minutesBefore = (referenceTime: Date, minutes: number): Date =>
  new Date(referenceTime.getTime() - minutes * 60_000);

const stableUuid = (...parts: string[]): string => {
  const hex = createHash('sha256').update(parts.join(':')).digest('hex').slice(0, 32);
  const variant = ((Number.parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16);
  const versioned = `${hex.slice(0, 12)}5${hex.slice(13, 16)}${variant}${hex.slice(17)}`;
  return `${versioned.slice(0, 8)}-${versioned.slice(8, 12)}-${versioned.slice(12, 16)}-${versioned.slice(16, 20)}-${versioned.slice(20)}`;
};

const assetReference = (facilityKey: string): string =>
  `${CANONICAL_ASSET_DIRECTORY}/${facilityKey}.svg`;

const vehiclePlate = (facility: FacilityDefinition, index: number): string =>
  `${facility.code}${String(index).padStart(3, '0')}`;

export interface CanonicalFacility {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  image: string;
  neighborhood: string;
  address: string;
  hourlyRateCents: number;
  currency: typeof CANONICAL_CURRENCY;
  capacity: number;
  lat: number;
  lng: number;
  isActive: boolean;
  isListed: boolean;
  timezone: typeof CANONICAL_TIMEZONE;
  is24Hours: boolean;
  opensAt: string | null;
  closesAt: string | null;
}

export interface CanonicalVehicle {
  id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  type: VehicleType;
  createdAt: Date;
  updatedAt: Date;
  parkingId: string;
}

export interface CanonicalSession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  hourlyRateCents: number;
  currency: typeof CANONICAL_CURRENCY;
  totalAmountCents: number | null;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  status: CanonicalSessionStatus;
  createdAt: Date;
  updatedAt: Date;
  parkingId: string;
  vehicleId: string;
}

export interface CanonicalScenario {
  facilities: CanonicalFacility[];
  vehicles: CanonicalVehicle[];
  sessions: CanonicalSession[];
}

const buildVehicle = (
  ownerId: string,
  facility: FacilityDefinition,
  parkingId: string,
  index: number,
  referenceTime: Date,
): CanonicalVehicle => {
  const id = stableUuid(ownerId, 'vehicle', facility.key, String(index));
  return {
    id,
    plate: vehiclePlate(facility, index),
    brand: index % 3 === 0 ? 'Toyota' : index % 3 === 1 ? 'Volkswagen' : 'Renault',
    model: index % 3 === 0 ? 'Corolla' : index % 3 === 1 ? 'Polo' : 'Kwid',
    type: index % 5 === 0 ? 'MOTORCYCLE' : index % 7 === 0 ? 'LARGE' : 'CAR',
    createdAt: minutesBefore(referenceTime, 45 * 1440),
    updatedAt: minutesBefore(referenceTime, 45 * 1440),
    parkingId,
  };
};

const buildCompletedSession = (
  ownerId: string,
  facility: FacilityDefinition,
  parkingId: string,
  vehicleId: string,
  index: number,
  referenceTime: Date,
): CanonicalSession => {
  const endMinutesAgo = (index % 40) * 1440 + ((index * 37) % 720);
  const durationMinutes = 45 + ((index * 13) % 180);
  const endTime = minutesBefore(referenceTime, endMinutesAgo);
  const startTime = minutesBefore(endTime, durationMinutes);
  const chargedHours = Math.max(1, Math.ceil(durationMinutes / 60));

  return {
    id: stableUuid(ownerId, 'session', facility.key, 'completed', String(index)),
    startTime,
    endTime,
    hourlyRateCents: facility.hourlyRateCents,
    currency: CANONICAL_CURRENCY,
    totalAmountCents: chargedHours * facility.hourlyRateCents,
    customerName: `Visitante ${String((index % 36) + 1).padStart(2, '0')}`,
    customerPhone: null,
    notes: index % 9 === 0 ? 'Cliente frecuente' : null,
    status: 'COMPLETED',
    createdAt: startTime,
    updatedAt: endTime,
    parkingId,
    vehicleId,
  };
};

const buildCancelledSession = (
  ownerId: string,
  facility: FacilityDefinition,
  parkingId: string,
  vehicleId: string,
  index: number,
  referenceTime: Date,
): CanonicalSession => {
  const startTime = minutesBefore(referenceTime, (2 + (index % 20)) * 1440 + index * 17);
  const endTime = new Date(startTime.getTime() + 10 * 60_000);
  return {
    id: stableUuid(ownerId, 'session', facility.key, 'cancelled', String(index)),
    startTime,
    endTime,
    hourlyRateCents: facility.hourlyRateCents,
    currency: CANONICAL_CURRENCY,
    totalAmountCents: null,
    customerName: null,
    customerPhone: null,
    notes: 'Turno cancelado',
    status: 'CANCELLED',
    createdAt: startTime,
    updatedAt: endTime,
    parkingId,
    vehicleId,
  };
};

const buildActiveSession = (
  ownerId: string,
  facility: FacilityDefinition,
  parkingId: string,
  vehicleId: string,
  index: number,
  referenceTime: Date,
): CanonicalSession => {
  const longRunning = facility.key === 'belgrano-norte' && index === 0;
  const startMinutesAgo = longRunning
    ? 40 * 1440 + 6 * 60
    : 18 + index * 11 + (facility.key === 'san-telmo-mercado' ? 60 : 0);
  const startTime = minutesBefore(referenceTime, startMinutesAgo);
  return {
    id: stableUuid(ownerId, 'session', facility.key, 'active', String(index)),
    startTime,
    endTime: null,
    hourlyRateCents: facility.hourlyRateCents,
    currency: CANONICAL_CURRENCY,
    totalAmountCents: null,
    customerName: longRunning
      ? 'Cliente de larga estadía'
      : `Visitante activo ${String(index + 1)}`,
    customerPhone: null,
    notes: longRunning ? 'Estadía activa de larga duración' : null,
    status: 'ACTIVE',
    createdAt: startTime,
    updatedAt: startTime,
    parkingId,
    vehicleId,
  };
};

export function buildCanonicalScenario(ownerId: string, referenceTime: Date): CanonicalScenario {
  if (!ownerId.trim()) throw new Error('ownerId is required');
  if (Number.isNaN(referenceTime.getTime())) throw new Error('referenceTime must be valid');

  const facilities: CanonicalFacility[] = facilityDefinitions.map((facility) => ({
    id: stableUuid(ownerId, 'facility', facility.key),
    ownerId,
    title: facility.title,
    description: facility.description,
    image: assetReference(facility.key),
    neighborhood: facility.neighborhood,
    address: facility.address,
    hourlyRateCents: facility.hourlyRateCents,
    currency: CANONICAL_CURRENCY,
    capacity: facility.capacity,
    lat: facility.lat,
    lng: facility.lng,
    isActive: facility.isActive,
    isListed: facility.isListed,
    timezone: CANONICAL_TIMEZONE,
    is24Hours: facility.is24Hours,
    opensAt: facility.opensAt,
    closesAt: facility.closesAt,
  }));

  const vehicles: CanonicalVehicle[] = [];
  const sessions: CanonicalSession[] = [];
  for (const [facilityIndex, facility] of facilityDefinitions.entries()) {
    const parking = facilities[facilityIndex];
    const vehicleByIndex = new Map<number, CanonicalVehicle>();
    for (let index = 0; index < 20; index += 1) {
      const vehicle = buildVehicle(ownerId, facility, parking.id, index, referenceTime);
      vehicles.push(vehicle);
      vehicleByIndex.set(index, vehicle);
    }

    for (let index = 0; index < 60; index += 1) {
      const vehicle = vehicleByIndex.get(index % 20);
      if (!vehicle) throw new Error(`Missing canonical vehicle for ${facility.key}`);
      sessions.push(
        buildCompletedSession(ownerId, facility, parking.id, vehicle.id, index, referenceTime),
      );
    }

    for (let index = 0; index < 4; index += 1) {
      if (sessions.filter((session) => session.status === 'CANCELLED').length >= 20) break;
      const vehicle = vehicleByIndex.get((index + 12) % 20);
      if (!vehicle) throw new Error(`Missing canonical vehicle for ${facility.key}`);
      sessions.push(
        buildCancelledSession(ownerId, facility, parking.id, vehicle.id, index, referenceTime),
      );
    }

    const activeCount = activeCounts[facility.key] ?? 0;
    for (let index = 0; index < activeCount; index += 1) {
      const vehicle = vehicleByIndex.get(index);
      if (!vehicle) throw new Error(`Missing canonical vehicle for ${facility.key}`);
      sessions.push(
        buildActiveSession(ownerId, facility, parking.id, vehicle.id, index, referenceTime),
      );
    }
  }

  return { facilities, vehicles, sessions };
}

export type CanonicalDatabaseClient = PrismaClientLike | Prisma.TransactionClient;

type PrismaClientLike = Pick<PrismaClient, 'user' | 'parking' | 'vehicle' | 'parkingSession'>;

const getPersistedScenario = async (
  client: CanonicalDatabaseClient,
  ownerId: string,
  referenceTime: Date,
): Promise<CanonicalScenario> => {
  const scenario = buildCanonicalScenario(ownerId, referenceTime);
  const owner = await client.user.findUnique({ where: { id: ownerId }, select: { kind: true } });
  if (!owner) throw new Error(`Canonical scenario owner not found: ${ownerId}`);

  return owner.kind === 'SHOWCASE'
    ? scenario
    : {
        ...scenario,
        facilities: scenario.facilities.map((facility) => ({ ...facility, isListed: false })),
      };
};

const persistScenario = async (
  client: CanonicalDatabaseClient,
  scenario: CanonicalScenario,
  preserveFacilities: boolean,
): Promise<void> => {
  if (!preserveFacilities) {
    await client.parking.deleteMany({ where: { ownerId: scenario.facilities[0].ownerId } });
    await client.parking.createMany({ data: scenario.facilities });
  } else {
    const ownerId = scenario.facilities[0].ownerId;
    const facilityIds = scenario.facilities.map((facility) => facility.id);
    await client.parkingSession.deleteMany({ where: { parking: { ownerId } } });
    await client.vehicle.deleteMany({ where: { parking: { ownerId } } });
    await client.parking.deleteMany({ where: { ownerId, id: { notIn: facilityIds } } });

    for (const facility of scenario.facilities) {
      const { id, ownerId: facilityOwnerId, ...parkingData } = facility;
      await client.parking.upsert({
        where: { id },
        update: parkingData,
        create: { id, ownerId: facilityOwnerId, ...parkingData },
      });
    }
  }

  await client.vehicle.createMany({ data: scenario.vehicles });
  await client.parkingSession.createMany({ data: scenario.sessions });
};

export async function restoreCanonicalScenario(
  client: CanonicalDatabaseClient,
  ownerId: string,
  referenceTime: Date,
): Promise<CanonicalScenario> {
  const scenario = await getPersistedScenario(client, ownerId, referenceTime);
  await persistScenario(client, scenario, false);
  return scenario;
}

export async function refreshCanonicalScenario(
  client: CanonicalDatabaseClient,
  ownerId: string,
  referenceTime: Date,
): Promise<CanonicalScenario> {
  const scenario = await getPersistedScenario(client, ownerId, referenceTime);
  await persistScenario(client, scenario, true);
  return scenario;
}
