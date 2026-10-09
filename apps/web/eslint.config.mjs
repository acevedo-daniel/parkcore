import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import query from '@tanstack/eslint-plugin-query';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['coverage/', 'dist/', 'node_modules/', 'playwright-report/', 'test-results/'] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['e2e/**/*.ts'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['e2e/**/*.ts'],
    ignores: ['e2e/fixtures.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test'],
              message: 'Import test from the readiness fixture.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name='waitForTimeout']",
          message: 'Wait on an observable condition.',
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.object.name='test'][callee.property.name='setTimeout']",
          message: 'Set budgets only in runner configuration.',
        },
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='only']",
          message: 'Do not commit focused tests.',
        },
        {
          selector: "CallExpression > ObjectExpression > Property[key.name='timeout']",
          message: 'Do not override wait or test budgets at call sites.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name=/^(it|test)$/][arguments.length=3]',
          message: 'Configure test budgets globally.',
        },
        {
          selector:
            "CallExpression[callee.name=/^(waitFor|waitForElementToBeRemoved)$/] > ObjectExpression > Property[key.name='timeout']",
          message: 'Configure asyncUtilTimeout in shared setup.',
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(findBy|findAllBy)/] > ObjectExpression > Property[key.name='timeout']",
          message: 'Do not override asynchronous query budgets.',
        },
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='only']",
          message: 'Do not commit focused tests.',
        },
      ],
    },
  },
  {
    files: ['public/**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.browser,
    },
  },
  query.configs['flat/recommended'],
  {
    files: ['*.config.{js,mjs,cjs,ts,mts,cts}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  eslintConfigPrettier,
);
