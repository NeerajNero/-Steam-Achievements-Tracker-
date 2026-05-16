import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    pool: 'forks',
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
