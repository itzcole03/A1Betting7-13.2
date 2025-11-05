// Jest Configuration for Integration Tests - Phase 4.2
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["js", "jsx", "json"],
  
  // Integration Test Specific Configuration
  testMatch: [
    "<rootDir>/tests/integration/**/*.test.js",
  ],

  // Ignore patterns for integration tests
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/electron-dist/",
    "/tests/unit/",
    "/tests/e2e/",
    "/tests/performance/",
  ],

  // Basic transform for integration tests
  transform: {
    "^.+\\.js$": "babel-jest",
  },

  // Module name mapping for integration tests
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/tests/integration/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },

  // Coverage configuration for integration tests
  collectCoverageFrom: [
    "tests/integration/**/*.js",
    "!tests/integration/**/*.test.js",
    "!tests/integration/**/config/**",
    "!tests/integration/**/reports/**",
  ],

  // Integration test specific thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Enhanced timeout for integration tests
  testTimeout: 60000, // 60 seconds per test

  // Reporters for integration tests
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "./tests/integration/reports/junit",
        outputName: "integration-test-results.xml",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
        ancestorSeparator: " › ",
        usePathForSuiteName: true,
      },
    ],
  ],

  // Coverage reporters
  coverageReporters: ["text", "text-summary", "json", "html"],
  coverageDirectory: "tests/integration/reports/coverage",

  // Performance configuration
  maxWorkers: 2, // Limit workers for integration tests
  workerIdleMemoryLimit: "512MB",

  // Test environment options
  testEnvironmentOptions: {
    url: "http://localhost:8000",
  },

  // Global variables for integration tests
  globals: {
    __INTEGRATION_TEST__: true,
    __API_BASE_URL__: "http://localhost:8000",
  },

  // Setup files
  setupFiles: ["<rootDir>/jest.setup.js"],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output for integration tests
  verbose: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Error handling
  errorOnDeprecated: false,

  // Cache configuration
  cache: false, // Disable cache for integration tests

  // Silent mode
  silent: false,

  // Notification configuration
  notify: false,

  // Watch mode configuration (disabled for CI)
  watchman: false,
  
  // Custom test sequencer for integration tests
  testSequencer: "<rootDir>/tests/integration/config/testSequencer.js",
};
