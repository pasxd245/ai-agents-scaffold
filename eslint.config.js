import js from '@eslint/js';
import n from 'eslint-plugin-n';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'templates/**',
      '.claude/**',
      '.codex/**',
      '.gemini/**',
      '.github/skills/**',
      'dist/**',
      'build/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  n.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-process-exit': 'off',
      // fs.cpSync and node:test describe/it work on Node 20 we target;
      // the plugin flags them as "experimental" via stricter metadata.
      'n/no-unsupported-features/node-builtins': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
