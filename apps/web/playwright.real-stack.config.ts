import { defineConfig } from '@playwright/test';

const baseURL = process.env.REAL_STACK_WEB_URL;

if (!baseURL) {
  throw new Error('REAL_STACK_WEB_URL is required for the real-stack smoke test.');
}

export default defineConfig({
  testDir: './e2e',
  testMatch: /(?:real-stack-smoke|responsive-production-qa)\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 300_000,
  workers: 1,
  use: {
    actionTimeout: 10_000,
    baseURL,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'edge', use: { channel: 'msedge' } },
  ],
});
