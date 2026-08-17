import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

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

const appFileUrl = pathToFileURL(resolve(process.cwd(), 'dist/app.js')).href;

try {
  const module = (await import(appFileUrl)) as { default?: unknown };

  if (!module.default) {
    throw new Error('dist/app.js loaded but default export is missing.');
  }

  console.log('Build artifact check passed: dist/app.js imports correctly.');
} catch (error) {
  console.error('Build artifact check failed.');
  console.error(error);
  process.exit(1);
}
