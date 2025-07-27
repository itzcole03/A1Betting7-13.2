// Unified Jest Configuration - consolidates all test setups
module.exports = {
  rootDir: '../',
  testEnvironment: 'jest-fixed-jsdom',

  // Unified setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // File extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/src/**/?(*.)(test|spec).(ts|tsx|js|jsx)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/electron-dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/out/',
    '<rootDir>/src/**/test-artifacts/',
    '<rootDir>/src/**/legacy/',
    '<rootDir>/src/**/deprecated/',
    '<rootDir>/src/**/broken/',
    '<rootDir>/src/**/old/',
    '<rootDir>/src/**/backup/',
    '<rootDir>/src/**/temp/',
    '<rootDir>/src/**/tmp/',
    '<rootDir>/src/**/node_modules/',
    '<rootDir>/src/**/electron-dist/',
    '<rootDir>/src/**/build/',
    '<rootDir>/src/**/dist/',
    '<rootDir>/src/**/out/',
  ],

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '^src/(.*)$': '<rootDir>/frontend/src/$1',
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      'jest-transform-stub',
    '^src/services/__mocks__/(.*)$': '<rootDir>/frontend/src/services/__mocks__/$1',
    '^src/hooks/(.*)$': '<rootDir>/frontend/src/hooks/__mocks__/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**/*',
    '!src/**/test/**/*',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],

  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],

  // Test reporting
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './reports/junit',
        outputName: 'js-test-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost',
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/coverage/', '\\.d\\.ts$'],

  // Module paths
  modulePaths: ['<rootDir>/src'],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Timeout
  testTimeout: 10000,

  // Globals
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },

  // Preset
  preset: 'ts-jest',

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@tanstack|zustand|framer-motion))',
  ],
};
