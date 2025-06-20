module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint/eslint-plugin', 
    '@darraghor/nestjs-typed',
    'deprecation',
    'only-warn',
    'prefer-arrow',
    'tsdoc'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@darraghor/nestjs-typed/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: false,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/**/*', 'node_modules/**/*'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',

    // New plugin rules
    'deprecation/deprecation': 'warn',
    'prefer-arrow/prefer-arrow-functions': ['warn', {
      'disallowPrototype': true,
      'singleReturnOnly': false,
      'classPropertiesAllowed': false
    }],
    'tsdoc/syntax': 'warn',

    // General JavaScript/TypeScript rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-trailing-spaces': 'error',
    'prefer-const': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],

    // NestJS specific rules
    'class-methods-use-this': 'off', // NestJS services don't always use 'this'
    
    // Code organization
    'sort-imports': ['error', {
      'ignoreCase': false,
      'ignoreDeclarationSort': true,
      'ignoreMemberSort': false,
      'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
      'allowSeparatedGroups': true
    }],

    // Best practices
    'prefer-template': 'error',
    'object-shorthand': 'error',
    'no-var': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-param-reassign': 'error',
    'no-return-assign': 'error',
    'no-throw-literal': 'error',

    // Formatting (handled by Prettier mostly, but some ESLint rules)
    'comma-dangle': ['error', 'always-multiline'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'indent': 'off', // Let Prettier handle this
    'max-len': 'off', // Let Prettier handle this

    // Performance
    'no-await-in-loop': 'warn',
    'require-atomic-updates': 'error',

    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Complexity
    'complexity': ['warn', 10],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 3],

    // Disable overly strict rules for development productivity
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/no-magic-numbers': 'off',
    'max-lines': 'off',
    'max-lines-per-function': 'off',
  },
  overrides: [
    {
      // Specific rules for DTO files
      files: ['**/*.dto.ts'],
      rules: {
        'max-classes-per-file': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
      },
    },
    {
      // Specific rules for guards, decorators, interceptors
      files: ['**/*.guard.ts', '**/*.decorator.ts', '**/*.interceptor.ts', '**/*.filter.ts'],
      rules: {
        '@darraghor/nestjs-typed/injectable-should-be-provided': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        'prefer-arrow/prefer-arrow-functions': 'off', // Decorators and utility functions are fine
      },
    },
    {
      // Specific rules for configuration files
      files: ['**/*.config.ts'],
      rules: {
        '@typescript-eslint/no-magic-numbers': 'off',
      },
    },
    {
      // Specific rules for entity/model files
      files: ['**/*.entity.ts', '**/*.model.ts'],
      rules: {
        'max-classes-per-file': 'off',
      },
    },
    {
      // Specific rules for migration files
      files: ['**/migrations/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'max-lines': 'off',
      },
    },
    {
      // Specific rules for Prisma service files
      files: ['**/prisma.service.ts', '**/database/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        'no-await-in-loop': 'off', // Database operations often need sequential processing
        'prefer-arrow/prefer-arrow-functions': 'off', // Class methods are fine here
      },
    },
    {
      // Specific rules for seed files
      files: ['**/seed.ts', '**/prisma/seed.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        'no-console': 'off', // Seed files need console output
        'max-lines': 'off', // Seed files can be long
      },
    },
    {
      // Specific rules for main.ts - bootstrap function is conventional
      files: ['**/main.ts'],
      rules: {
        'prefer-arrow/prefer-arrow-functions': 'off',
      },
    },
  ],
}; 