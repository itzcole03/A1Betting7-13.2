const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  js.config({
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  }),
  tseslint.config({
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  }),
  react.config({
    files: ['**/*.jsx', '**/*.tsx'],
    settings: { react: { version: 'detect' } },
    rules: {
      'react/prop-types': 'off',
    },
  }),
  reactHooks.config({
    files: ['**/*.jsx', '**/*.tsx'],
  }),
];
// deleted
