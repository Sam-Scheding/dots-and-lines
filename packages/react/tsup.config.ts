import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  // `react` (peer) and `@dots-and-lines/core` (dependency) are external by
  // default in tsup, so neither is bundled into the output.
});
