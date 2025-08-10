// Unified Jest Configuration - consolidates all test setups
module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
    },
  },
  // Increase default test timeout for all tests (30s)
  testTimeout: 30000,
  // Test environment setup
  testEnvironment: 'jest-fixed-jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
    url: 'http://localhost',
  },

  // Setup files - run before each test
  setupFiles: ['<rootDir>/jest.polyfill.textencoder.js', '<rootDir>/jest.env.mock.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.dom.setup.js'],

  // Module handling
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  moduleNameMapper: {
    // Handle MSW imports
    '^msw/node$': '<rootDir>/../node_modules/msw/lib/node/index.js',
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    // Handle CSS and static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      'jest-transform-stub',
  },

  // Transform configuration
  transform: {
    '^.+\\.[tj]sx?$': [
      'babel-jest',
      {
        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
        plugins: [
          // Transform import.meta for Jest compatibility
          [
            'babel-plugin-transform-import-meta',
            {
              module: 'ES6',
            },
          ],
        ],
      },
    ],
  },

  // Transform ESM modules in node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!(react|react-dom|@testing-library|@tanstack|lucide-react|framer-motion|recharts|zustand|msw)/)',
  ],

  // Test file patterns

  // Restrict tests and coverage to src/ only
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
    '/admin/',
    '/shared/',
    '/features/',
    '/services/',
    '/src/test-artifacts/',
    '/src/legacy/',
    '/src/deprecated/',
    '/src/broken/',
    '/src/old/',
    '/src/backup/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/test-utils/**',
    '!src/vite-env.d.ts',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // Global test settings
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,

  // Verbose output for CI
  verbose: process.env.CI === 'true',

  // Reporter configuration for CI
  reporters: process.env.CI
    ? [
        'default',
        [
          'jest-junit',
          {
            outputDirectory: 'reports/junit',
            outputName: 'js-test-results.xml',
          },
        ],
      ]
    : ['default'],
};
