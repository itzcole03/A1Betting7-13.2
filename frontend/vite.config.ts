import react from '@vitejs/plugin-react';
import dns from 'node:dns';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Disable Console Ninja to prevent startup issues
process.env.DISABLE_CONSOLE_NINJA = 'true';
// Force DNS to return addresses in order (prevents IPv6-only binding on Windows)
dns.setDefaultResultOrder('verbatim');

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables that start with VITE_
  const env = loadEnv(mode, process.cwd());

  // Map the VITE_* variables to keys without the prefix.
  const processEnv = Object.keys(env)
    .filter(key => key.startsWith('VITE_'))
    .reduce((acc, key) => {
      // Remove the "VITE_" prefix and expose the variable
      const newKey = key.replace(/^VITE_/, '');
      acc[`process.env.${newKey}`] = JSON.stringify(env[key]);
      return acc;
    }, {});

  return {
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
    define: processEnv,
    server: {
      port: parseInt(env.VITE_PORT || '8173', 10),
      host: '0.0.0.0',
      hmr: {
        overlay: false, // Disable overlay to prevent WebSocket errors;
        clientPort: parseInt(env.VITE_PORT || '8173', 10),
        port: 24878, // Use different port for HMR WebSocket (24678 + 200);
      },
      strictPort: false, // Allow fallback ports;
      // Proxy disabled to enable intelligent dynamic porting via BackendDiscoveryService
      // All API calls now go through dynamic discovery system
      // proxy: {
      //   '/api': {
      //     target: env.VITE_BACKEND_URL || 'http://localhost:8000',
      //     changeOrigin: true,
      //     secure: false,
      //     ws: false,
      //   },
      //   '/health': {
      //     target: env.VITE_BACKEND_URL || 'http://localhost:8000',
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
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            query: ['@tanstack/react-query'],
            state: ['zustand'],
          },
        },
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
  };
});
