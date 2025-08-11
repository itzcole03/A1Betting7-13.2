// Simplified Jest Configuration for Phase 4 Testing
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  
  // Basic Transform Configuration
  transform: {
    "^.+\\.(ts|tsx)$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        ["@babel/preset-react", { runtime: "automatic" }],
        "@babel/preset-typescript"
      ],
    }],
    "^.+\\.(js|jsx)$": ["babel-jest"],
  },

  // Test Matching
  testMatch: [
    "<rootDir>/tests/**/*.(test|spec).(ts|tsx|js|jsx)",
    "<rootDir>/frontend/src/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)",
  ],

  // Ignore Patterns
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/electron-dist/",
  ],

  // Module Name Mapping
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/frontend/src/$1",
    "^src/(.*)$": "<rootDir>/frontend/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$": "jest-transform-stub",
  },

  // Coverage Configuration
  collectCoverageFrom: [
    "frontend/src/**/*.{ts,tsx,js,jsx}",
    "!frontend/src/**/*.d.ts",
    "!frontend/src/**/*.stories.{ts,tsx}",
    "!frontend/src/**/__tests__/**/*",
    "!frontend/src/**/*.test.{ts,tsx}",
    "!frontend/src/index.tsx",
    "!frontend/src/main.tsx",
  ],

  // Coverage Thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Reporters
  coverageReporters: ["json", "lcov", "text", "text-summary"],
  reporters: ["default"],

  // Timing Configuration
  testTimeout: 10000,
  
  // Transform Ignore Patterns
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$))",
  ],

  // Clear mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,
  
  // Force Exit
  forceExit: true,
};
