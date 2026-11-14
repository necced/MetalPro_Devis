import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importPlugin from 'eslint-plugin-import';
import unicornPlugin from 'eslint-plugin-unicorn';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'build', '.vite', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: { version: '18.2' },
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.app.json', './tsconfig.node.json'],
        },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
      unicorn: unicornPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...unicornPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: 'react**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@radix-ui/**',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            id: true,
            uuid: true,
            props: true,
            ref: true,
            url: true,
            html: true,
            css: true,
            js: true,
            ts: true,
            api: true,
            ui: true,
            db: true,
            pdf: true,
            fefo: true,
            lifo: true,
            fmcg: true,
          },
        },
      ],
    },
  },
  {
    files: ['**/*.config.{js,ts}', '**/*.config.*.{js,ts}'],
    rules: {
      'unicorn/prefer-node-protocol': 'off',
    },
  }
);
