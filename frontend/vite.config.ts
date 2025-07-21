import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Disable Console Ninja to prevent startup issues
process.env.DISABLE_CONSOLE_NINJA = 'true';

// https://vite.dev/config/
export default defineConfig({
  base: './', // Important for Electron compatibility
  esbuild: {
    // Ignore TypeScript errors during build
    logLevel: 'error',
    target: 'es2020',
    // Skip type checking entirely
    tsconfigRaw: {
      compilerOptions: {
        skipLibCheck: true,
        noEmit: true,
        isolatedModules: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        jsx: 'react-jsx',
        target: 'es2020',
        lib: ['es2020', 'dom', 'dom.iterable'],
        module: 'esnext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        strict: false,
        noImplicitAny: false,
        noUnusedLocals: false,
        noUnusedParameters: false,
      },
    },
  },
  plugins: [react(), tsconfigPaths()],
  // plugins moved above
  server: {
    port: parseInt(process.env.VITE_PORT || '8173', 10),
    host: true,
    hmr: {
      overlay: false, // Disable overlay to prevent WebSocket errors;
      clientPort: parseInt(process.env.VITE_PORT || '8173', 10),
      port: 24878, // Use different port for HMR WebSocket (24678 + 200);
    },
    strictPort: false, // Allow fallback ports;
    // Proxy disabled to enable intelligent dynamic porting via BackendDiscoveryService
    // All API calls now go through dynamic discovery system
    // proxy: {
    //   '/api': {
    //     target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
    //     changeOrigin: true,
    //     secure: false,
    //     ws: false,
    //   },
    //   '/health': {
    //     target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    //   '/ws': {
    //     target: 'ws://localhost:8000',
    //     ws: true,
    //     changeOrigin: true,
    //   },
    // },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress certain warnings;
        if (warning.code === 'UNRESOLVED_IMPORT') return;
        warn(warning);
      },
    },
  },
  optimizeDeps: {
    include: [
      '@radix-ui/react-tabs',
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'zustand',
      'axios',
      'react',
      'react-dom',
      '@tanstack/react-query',
    ],
    exclude: ['electron'],
    force: true,
  },
});
