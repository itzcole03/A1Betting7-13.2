/* global module */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'react/prop-types': 'off',
    'no-unused-imports': 'warn',
    // Event Schema Governance
    'event-schema-governance': ['error', {
      schemaImportPatterns: ['../events/schema', '@/events/schema', './events/schema'],
      eventEmissionMethods: ['emit', 'publish', 'trigger', 'dispatch'],
      requiredVersionField: 'version'
    }]
  },
  overrides: [
    {
      files: ['eslint-rules/**/*.ts'],
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' in eslint rules
      }
    }
  ]
};
