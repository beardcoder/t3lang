import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import { includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath } from 'node:url';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import stylistic from '@stylistic/eslint-plugin';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
  includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
  stylistic.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js, prettier: prettierPlugin, stylistic },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
    rules: {
      ...prettierConfig.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': 'warn',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'prettier/prettier': 'error',
      '@stylistic/one-var-declaration-per-line': ['error', 'always'],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  tseslint.configs.recommended,
]);
