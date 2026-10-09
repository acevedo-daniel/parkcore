import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['coverage/', 'dist/', 'node_modules/', 'prisma/generated/'],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['*.config.{js,mjs,cjs,ts,mts,cts}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.name=/^(it|test)$/][arguments.length=3]',
          message: 'Configure test budgets globally.',
        },
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='only']",
          message: 'Do not commit focused tests.',
        },
      ],
    },
  },
  eslintConfigPrettier,
);
