import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    dir: 'src',
    environment: 'jsdom',
    globals: true,
    include: ['**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
