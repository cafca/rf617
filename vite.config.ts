import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: process.env.NODE_ENV === 'production' ? '/rf617/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.{test,spec}.{js,ts}'],
  },
});
