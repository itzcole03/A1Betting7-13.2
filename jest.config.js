// Cleaned Jest config: only a single valid module.exports
module.exports = {
  rootDir: ".",
  testEnvironment: "jest-fixed-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  testMatch: [
    "<rootDir>/frontend/src/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)",
    "<rootDir>/frontend/src/**/?(*.)(test|spec).(ts|tsx|js|jsx)",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/electron-dist/",
    "<rootDir>/node_modules/",
    "<rootDir>/build/",
    "<rootDir>/dist/",
    "<rootDir>/out/",
    "<rootDir>/frontend/src/**/test-artifacts/",
    "<rootDir>/frontend/src/**/legacy/",
    "<rootDir>/frontend/src/**/deprecated/",
    "<rootDir>/frontend/src/**/broken/",
    "<rootDir>/frontend/src/**/old/",
    "<rootDir>/frontend/src/**/backup/",
    "<rootDir>/frontend/src/**/temp/",
    "<rootDir>/frontend/src/**/tmp/",
    "<rootDir>/frontend/src/**/node_modules/",
    "<rootDir>/frontend/src/**/electron-dist/",
    "<rootDir>/frontend/src/**/build/",
    "<rootDir>/frontend/src/**/dist/",
    "<rootDir>/frontend/src/**/out/",
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
  modulePaths: ["<rootDir>/frontend/src"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react-jsx",
      },
    },
  },
  preset: "ts-jest",
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$|@testing-library|@tanstack|zustand|framer-motion))",
  ],
};
