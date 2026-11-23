import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    retry: 0,
    testTimeout: 15_000,
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ['./vitest.setup.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        // Integration files share one PostgreSQL database and the canonical
        // showcase, so they run one file at a time.
        extends: true,
        test: {
          name: 'integration',
          include: ['tests/**/*.test.ts'],
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        'prisma/generated/**',
        'src/scripts/**',
        'src/**/*.docs.ts',
        'tests/**',
      ],
    },
  },
});
