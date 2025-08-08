import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/vitest.setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}',
      'src/tests/**/*.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
      'src/components/**/*.test.{ts,tsx}',
      'src/pages/**/*.test.{ts,tsx}',
      'src/services/**/*.test.{ts,tsx}',
      'src/utils/**/*.test.{ts,tsx}',
      'src/store/**/*.test.{ts,tsx}',
      'src/core/**/*.test.{ts,tsx}',
      '!**/e2e/**',
      '!**/playwright/**',
      '!**/*.spec.{ts,tsx,js}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      '**/e2e/**',
      '**/playwright/**',
      '**/*.spec.{ts,tsx,js}',
      '**/testHelpers/**',
      '**/setupTests.{ts,js}',
    ],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
