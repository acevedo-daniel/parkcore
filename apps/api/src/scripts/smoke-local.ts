import request from 'supertest';
import type { Response as SupertestResponse } from 'supertest';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseJsonBody(response: SupertestResponse): Record<string, unknown> {
  return response.body as Record<string, unknown>;
}

async function main(): Promise<void> {
  const defaultEnv: Record<string, string> = {
    NODE_ENV: 'test',
    PORT: '3001',
    API_BASE_URL: 'http://localhost:3001',
    CORS_ORIGINS: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/parkcore_test',
    JWT_SECRET: 'test-secret-test-secret-test-secret-32',
    JWT_EXPIRES_IN: '1h',
    LOG_LEVEL: 'error',
    LOG_PRETTY: 'false',
  };

  for (const [key, value] of Object.entries(defaultEnv)) {
    process.env[key] ??= value;
  }

  const { default: app } = await import('../../app.js');

  const health = await request(app).get('/healthz');
  const healthBody = parseJsonBody(health);
  assert(health.status === 200, `GET /healthz expected 200, got ${String(health.status)}`);
  assert(healthBody.status === 'ok', 'GET /healthz expected body.status === "ok"');

  const docs = await request(app).get('/openapi.json');
  const docsBody = parseJsonBody(docs);
  assert(docs.status === 200, `GET /openapi.json expected 200, got ${String(docs.status)}`);
  assert(typeof docsBody.openapi === 'string', 'OpenAPI document missing "openapi" field');
  assert(typeof docsBody.info === 'object', 'OpenAPI document missing "info" field');

  console.log('Local smoke check passed (health + docs).');
}

void main().catch((error: unknown) => {
  console.error('Local smoke check failed');
  console.error(error);
  process.exit(1);
});
