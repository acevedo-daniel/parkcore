import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /hardening-matrix\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 420_000,
  expect: { timeout: 20_000 },
  workers: 1,
  outputDir: 'test-results/hardening',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/hardening', open: 'never' }],
    ['json', { outputFile: 'playwright-report/hardening-results.json' }],
  ],
  use: {
    actionTimeout: 10_000,
    baseURL: 'http://127.0.0.1:4173',
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
    env: {
      ...process.env,
      VITE_API_URL: 'http://localhost:3000',
    },
    reuseExistingServer: !process.env.CI,
    url: 'http://127.0.0.1:4173',
  },
});
