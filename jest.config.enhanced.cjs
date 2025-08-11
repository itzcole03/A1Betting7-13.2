// Enhanced Jest Configuration for Phase 4 Testing Automation
module.exports = {
  rootDir: ".",
  testEnvironment: "jest-fixed-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  
  // Enhanced Transform Configuration
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          allowImportingTsExtensions: false,
          moduleResolution: "node",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
        isolatedModules: true,
        useESM: false,
      },
    ],
    "^.+\\.(js|jsx)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript"
        ],
        plugins: [
          "@babel/plugin-transform-modules-commonjs",
          "@babel/plugin-proposal-class-properties",
        ],
      },
    ],
  },

  // Enhanced Test Matching
  testMatch: [
    "<rootDir>/frontend/src/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)",
    "<rootDir>/frontend/src/**/?(*.)(test|spec).(ts|tsx|js|jsx)",
    "<rootDir>/tests/unit/**/*.(test|spec).(ts|tsx|js|jsx)",
    "<rootDir>/tests/integration/**/*.(test|spec).(ts|tsx|js|jsx)",
  ],

  // Enhanced Ignore Patterns
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/electron-dist/",
    "/out/",
    "legacy",
    "deprecated",
    "broken",
    "backup",
    "temp",
    "tmp",
  ],

  // Enhanced Module Name Mapping
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/frontend/src/$1",
    "^src/(.*)$": "<rootDir>/frontend/src/$1",
    "^components/(.*)$": "<rootDir>/frontend/src/components/$1",
    "^services/(.*)$": "<rootDir>/frontend/src/services/$1",
    "^utils/(.*)$": "<rootDir>/frontend/src/utils/$1",
    "^hooks/(.*)$": "<rootDir>/frontend/src/hooks/$1",
    "^types/(.*)$": "<rootDir>/frontend/src/types/$1",
    "^contexts/(.*)$": "<rootDir>/frontend/src/contexts/$1",
    
    // React/DOM mappings
    "^react$": "<rootDir>/node_modules/react",
    "^react-dom$": "<rootDir>/node_modules/react-dom",
    
    // Asset mappings
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "jest-transform-stub",
    
    // Mock mappings
    "^framer-motion$": "<rootDir>/frontend/src/__mocks__/framer-motion.ts",
    "^framer-motion/(.*)$": "<rootDir>/frontend/src/__mocks__/framer-motion.ts",
    "^electron$": "<rootDir>/frontend/src/__mocks__/electron.ts",
    "^axios$": "<rootDir>/frontend/src/__mocks__/axios.ts",
  },

  // Global Test Variables
  globals: {
    "import.meta": {
      env: {
        MODE: "test",
        DEV: false,
        PROD: false,
        VITE_API_URL: "http://localhost:8000",
        VITE_WS_ENDPOINT: "ws://localhost:8000/ws",
        VITE_WS_URL: "ws://localhost:8000/ws",
        VITE_THEODDS_API_KEY: "test-key-theodds",
        VITE_SPORTRADAR_API_KEY: "test-key-sportradar",
        VITE_DAILYFANTASY_API_KEY: "test-key-dailyfantasy",
        VITE_PRIZEPICKS_API_KEY: "test-key-prizepicks",
      },
    },
  },

  // Enhanced Coverage Configuration
  collectCoverageFrom: [
    "frontend/src/**/*.{ts,tsx}",
    "!frontend/src/**/*.d.ts",
    "!frontend/src/**/*.stories.{ts,tsx}",
    "!frontend/src/**/__tests__/**/*",
    "!frontend/src/**/*.test.{ts,tsx}",
    "!frontend/src/**/*.spec.{ts,tsx}",
    "!frontend/src/**/test/**/*",
    "!frontend/src/index.tsx",
    "!frontend/src/main.tsx",
    "!frontend/src/reportWebVitals.ts",
    "!frontend/src/__mocks__/**/*",
    "!frontend/src/vite-env.d.ts",
    "!frontend/src/types/**/*.d.ts",
  ],

  // Coverage Thresholds for Phase 4
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Enhanced Reporters
  coverageReporters: ["json", "lcov", "text", "text-summary", "clover", "html"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "./reports/junit",
        outputName: "js-test-results.xml",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
        ancestorSeparator: " › ",
        usePathForSuiteName: true,
      },
    ],
    [
      "jest-sonar-reporter",
      {
        outputDirectory: "./reports/sonar",
        outputName: "test-report.xml",
      },
    ],
  ],

  // Test Environment Configuration
  testEnvironmentOptions: {
    url: "http://localhost:3000",
  },

  // Setup Files
  setupFiles: [
    "<rootDir>/jest.env.js",
    "<rootDir>/jest.polyfills.js",
  ],

  // Module Paths
  modulePaths: ["<rootDir>/frontend/src"],

  // Mock Configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Timing Configuration
  testTimeout: 15000,
  slowTestThreshold: 5,

  // Transform Ignore Patterns
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$|@testing-library|@tanstack|zustand|framer-motion|@mantine|lucide-react|eventemitter3|ky))",
  ],

  // Watch Configuration
  watchPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/coverage/",
    "/reports/",
  ],

  // Verbose Output
  verbose: true,
  
  // Error Handling
  errorOnDeprecated: true,
  
  // Cache Configuration
  cache: true,
  cacheDirectory: "<rootDir>/.jest-cache",
  
  // Maximum Worker Configuration
  maxWorkers: "50%",
  
  // Notification Configuration
  notify: false,
  notifyMode: "failure-change",
  
  // Collect Coverage From Test Files
  collectCoverageOnlyFrom: {
    "frontend/src/**/*.{ts,tsx}": true,
  },
  
  // Force Exit After Tests
  forceExit: true,
  
  // Detect Open Handles
  detectOpenHandles: true,
  detectLeaks: false,
};
