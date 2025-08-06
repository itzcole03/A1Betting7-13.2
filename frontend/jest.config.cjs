// Unified Jest Configuration - consolidates all test setups
module.exports = {
  setupFiles: ['<rootDir>/jest.polyfill.textencoder.js'],
  testEnvironmentOptions: {
    customExportConditions: [''],
    url: 'http://localhost',
  },
  moduleNameMapper: {
    '^msw/node$': '<rootDir>/../node_modules/msw/lib/node/index.js',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  rootDir: '.',
  testEnvironment: 'jest-fixed-jsdom',

  // Unified setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // File extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Transform configuration
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/src/**/?(*.)(test|spec).(ts|tsx|js|jsx)',
  ],
  testPathIgnorePatterns: [
    '/electron-dist/',
    '/node_modules/',
    '/build/',
    '/dist/',
    '/out/',
    '/src/test-artifacts/',
    '/src/legacy/',
    '/src/deprecated/',
    '/src/broken/',
    '/src/old/',
    '/src/backup/',
  ],
};
