import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Force disable Console Ninja completely
process.env.DISABLE_CONSOLE_NINJA = 'true';
process.env.CONSOLE_NINJA_DISABLED = 'true';

// Minimal config to bypass Console Ninja issues
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
  esbuild: {
    logLevel: 'error',
    target: 'es2020',
  },
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom'],
  },
});
