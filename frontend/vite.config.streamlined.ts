import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist-streamlined',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index-streamlined.html'),
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8173,
  },
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
