const tseslint = require('typescript-eslint');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'public/**',
      'assets/**',
      '**/*.d.ts',
      '**/*.cjs',
      'src/utils/createTimeoutSignal.ts',
      'src/pages/BankrollPageOld.tsx',
      'src/core/tests/smoke/**',
    ],
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'scripts/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-restricted-properties': [
        'error',
        {
          object: 'AbortSignal',
          property: 'timeout',
          message: 'Use createTimeoutSignal helper instead of AbortSignal.timeout.',
        },
      ],
    },
  },
];
