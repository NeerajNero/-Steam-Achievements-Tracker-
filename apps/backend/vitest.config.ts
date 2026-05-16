import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts', 'node_modules', 'dist'],
    setupFiles: ['src/test/setup.ts'],
  },
});
