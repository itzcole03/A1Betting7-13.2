// jest.config.js -- must be valid CommonJS, no BOM, no trailing commas
module.exports = {
  testEnvironment: 'jest-fixed-jsdom',
  setupFiles: [
    '<rootDir>/jest.setup.onboarding.js',
    '<rootDir>/../test/jest.polyfill.js',
    '<rootDir>/../test/jest.setup.e2e.empty-flag.js',
    '<rootDir>/../jest.localstorage.js',
    '<rootDir>/../jest.matchmedia.js',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/jest.setup.e2e.js',
    '<rootDir>/../test/jest.setup.msw.js',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  testMatch: [
    '**/__tests__/*.[jt]s?(x)',
    '**/__tests__/**/*.[jt]s?(x)',
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
  ],
  moduleNameMapper: {
    // Map absolute imports for hooks
    'src/hooks/useEnhancedBets': '<rootDir>/src/hooks/useEnhancedBets',
    'src/hooks/usePortfolioOptimization': '<rootDir>/src/hooks/__mocks__/usePortfolioOptimization',
    'src/hooks/useAIInsights': '<rootDir>/src/hooks/__mocks__/useAIInsights',
    // Also map with .ts extension for TypeScript imports
    '^../hooks/usePortfolioOptimization.ts$':
      '<rootDir>/src/hooks/__mocks__/usePortfolioOptimization',
    '^./hooks/usePortfolioOptimization.ts$':
      '<rootDir>/src/hooks/__mocks__/usePortfolioOptimization',
    '^src/hooks/usePortfolioOptimization.ts$':
      '<rootDir>/src/hooks/__mocks__/usePortfolioOptimization',
    '^hooks/usePortfolioOptimization.ts$': '<rootDir>/src/hooks/__mocks__/usePortfolioOptimization',
    '^../hooks/useAIInsights.ts$': '<rootDir>/src/hooks/__mocks__/useAIInsights',
    '^./hooks/useAIInsights.ts$': '<rootDir>/src/hooks/__mocks__/useAIInsights',
    '^src/hooks/useAIInsights.ts$': '<rootDir>/src/hooks/__mocks__/useAIInsights',
    '^hooks/useAIInsights.ts$': '<rootDir>/src/hooks/__mocks__/useAIInsights',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Map both relative and absolute imports to the mock
    '^../services/unifiedApiService$': '<rootDir>/src/services/__mocks__/unifiedApiService',
    '^./services/unifiedApiService$': '<rootDir>/src/services/__mocks__/unifiedApiService',
    '^src/services/unifiedApiService$': '<rootDir>/src/services/__mocks__/unifiedApiService',
    '^services/unifiedApiService$': '<rootDir>/src/services/__mocks__/unifiedApiService',
    // Map AuthContext imports to the mock
    '^../contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext',
    '^./contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext',
    '^src/contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext',
    '^contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext',
    // Map hooks to their __mocks__ implementations
    '^../hooks/usePortfolioOptimization$': '<rootDir>/src/hooks/__mocks__/usePortfolioOptimization',
    '^./hooks/usePortfolioOptimization$': '<rootDir>/src/hooks/__mocks__/usePortfolioOptimization',
    '^src/hooks/usePortfolioOptimization$':
      '<rootDir>/src/hooks/__mocks__/usePortfolioOptimization',
    '^hooks/usePortfolioOptimization$': '<rootDir>/src/hooks/__mocks__/usePortfolioOptimization',
    '^../hooks/useAIInsights$': '<rootDir>/src/hooks/__mocks__/useAIInsights',
    '^./hooks/useAIInsights$': '<rootDir>/src/hooks/__mocks__/useAIInsights',
    '^src/hooks/useAIInsights$': '<rootDir>/src/hooks/__mocks__/useAIInsights',
    '^hooks/useAIInsights$': '<rootDir>/src/hooks/__mocks__/useAIInsights',
  },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: './reports/junit', outputName: 'js-test-results.xml' }],
  ],
  resetMocks: true,
  clearMocks: true,
  restoreMocks: true,
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '\\.d\\.ts$'],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
};
