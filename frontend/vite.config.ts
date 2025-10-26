import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import tailwindcss from '@tailwindcss/postcss';
import dns from 'node:dns';
import path from 'path';
import http from 'node:http';
import https from 'node:https';
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
    .reduce<Record<string, string>>((acc, key) => {
      const newKey = key.replace(/^VITE_/, '');
      acc[`process.env.${newKey}`] = JSON.stringify(env[key]);
      return acc;
    }, {});

  const serverPort = Number.parseInt(env.VITE_PORT || '5173', 10);
  const hmrPort = env.VITE_HMR_PORT ? Number.parseInt(env.VITE_HMR_PORT, 10) : undefined;
  const hmrClientPort = env.VITE_HMR_CLIENT_PORT
    ? Number.parseInt(env.VITE_HMR_CLIENT_PORT, 10)
    : hmrPort ?? serverPort;
  const hmrHost = env.VITE_HMR_HOST || 'localhost';

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

    plugins: [
      react(),
      viteTsconfigPaths(),
      // Dev-only plugin: respond to OPTIONS preflight for /api/* locally so
      // browsers don't receive 405 from backends that don't implement OPTIONS.
      // This keeps dev experience smooth while still proxying actual requests.
      ...(mode === 'development' && !isElectron
        ? [
            {
              name: 'dev-preflight-options',
              configureServer(server) {
                server.middlewares.use((req, res, next) => {
                  try {
                    // Handle OPTIONS preflight locally to avoid 405s
                    if (req.method === 'OPTIONS' && req.url && req.url.startsWith('/api')) {
                      res.statusCode = 204;
                      res.setHeader('Access-Control-Allow-Origin', '*');
                      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
                      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                      res.end();
                      return;
                    }

                    // Some monitoring/fetch libraries issue HEAD requests to probe endpoints.
                    // Many backend endpoints don't implement HEAD and will return 405. For
                    // the dev experience we respond locally with a lightweight 204 and
                    // CORS headers so probes succeed and don't block chunks or other
                    // dynamic imports. This avoids generating load on the backend.
                    if (req.method === 'HEAD' && req.url && req.url.startsWith('/api')) {
                      res.statusCode = 204;
                      res.setHeader('Access-Control-Allow-Origin', '*');
                      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
                      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                      // No body for HEAD; end immediately
                      res.end();
                      return;
                    }
                  } catch (e) {
                    // ignore middleware errors and continue
                  }
                  return next();
                });
              },
            },
          ]
        : []),
    ],
    // Force PostCSS to resolve plugins from the frontend workspace
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        src: path.resolve(__dirname, './src'),
      },
  // Explicitly list extensions to resolve and prefer ts/tsx for modern toolchains
  extensions: ['.mjs', '.js', '.ts', '.tsx', '.jsx', '.json'],
    },

    define: {
      ...processEnv,
      // Polyfill process for browser compatibility
      'process.env.NODE_ENV': JSON.stringify(mode),
      global: 'globalThis',
    },

    server: {
      port: serverPort,
      host: '0.0.0.0',
      hmr: {
        overlay: false,
        host: hmrHost,
        clientPort: hmrClientPort,
        port: hmrPort,
      },
      strictPort: false,
      // Allow serving files from the workspace root (helps Windows setups)
      fs: {
        allow: [path.resolve(__dirname)],
      },
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

      // Dev: always provide a sensible proxy mapping so /api requests are
      // forwarded to the backend (avoids Vite answering API paths itself).
      proxy: mode === 'development' && !isElectron
        ? {
            '/api': {
              target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
              changeOrigin: true,
              secure: false,
              ws: false,
              // Helpful for debugging during local dev
              logLevel: 'debug',
            },
            '/auth': {
              target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
              changeOrigin: true,
              secure: false,
              logLevel: 'debug',
            },
            '/mlb': {
              target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
              changeOrigin: true,
              secure: false,
              logLevel: 'debug',
            },
            '/health': {
              target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
              changeOrigin: true,
              secure: false,
              logLevel: 'debug',
            },
            '/ws': {
              // Use VITE_BACKEND_URL if provided, converting http(s) -> ws(s). Fallback to 127.0.0.1 to avoid localhost/IPv6 resolution issues.
              target: env.VITE_BACKEND_URL?.replace(/^http/, 'ws') || 'ws://127.0.0.1:8000',
              ws: true,
              changeOrigin: true,
              logLevel: 'debug',
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
  'lucide-react',
      ],
      exclude: [
  ...(isElectron ? ['electron'] : []),
        'web-vitals',
        'chart.js',
        'react-chartjs-2',
      ],
      force: true,
    },
  };
});
