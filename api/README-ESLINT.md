# ESLint Configuration for NestJS Project

## Обзор

Эта конфигурация ESLint разработана специально для NestJS проекта с учетом того, что код будет писать ИИ. Конфигурация обеспечивает единый стиль кода и соблюдение лучших практик NestJS.

## Файлы конфигурации

### 1. `eslint.config.mjs`

Основная конфигурация ESLint с правилами для:

- TypeScript строгая типизация
- NestJS архитектурные паттерны
- Соглашения именования
- Ограничения сложности кода
- Специальные правила для разных типов файлов

### 2. `.prettierrc`

Конфигурация форматирования кода:

- Единые кавычки (single quotes)
- Точки с запятой обязательны
- Trailing commas
- 2 пробела для отступов
- Ширина строки 80 символов

### 3. `.eslint-rules.md`

Подробное руководство по стилю кода с примерами для каждого типа файла.

## Ключевые правила для ИИ

### 1. Архитектурные ограничения

```javascript
// Контроллеры - максимально простые (до 30 строк на метод)
'max-lines-per-function': ['warn', { max: 30 }] // для *.controller.ts

// Сервисы - более сложная логика допустима (до 60 строк на метод)
'max-lines-per-function': ['warn', { max: 60 }] // для *.service.ts

// Модули - только конфигурация (до 100 строк на файл)
'max-lines': ['warn', { max: 100 }] // для *.module.ts
```

### 2. Строгие правила именования

```javascript
'@typescript-eslint/naming-convention': [
  'error',
  // Классы должны заканчиваться на Controller, Service, Module и т.д.
  {
    selector: 'class',
    format: ['PascalCase'],
    custom: {
      regex: '^[A-Z][a-zA-Z0-9]*(Controller|Service|Module|Guard|Interceptor|Filter|Pipe|Strategy|Provider|Gateway|Processor|Job|Exception|Interface|Entity|Dto)$',
      match: true,
    },
  },
  // ... другие правила
]
```

### 3. Безопасность типов

```javascript
// Ошибки при небезопасных операциях с типами
'@typescript-eslint/no-unsafe-argument': 'warn',
'@typescript-eslint/no-unsafe-assignment': 'warn',
'@typescript-eslint/no-unsafe-call': 'warn',

// Обязательная обработка Promise
'@typescript-eslint/no-floating-promises': 'error',

// Использование современного синтаксиса
'@typescript-eslint/prefer-nullish-coalescing': 'error',
'@typescript-eslint/prefer-optional-chain': 'error',
```

### 4. Качество кода

```javascript
// Ограничения сложности
'complexity': ['warn', 10],
'max-depth': ['warn', 4],
'max-params': ['warn', 4],

// Запрет отладочного кода
'no-console': 'warn',
'no-debugger': 'error',
```

## Автоматизация в VS Code

### Настройки (`.vscode/settings.json`)

- Автоформатирование при сохранении
- Автоисправление ESLint ошибок
- Автоорганизация импортов
- Настройки TypeScript

### Рекомендованные расширения (`.vscode/extensions.json`)

- ESLint и Prettier
- TypeScript расширения
- Prisma поддержка
- REST клиенты для тестирования API

## Команды

```bash
# Проверка кода
npm run lint

# Автоисправление
npm run lint:fix

# Форматирование всех файлов
npm run format

# Проверка типов TypeScript
npm run type-check
```

## Интеграция в package.json

Добавьте эти скрипты в `package.json`:

```json
{
  "scripts": {
    "lint": "eslint 'src/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' --fix",
    "format": "prettier --write 'src/**/*.ts'",
    "format:check": "prettier --check 'src/**/*.ts'",
    "type-check": "tsc --noEmit"
  }
}
```

## Преимущества для ИИ разработки

1. **Единообразие**: Все файлы следуют одному стилю
2. **Предсказуемость**: Четкие правила именования и структуры
3. **Безопасность**: Строгая типизация и обработка ошибок
4. **Простота**: Ограничения сложности предотвращают переусложнение
5. **Документированность**: Swagger аннотации обязательны
6. **Тестируемость**: Структура способствует написанию тестов

## Особенности для разных типов файлов

- **Controllers**: Минимальная логика, только маршрутизация
- **Services**: Бизнес-логика, работа с данными
- **DTOs**: Строгая типизация, валидация
- **Modules**: Только конфигурация зависимостей
- **Tests**: Ослабленные правила для гибкости

Эта конфигурация помогает ИИ создавать качественный, поддерживаемый код в едином стиле, соответствующем лучшим практикам NestJS.
