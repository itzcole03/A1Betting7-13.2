// Unified Jest Configuration - consolidates all test setups
module.exports = {
  setupFiles: ['<rootDir>/jest.polyfill.textencoder.js', '<rootDir>/jest.env.mock.js'],
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
  setupFilesAfterEnv: ['<rootDir>/jest.dom.setup.js'],

  // File extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Transform configuration
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },

  // Transform ESM modules in node_modules (React 19, @testing-library/react, etc)
  transformIgnorePatterns: [
    '/node_modules/(?!(react|react-dom|@testing-library|@tanstack|lucide-react|framer-motion|recharts|zustand)/)',
  ],

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
