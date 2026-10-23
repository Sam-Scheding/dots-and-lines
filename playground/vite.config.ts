import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Import @dots-and-lines/* straight from TypeScript source (the "source"
    // export condition), so edits show up immediately without a rebuild.
    conditions: ['source', ...defaultClientConditions],
  },
});
