import { defineConfig } from '@playwright/test';

const baseURL = process.env.REAL_STACK_WEB_URL;

if (!baseURL) {
  throw new Error('REAL_STACK_WEB_URL is required for the real-stack smoke test.');
}

export default defineConfig({
  testDir: './e2e',
  testMatch: /(?:real-stack-smoke|responsive-production-qa)\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  timeout: 120_000,
  workers: 1,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'edge', use: { channel: 'msedge' } },
  ],
});
