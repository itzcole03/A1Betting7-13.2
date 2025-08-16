import react from '@vitejs/plugin-react';
import dns from 'node:dns';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// Disable Console Ninja to prevent startup issues
process.env.DISABLE_CONSOLE_NINJA = 'true';
// Force DNS to return addresses in order (prevents IPv6-only binding on Windows)
dns.setDefaultResultOrder('verbatim');

export default defineConfig(({ mode, command }) => {
  // Load environment variables that start with VITE_
  const env = loadEnv(mode, process.cwd());

  // Determine if this is Electron build
  const isElectron = process.env.BUILD_TARGET === 'electron' || mode === 'electron';

  // Map the VITE_* variables to keys without the prefix
  const processEnv = Object.keys(env)
    .filter(key => key.startsWith('VITE_'))
    .reduce((acc, key) => {
      const newKey = key.replace(/^VITE_/, '');
      acc[`process.env.${newKey}`] = JSON.stringify(env[key]);
      return acc;
    }, {});

  return {
    base: isElectron ? './' : '/', // Important for Electron compatibility

    esbuild: {
      logLevel: 'error',
      target: 'es2020',
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

    plugins: [react(), viteTsconfigPaths()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        src: path.resolve(__dirname, './src'),
      },
    },

    define: {
      ...processEnv,
      // Polyfill process for browser compatibility
      'process.env.NODE_ENV': JSON.stringify(mode),
      global: 'globalThis',
    },

    server: {
      port: parseInt(env.VITE_PORT || '5173', 10),
      host: '0.0.0.0',
      hmr: {
        overlay: false,
        clientPort: parseInt(env.VITE_PORT || '5173', 10),
        port: 24878,
        // Explicitly set HMR host to prevent stale port references (fixes ws://localhost:8174 errors)
        host: 'localhost',
      },
      strictPort: false,
      watch: {
        // Ignore scanner-report files to prevent excessive reloads
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.scannerwork/**',
          '**/scanner-report/**',
          '**/*.pb',
        ],
      },

      // Conditional proxy setup
      proxy:
        mode === 'development' && !isElectron
          ? {
              '/api': {
                target: env.VITE_BACKEND_URL || 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
                ws: false,
              },
              '/auth': {
                target: env.VITE_BACKEND_URL || 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
              },
              '/mlb': {
                target: env.VITE_BACKEND_URL || 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
              },
              '/health': {
                target: env.VITE_BACKEND_URL || 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
              },
              '/ws': {
                target: 'ws://localhost:8000',
                ws: true,
                changeOrigin: true,
              },
            }
          : undefined,
    },

    build: {
      outDir: isElectron ? 'dist-electron' : 'dist',
      assetsDir: 'assets',
      sourcemap: command === 'build',
      minify: command === 'build' ? 'esbuild' : false,
      rollupOptions: {
        external: isElectron ? ['electron'] : [],
        output: {
          manualChunks:
            command === 'build'
              ? {
                  react: ['react', 'react-dom'],
                  query: ['@tanstack/react-query'],
                  state: ['zustand'],
                  ui: ['@radix-ui/react-tabs', '@radix-ui/react-slot', '@radix-ui/react-label'],
                  motion: ['framer-motion'],
                  utils: ['class-variance-authority', 'clsx', 'tailwind-merge'],
                }
              : undefined,
          // Reduce chunk size to minimize preload warnings
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
        onwarn(warning, warn) {
          // Suppress common warnings that don't affect functionality
          if (warning.code === 'UNRESOLVED_IMPORT') return;
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          if (warning.message?.includes('source map')) return;
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
        'framer-motion',
      ],
      exclude: isElectron ? ['electron'] : [],
      force: true,
    },
  };
});
