// Cleaned Jest config: only a single valid module.exports
module.exports = {
  rootDir: ".",
  testEnvironment: "jest-fixed-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  testMatch: [
    "<rootDir>/frontend/src/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)",
    "<rootDir>/frontend/src/**/?(*.)(test|spec).(ts|tsx|js|jsx)",
  ],
  testPathIgnorePatterns: [
    "/electron-dist/",
    "/node_modules/",
    "/build/",
    "/dist/",
    "/out/",
    "/frontend/src/.*test-artifacts/",
    "/frontend/src/.*legacy/",
    "/frontend/src/.*deprecated/",
    "/frontend/src/.*broken/",
    "/frontend/src/.*old/",
    "/frontend/src/.*backup/",
    "/frontend/src/.*temp/",
    "/frontend/src/.*tmp/",
    "/frontend/src/.*node_modules/",
    "/frontend/src/.*electron-dist/",
    "/frontend/src/.*build/",
    "/frontend/src/.*dist/",
    "/frontend/src/.*out/",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/frontend/src/$1",
    "^src/(.*)$": "<rootDir>/frontend/src/$1",
    "^react$": "<rootDir>/node_modules/react",
    "^react-dom$": "<rootDir>/node_modules/react-dom",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "jest-transform-stub",
    "^src/services/__mocks__/(.*)$":
      "<rootDir>/frontend/src/services/__mocks__/$1",
    "^src/hooks/(.*)$": "<rootDir>/frontend/src/hooks/__mocks__/$1",
    // Mock framer-motion for tests
    "^framer-motion$": "<rootDir>/frontend/src/__mocks__/framer-motion.js",
    "^framer-motion/(.*)$": "<rootDir>/frontend/src/__mocks__/framer-motion.js",
  },
  globals: {
    "import.meta": {
      env: {
        VITE_API_URL: "http://localhost:8000",
        VITE_WS_ENDPOINT: "ws://localhost:8000/ws",
        VITE_WS_URL: "ws://localhost:8000/ws",
        VITE_THEODDS_API_KEY: "test-key",
        VITE_SPORTRADAR_API_KEY: "test-key",
        VITE_DAILYFANTASY_API_KEY: "test-key",
        VITE_PRIZEPICKS_API_KEY: "test-key",
      },
    },
  },
  collectCoverageFrom: [
    "frontend/src/**/*.{ts,tsx}",
    "!frontend/src/**/*.d.ts",
    "!frontend/src/**/*.stories.{ts,tsx}",
    "!frontend/src/**/__tests__/**/*",
    "!frontend/src/**/test/**/*",
    "!frontend/src/index.tsx",
    "!frontend/src/reportWebVitals.ts",
  ],
  coverageReporters: ["json", "lcov", "text", "clover", "html"],
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
  ],
  testEnvironmentOptions: {
    url: "http://localhost",
  },
  setupFiles: ["<rootDir>/jest.env.js"],
  modulePaths: ["<rootDir>/frontend/src"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  preset: "ts-jest",
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$|@testing-library|@tanstack|zustand|framer-motion))",
  ],
};
