import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(webDirectory, '../..');
const localApiUrl = 'http://127.0.0.1:3000';
const localWebUrl = 'http://127.0.0.1:4173';

const localEnvironment = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: '3000',
  CORS_ORIGINS: localWebUrl,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    'postgresql://parkcore:parkcore@127.0.0.1:5433/parkcore-e2e?schema=public',
  JWT_SECRET: 'local-real-stack-e2e-secret-change-before-production-1234',
  JWT_EXPIRES_IN: '1h',
  LOG_LEVEL: 'info',
  LOG_PRETTY: 'false',
  ENABLE_API_DOCS: 'false',
  SEED_OWNER_EMAIL: 'owner@parkcore.dev',
  SEED_OWNER_PASSWORD: 'ParkCoreLocalE2ESeed!123',
  SEED_REFERENCE_TIME: '2026-01-15T12:00:00.000Z',
};

export default defineConfig({
  testDir: './e2e',
  testMatch: /real-stack-smoke\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  timeout: 120_000,
  workers: 1,
  outputDir: 'test-results/local-real-stack',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/local-real-stack', open: 'never' }],
  ],
  projects: [{ name: 'chromium' }],
  use: {
    baseURL: localWebUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node scripts/start-local-e2e-api.mjs',
      cwd: repositoryRoot,
      env: localEnvironment,
      url: `${localApiUrl}/healthz`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
      cwd: webDirectory,
      env: {
        ...localEnvironment,
        VITE_API_URL: localApiUrl,
      },
      url: localWebUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
