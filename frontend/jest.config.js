// Unified Jest Configuration - consolidates all test setups
module.exports = {
  testEnvironment: 'jsdom',
  
  // Unified setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
  ],
  
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
  
  // Module name mapping
  moduleNameMapper: {
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    
    // Style mocks
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
    
    // Service mocks
    '^(.*/)?services/(.*)$': '<rootDir>/src/services/__mocks__/$2',
    
    // Hook mocks
    '^(.*/)?hooks/(.*)$': '<rootDir>/src/hooks/__mocks__/$2',
    
    // Context mocks
    '^(.*/)?contexts/(.*)$': '<rootDir>/src/contexts/__mocks__/$2',
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
    ['jest-junit', { 
      outputDirectory: './reports/junit', 
      outputName: 'js-test-results.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true,
    }],
  ],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '\\.d\\.ts$',
  ],
  
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
  preset: 'ts-jest/presets/js-with-ts',
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@tanstack|zustand|framer-motion))',
  ],
};
