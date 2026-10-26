import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  // Components use hooks and event handlers, so Next.js (and other RSC
  // frameworks) must treat the whole entry as a client module.
  banner: { js: '"use client";' },
  // `react` and `@dots-and-lines/core` are peer dependencies, which tsup
  // leaves external, so neither is bundled into the output.
});
