import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs['recommended-requiring-type-checking'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // TypeScript specific
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],

      // React specific
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettierConfig,
  {
    files: ['src/common/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/business/**', '@/business/**', '@business/**'],
              message: 'common 模块禁止依赖 business（见 REFACTOR_2.0_BACKLOG R2-106）',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/business/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/components',
              message:
                'business 模块禁止整包 import @/components（R2-404）；请用子路径或 CalendarUiProvider / props 注入',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/common/ossFile/client.ts',
      'src/common/ossFile/index.ts',
      'src/common/file/index.ts',
      'src/common/auth/index.ts',
      'src/common/auth/client/index.ts',
      'src/common/auth/hooks/index.ts',
      'src/common/auth/components/index.ts',
      'src/common/auth/rn/index.ts',
      'src/common/universalFile/client.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'ali-oss',
              message: 'browser entry 禁止静态 import ali-oss（R2-213）',
            },
            {
              name: 'postgres',
              message: 'browser entry 禁止静态 import postgres（R2-213）',
            },
          ],
          patterns: [
            {
              group: ['node:*'],
              message: 'browser entry 禁止静态 import node: 内置模块（R2-213）',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['node_modules', 'dist', 'coverage', '.turbo', '*.config.js'],
  },
];

