import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    retry: 0,
    testTimeout: 5_000,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        branches: 55,
        functions: 65,
        lines: 65,
        statements: 65,
      },
    },
  },
});
