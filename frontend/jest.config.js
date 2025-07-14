/**
 * Comprehensive Jest configuration for A1Betting Frontend
 * Supports TypeScript, React, and modern testing practices
 */

export default {
  // Test environment;
  testEnvironment: 'jsdom',

  // Test file patterns;
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],

  // TypeScript support;
  preset: 'ts-jest/presets/js-with-babel',
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(mjs|cjs)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react|react-dom|@testing-library|@babel|@mui|@emotion|lucide-react)/)',
  ],

  // Module resolution;
  moduleNameMapper: {
    // Handle absolute imports for all major folders;
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/models/(.*)$': '<rootDir>/src/models/$1',
    '^@/unified/(.*)$': '<rootDir>/src/unified/$1',
    '^@/(.*)$': '<rootDir>/src/$1',

    // Handle CSS modules and static assets;
    '.(css|less|scss|sass)$': 'identity-obj-proxy',
    '.(gif|ttf|eot|svg|png)$': '<rootDir>/src/test/__mocks__/fileMock.js',
  },

  // Setup files;
  setupFiles: ['<rootDir>/src/test/jest.setup-env.js'],
  setupFilesAfterEnv: ['<rootDir>/src/test/jest.setup-files.js'],

  // Coverage configuration;
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/test/**/*',
    '!src/stories/**/*',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  coverageReporters: ['text', 'lcov', 'clover', 'html'],

  // Test timeout;
  testTimeout: 10000,

  // Clear mocks between tests;
  clearMocks: true,

  // Verbose output;
  verbose: true,

  // Ignore patterns;
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/src/test/smoke.test.tsx',
    '<rootDir>/src/components/A1BettingPreview.test.tsx',
    '<rootDir>/src/components/AllFeatures.test.tsx',
    '<rootDir>/src/components/ArbitragePage.test.tsx',
    '<rootDir>/src/components/BankrollPage.test.tsx',
    '<rootDir>/src/components/featureCoverage.test.tsx',
    '<rootDir>/src/components/PayoutPreview.test.tsx',
    '<rootDir>/src/components/RiskManagerPage.test.tsx',
    '<rootDir>/src/components/ui/EnhancedPropCard.test.tsx',
    '<rootDir>/src/components/ui/PredictionSummaryCard.test.tsx',
    '<rootDir>/src/components/analytics/AnalyticsDashboard.test.tsx',
    '<rootDir>/src/models/__tests__/LineupSynergyModel.test.ts',
    '<rootDir>/src/models/__tests__/PlayerFormModel.test.ts',
    '<rootDir>/src/models/__tests__/PvPMatchupModel.test.ts',
    '<rootDir>/src/models/__tests__/RefereeImpactModel.test.ts',
    '<rootDir>/src/tests/example.test.ts',
    '<rootDir>/src/tests/optimization.test.ts',
    '<rootDir>/src/test/featureCoverage.test.tsx',
  ],

  // Module file extensions;
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
