import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/. Locally it stays at /.
  base: process.env.GITHUB_ACTIONS ? '/dots-and-lines/' : '/',
  plugins: [react()],
  resolve: {
    // Import @dots-and-lines/* straight from TypeScript source (the "source"
    // export condition), so edits show up immediately without a rebuild.
    conditions: ['source', ...defaultClientConditions],
  },
});
