import 'dotenv/config';
import './src/lib/openapi-registry.js';

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

process.env.LOG_LEVEL = 'error';
process.env.LOG_PRETTY = 'false';
