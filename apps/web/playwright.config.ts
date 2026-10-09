import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testIgnore: [
    'hardening-matrix.spec.ts',
    'production-preview-smoke.spec.ts',
    'real-stack-smoke.spec.ts',
    'responsive-production-qa.spec.ts',
  ],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: {
    actionTimeout: 10_000,
    baseURL: 'http://127.0.0.1:4173',
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
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
