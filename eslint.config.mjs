import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const forbiddenEverywhere = [
  { name: 'class-validator', message: 'Use Zod schemas for validation.' },
  { name: 'class-transformer', message: 'Use Zod schemas and mappers instead.' },
  { name: 'express', message: 'The HTTP layer is Fastify.' },
  { name: '@nestjs/platform-express', message: 'The HTTP layer is Fastify.' },
];

const technicalPackages = [
  '@nestjs/*',
  'firebase-admin',
  'firebase-admin/*',
  '@google-cloud/*',
  'fastify',
  'typeorm',
  'nestjs-zod',
  'nestjs-pino',
];

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      'no-restricted-imports': ['error', { paths: forbiddenEverywhere }],
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: forbiddenEverywhere,
          patterns: [
            {
              group: [...technicalPackages, '@application/*', '@infrastructure/*'],
              message: 'The domain must not depend on technical or outer layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: forbiddenEverywhere,
          patterns: [
            {
              group: ['@infrastructure/*', 'firebase-admin', 'firebase-admin/*', '@google-cloud/*', 'fastify', 'typeorm'],
              message: 'The application layer only talks to the domain and its ports.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.mjs'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  prettier,
);
