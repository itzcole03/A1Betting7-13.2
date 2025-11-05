// Basic Jest Configuration for Phase 4 Testing
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["js", "jsx", "json"],
  
  // Simple Transform Configuration - JS only
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // Test Matching - JS only for now
  testMatch: [
    "<rootDir>/tests/**/*.(test|spec).js",
  ],

  // Ignore Patterns
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/electron-dist/",
  ],

  // Basic Module Name Mapping
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$": "jest-transform-stub",
  },

  // Coverage Configuration
  collectCoverageFrom: [
    "tests/**/*.js",
    "!tests/**/*.test.js",
    "!tests/**/*.spec.js",
  ],

  // Coverage Thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Reporters
  coverageReporters: ["text", "text-summary"],
  reporters: ["default"],

  // Timing Configuration
  testTimeout: 10000,
  
  // Clear mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,
  
  // Force Exit
  forceExit: true,
};
