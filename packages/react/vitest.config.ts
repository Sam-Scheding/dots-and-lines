import { defaultClientConditions } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Resolve workspace packages (e.g. @dots-and-lines/core) from TypeScript
    // source rather than requiring a built dist.
    conditions: ['source', ...defaultClientConditions],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/spec.ts', '**/spec.tsx', '**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
});
