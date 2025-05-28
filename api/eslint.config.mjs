// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'node_modules/**',
      'prisma/migrations/**',
      'coverage/**',
      '*.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // TypeScript правила
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // NestJS специфичные правила для архитектуры
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Правила именования для NestJS конвенций
      '@typescript-eslint/naming-convention': [
        'error',
        // Классы в PascalCase (Controllers, Services, Modules, etc.)
        {
          selector: 'class',
          format: ['PascalCase'],
          custom: {
            regex:
              '^[A-Z][a-zA-Z0-9]*(Controller|Service|Module|Guard|Interceptor|Filter|Pipe|Strategy|Provider|Gateway|Processor|Job|Exception|Interface|Entity|Dto)$',
            match: true,
          },
        },
        // Интерфейсы с I префиксом или без
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^[A-Z][a-zA-Z0-9]*Interface$|^[A-Z][a-zA-Z0-9]*$',
            match: true,
          },
        },
        // Перечисления в PascalCase
        {
          selector: 'enum',
          format: ['PascalCase'],
          custom: {
            regex: '^[A-Z][a-zA-Z0-9]*Enum$|^[A-Z][a-zA-Z0-9]*$',
            match: true,
          },
        },
        // Элементы перечислений в UPPER_CASE
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
        // Методы в camelCase
        {
          selector: 'method',
          format: ['camelCase'],
        },
        // Свойства в camelCase
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE'],
        },
        // Переменные в camelCase
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
        },
        // Параметры в camelCase
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],

      // Организация импортов
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],

      // Структура и архитектура
      'max-lines': [
        'warn',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'warn',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['warn', 10],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 4],

      // Качество кода
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-unused-expressions': 'error',

      // Стиль кода
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'always-multiline'],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: ['error', 2],
      'eol-last': ['error', 'always'],
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],

      // Безопасность
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },
  // Специальные правила для разных типов файлов
  {
    files: ['**/*.controller.ts'],
    rules: {
      // Контроллеры должны быть максимально простыми
      'max-lines-per-function': ['warn', { max: 30 }],
      complexity: ['warn', 5],
    },
  },
  {
    files: ['**/*.service.ts'],
    rules: {
      // Сервисы могут быть сложнее
      'max-lines-per-function': ['warn', { max: 60 }],
      complexity: ['warn', 12],
    },
  },
  {
    files: ['**/*.module.ts'],
    rules: {
      // Модули должны быть простыми конфигурационными файлами
      'max-lines': ['warn', { max: 100 }],
    },
  },
  {
    files: ['**/*.dto.ts', '**/*.interface.ts'],
    rules: {
      // DTO и интерфейсы - только описание структуры
      'max-lines': ['warn', { max: 200 }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      // Тесты могут быть более гибкими
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['src/prisma/**/*.ts'],
    rules: {
      // Prisma файлы
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines': 'off',
    },
  },
  {
    files: ['src/config/**/*.ts'],
    rules: {
      // Конфигурационные файлы
      'max-lines': ['warn', { max: 150 }],
    },
  },
  {
    files: ['src/common/**/*.ts'],
    rules: {
      // Общие утилиты и компоненты
      'max-lines-per-function': ['warn', { max: 40 }],
    },
  },
);
