  testEnvironment: "jsdom",
  setupFiles: [
    "<rootDir>/jest.env.js",
    "<rootDir>/jest.localstorage.js",
    "<rootDir>/jest.matchmedia.js",
    // fetch mocks/polyfills removed to avoid conflicts with MSW
  ],
  setupFilesAfterEnv: [
    "<rootDir>/test/jest.setup.msw.js",
    "<rootDir>/jest.setup.js",
    "<rootDir>/jest.setup.e2e.js",
  ],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx|js)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
};

module.exports = {
  testEnvironment: "jsdom",
  setupFiles: [
    "<rootDir>/jest.env.js",
    "<rootDir>/jest.localstorage.js",
    "<rootDir>/jest.matchmedia.js",
    // fetch mocks/polyfills removed to avoid conflicts with MSW
  ],
  setupFilesAfterEnv: [
    "<rootDir>/test/jest.setup.msw.js",
    "<rootDir>/jest.setup.js",
    "<rootDir>/jest.setup.e2e.js",
  ],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx|js)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
};
