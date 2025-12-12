import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Allow trailing commas
      'comma-dangle': ['error', 'always-multiline'],
      // Allow console.log in scripts
      'no-console': 'off',
      // Allow unused variables that start with underscore
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow require() and other Node.js globals
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Allow trailing commas
      'comma-dangle': ['error', 'always-multiline'],
      // Allow console.log in scripts
      'no-console': 'off',
      // Allow unused variables that start with underscore
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow require() and other Node.js globals
      'no-undef': 'off',
    },
  },
  {
    files: ['scripts/**/*.js', 'scripts/**/*.mjs', 'scripts/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
  },
  {
    files: ['scripts/**/*.ts', 'scripts/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Allow trailing commas
      'comma-dangle': ['error', 'always-multiline'],
      // Allow console.log in scripts
      'no-console': 'off',
      // Allow unused variables that start with underscore
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow require() and other Node.js globals
      'no-undef': 'off',
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'build/**', 'dist/**', 'coverage/**'],
  },
];
