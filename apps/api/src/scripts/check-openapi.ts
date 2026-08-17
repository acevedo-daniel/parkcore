import { generateOpenApiDocument } from '../config/openapi.js';

interface OpenApiOperation {
  responses?: Record<string, unknown>;
  requestBody?: { required?: boolean };
}

interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  patch?: OpenApiOperation;
}

interface OpenApiSchema {
  type?: string | string[];
  format?: string;
  properties?: Record<string, OpenApiSchema>;
  oneOf?: OpenApiSchema[];
}

interface OpenApiDoc {
  openapi?: string;
  info?: { version?: string };
  paths?: Record<string, OpenApiPathItem>;
  components?: { schemas?: Record<string, OpenApiSchema> };
}

const requiredPaths = [
  '/healthz',
  '/auth/register',
  '/auth/login',
  '/users/me',
  '/parkings',
  '/parkings/me',
  '/parkings/{id}',
  '/parkings/{parkingId}/sessions/check-in',
  '/parkings/{parkingId}/sessions',
  '/parkings/{parkingId}/sessions/active',
  '/sessions/{sessionId}',
  '/sessions/{sessionId}/check-out',
  '/sessions/{sessionId}/cancel',
];

const forbiddenPathPrefixes = ['/bookings', '/reviews'];
const requiredSchemas = [
  'ErrorResponse',
  'AuthResponse',
  'UserResponse',
  'ParkingResponse',
  'ParkingListResponse',
  'VehicleSummary',
  'ParkingSessionResponse',
  'ParkingSessionListResponse',
];
const dateTimeFields: Record<string, string[]> = {
  UserResponse: ['createdAt', 'updatedAt'],
  ParkingResponse: ['createdAt', 'updatedAt'],
  ParkingSessionResponse: ['startTime', 'endTime', 'createdAt', 'updatedAt'],
};

const doc = generateOpenApiDocument() as OpenApiDoc;
const errors: string[] = [];

if (!doc.openapi) errors.push('Missing "openapi" version.');
if (!doc.info?.version) errors.push('Missing "info.version".');

for (const path of requiredPaths) {
  if (!doc.paths?.[path]) errors.push(`Missing required path: ${path}`);
}

for (const path of Object.keys(doc.paths ?? {})) {
  if (forbiddenPathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    errors.push(`Legacy path must not exist: ${path}`);
  }
}

for (const name of requiredSchemas) {
  if (!doc.components?.schemas?.[name]) errors.push(`Missing components.schemas.${name}.`);
}

for (const [schemaName, fields] of Object.entries(dateTimeFields)) {
  const schema = doc.components?.schemas?.[schemaName];
  for (const field of fields) {
    const property = schema?.properties?.[field];
    const hasStringType =
      typeof property?.type === 'string'
        ? property.type === 'string'
        : (property?.type?.includes('string') ?? false);
    const isDateTime =
      (hasStringType && property?.format === 'date-time') ||
      (property?.oneOf?.some(
        (variant) => variant.type === 'string' && variant.format === 'date-time',
      ) ??
        false);
    if (!isDateTime) {
      errors.push(`${schemaName}.${field} must be an ISO-8601 date-time string.`);
    }
  }
}

if (errors.length > 0) {
  console.error('OpenAPI health check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `OpenAPI health check passed. Paths: ${String(Object.keys(doc.paths ?? {}).length)}. Version: ${String(doc.info?.version)}`,
);
