import react from '@vitejs/plugin-react';
import dns from 'node:dns';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import { createHtmlPlugin } from 'vite-plugin-html';
import { resolve } from 'path';

// Disable Console Ninja to prevent startup issues
process.env.DISABLE_CONSOLE_NINJA = 'true';
// Force DNS to return addresses in order (prevents IPv6-only binding on Windows)
dns.setDefaultResultOrder('verbatim');

export default defineConfig(({ mode, command }) => {
  // Load environment variables that start with VITE_
  const env = loadEnv(mode, process.cwd());

  // Determine if this is Electron build
  const isElectron = process.env.BUILD_TARGET === 'electron' || mode === 'electron';
  const isProduction = mode === 'production' || command === 'build';

  // Map the VITE_* variables to keys without the prefix
  const processEnv = Object.keys(env)
    .filter(key => key.startsWith('VITE_'))
    .reduce((acc, key) => {
      const newKey = key.replace(/^VITE_/, '');
      acc[`process.env.${newKey}`] = JSON.stringify(env[key]);
      return acc;
    }, {});

  return {
    base: isElectron ? './' : '/', 

    esbuild: {
      logLevel: 'error',
      target: 'es2020',
      drop: isProduction ? ['console', 'debugger'] : [],
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
      react({
        // Enable React Fast Refresh for better dev experience
        fastRefresh: !isProduction,
      }),
      viteTsconfigPaths(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        src: path.resolve(__dirname, './src'),
      },
    },

    define: {
      ...processEnv,
      'process.env.NODE_ENV': JSON.stringify(mode),
      global: 'globalThis',
      // Enable aggressive dead code elimination
      __DEV__: !isProduction,
    },

    server: {
      port: parseInt(env.VITE_PORT || '5173', 10),
      host: '0.0.0.0',
      hmr: {
        overlay: false,
        clientPort: parseInt(env.VITE_PORT || '5173', 10),
        port: 24878,
      },
      strictPort: false,
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.scannerwork/**',
          '**/scanner-report/**',
          '**/*.pb',
        ],
      },

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
      sourcemap: command === 'build' ? 'hidden' : false,
      
      // Enhanced minification settings
      minify: 'terser',
      terserOptions: {
        compress: {
          arguments: true,
          booleans_as_integers: true,
          drop_console: isProduction,
          drop_debugger: true,
          ecma: 2020,
          hoist_funs: true,
          passes: 2,
          pure_getters: true,
          unsafe: true,
          unsafe_arrows: true,
          unsafe_methods: true,
          unsafe_proto: true,
        },
        mangle: {
          properties: {
            regex: /^_/,
          },
        },
        format: {
          comments: false,
        },
      },

      // Target modern browsers for smaller bundles
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
      
      // Aggressive tree shaking
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
      },

      rollupOptions: {
        external: isElectron ? ['electron'] : [],
        
        // Enhanced manual chunking strategy for optimal bundle splitting
        output: {
          format: 'es',
          manualChunks: isProduction ? (id) => {
            // Core React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            
            // React Router
            if (id.includes('react-router')) {
              return 'react-router';
            }
            
            // Large UI libraries
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            
            // Charts and visualization (large libraries)
            if (id.includes('chart.js') || id.includes('recharts') || id.includes('react-chartjs-2')) {
              return 'charts';
            }
            
            // Data fetching and state management
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            
            if (id.includes('zustand')) {
              return 'state';
            }
            
            // UI components from Radix
            if (id.includes('@radix-ui')) {
              return 'ui-radix';
            }
            
            // Lucide icons (can be large)
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            
            // Utilities
            if (id.includes('class-variance-authority') || 
                id.includes('clsx') || 
                id.includes('tailwind-merge') ||
                id.includes('crypto-js') ||
                id.includes('immer')) {
              return 'utils';
            }
            
            // Analytics and performance monitoring
            if (id.includes('web-vitals')) {
              return 'analytics';
            }
            
            // Error handling
            if (id.includes('react-error-boundary')) {
              return 'error-handling';
            }
            
            // Large feature modules
            if (id.includes('/src/components/player/') || 
                id.includes('PlayerDashboard')) {
              return 'feature-player';
            }
            
            if (id.includes('/src/components/betting/') || 
                id.includes('BetSlip') ||
                id.includes('Arbitrage')) {
              return 'feature-betting';
            }
            
            if (id.includes('/src/components/analytics/') ||
                id.includes('Analytics') ||
                id.includes('MLModel')) {
              return 'feature-analytics';
            }
            
            if (id.includes('/src/components/prediction/') ||
                id.includes('Prediction')) {
              return 'feature-predictions';
            }
            
            // Large service modules
            if (id.includes('/src/services/')) {
              return 'services';
            }
            
            // Node modules that aren't caught above
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            
            // Default chunk for small modules
            return undefined;
          } : undefined,
          
          // Optimized chunk and asset naming
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId;
            if (facadeModuleId) {
              const parts = facadeModuleId.split('/');
              const fileName = parts[parts.length - 1]?.replace(/\.\w+$/, '') || 'unknown';
              return `js/${fileName}-[hash].js`;
            }
            return 'js/[name]-[hash].js';
          },
          
          entryFileNames: 'js/entry-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            const extType = info[info.length - 1];
            
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name || '')) {
              return 'img/[name]-[hash].[ext]';
            }
            
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
              return 'fonts/[name]-[hash].[ext]';
            }
            
            if (/\.css$/i.test(assetInfo.name || '')) {
              return 'css/[name]-[hash].[ext]';
            }
            
            return 'assets/[name]-[hash].[ext]';
          },
          
          // Additional optimizations
          generatedCode: {
            symbols: true,
            constBindings: true,
          },
          
          // Improve compression
          compact: true,
        },
        
        // Optimization for tree shaking
        treeshake: {
          preset: 'recommended',
          moduleSideEffects: (id) => {
            // Allow side effects for CSS imports
            return /\.css$/.test(id);
          },
        },
        
        onwarn(warning, warn) {
          // Suppress common warnings that don't affect functionality
          if (warning.code === 'UNRESOLVED_IMPORT') return;
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          if (warning.code === 'THIS_IS_UNDEFINED') return;
          warn(warning);
        },
      },
      
      // Increase chunk size warnings threshold
      chunkSizeWarningLimit: 500, // 500kb chunks
    },

    optimizeDeps: {
      include: [
        // Pre-bundle these dependencies for faster dev startup
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
        'react-router-dom',
        'react-error-boundary',
        'immer',
        'crypto-js',
        'web-vitals',
        'zod',
      ],
      exclude: isElectron ? ['electron'] : [],
      force: true,
      
      // Use esbuild for faster dependency pre-bundling
      esbuildOptions: {
        target: 'es2020',
      },
    },

    // CSS optimization
    css: {
      devSourcemap: !isProduction,
      postcss: isProduction ? {
        plugins: {
          autoprefixer: {},
          cssnano: {
            preset: ['default', {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              mergeLonghand: true,
              mergeRules: true,
            }],
          },
        },
      } : undefined,
    },

    // Enable experimental features for better performance
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `"/${filename}"` };
        } else {
          return { relative: true };
        }
      },
    },
  };
});
