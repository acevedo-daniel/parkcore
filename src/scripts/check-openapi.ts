import { generateOpenApiDocument } from '../config/openapi.js';

interface OpenApiOperation {
  responses?: Record<string, unknown>;
  requestBody?: {
    required?: boolean;
  };
}

interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  patch?: OpenApiOperation;
  put?: OpenApiOperation;
  delete?: OpenApiOperation;
}

interface OpenApiDoc {
  openapi?: string;
  info?: {
    version?: string;
  };
  paths?: Record<string, OpenApiPathItem>;
  components?: {
    schemas?: Record<string, unknown>;
  };
}

const requiredPaths = ['/healthz', '/auth/register', '/auth/login'];

const doc = generateOpenApiDocument() as OpenApiDoc;
const errors: string[] = [];

if (!doc.openapi) {
  errors.push('Missing "openapi" version.');
}

if (!doc.info?.version) {
  errors.push('Missing "info.version".');
}

for (const path of requiredPaths) {
  if (!doc.paths?.[path]) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (!doc.components?.schemas?.ErrorResponse) {
  errors.push('Missing components.schemas.ErrorResponse.');
}

if (errors.length > 0) {
  console.error('OpenAPI health check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `OpenAPI health check passed. Paths: ${String(Object.keys(doc.paths ?? {}).length)}. Version: ${String(doc.info?.version)}`,
);
