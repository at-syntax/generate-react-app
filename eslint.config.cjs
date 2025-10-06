const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const { defineConfig } = require('eslint/config');
const prettier = require('eslint-plugin-prettier/recommended');
const myPrettierConfig =  require('./prettier.config.cjs');

module.exports = defineConfig(
  {
    ignores: [
      'lib/**/*',
      'node_modules/**/*',
      'src/templates/**/*',
      '*.js',
      '*.mjs',
      '*.cjs',
      'bin/**/*',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'prettier/prettier': ['warn', myPrettierConfig],
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);