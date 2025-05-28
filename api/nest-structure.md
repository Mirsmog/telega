# Структура NestJS проекта для API сервиса

## Обзор архитектуры

Проект представляет собой чистый REST API сервис на NestJS с модульной архитектурой и четким разделением ответственности. База данных управляется через Prisma ORM.

## Структура проекта

```
src/
├── main.ts                          # Точка входа приложения
├── app.module.ts                    # Главный модуль приложения
├── config/                          # Конфигурация
│   ├── config.module.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── redis.config.ts
├── common/                          # Общие компоненты
│   ├── decorators/                  # Кастомные декораторы
│   │   ├── roles.decorator.ts
│   │   └── user.decorator.ts
│   ├── dto/                        # Базовые DTO
│   │   ├── pagination.dto.ts
│   │   └── response.dto.ts
│   ├── entities/                   # Базовые сущности
│   │   └── base.entity.ts
│   ├── enums/                      # Перечисления
│   │   ├── user-role.enum.ts
│   │   ├── order-status.enum.ts
│   │   ├── car-type.enum.ts
│   │   └── order-type.enum.ts
│   ├── exceptions/                 # Кастомные исключения
│   │   └── business.exception.ts
│   ├── filters/                    # Глобальные фильтры
│   │   └── http-exception.filter.ts
│   ├── guards/                     # Охранники
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/              # Перехватчики
│   │   ├── logging.interceptor.ts
│   │   └── response.interceptor.ts
│   ├── middlewares/               # Промежуточное ПО
│   │   └── cors.middleware.ts
│   ├── pipes/                     # Пайпы валидации
│   │   └── validation.pipe.ts
│   └── utils/                     # Утилиты
│       ├── hash.util.ts
│       ├── date.util.ts
│       └── string.util.ts
├── prisma/                        # Prisma конфигурация и сервис
│   ├── prisma.module.ts           # Модуль для PrismaService
│   ├── prisma.service.ts          # Основной сервис для работы с БД
│   ├── schema.prisma              # Схема базы данных
│   ├── migrations/                # Миграции
│   └── seed.ts                   # Начальные данные
├── modules/                       # Бизнес модули
│   ├── auth/                      # Модуль аутентификации
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   ├── guards/
│   │   │   ├── local-auth.guard.ts
│   │   │   └── jwt-auth.guard.ts
│   │   └── strategies/
│   │       ├── local.strategy.ts
│   │       └── jwt.strategy.ts
│   ├── users/                     # Модуль пользователей
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-profile.dto.ts
│   │   └── interfaces/
│   │       └── user.interface.ts
│   ├── customers/                 # Модуль заказчиков
│   │   ├── customers.module.ts
│   │   ├── customers.controller.ts
│   │   ├── customers.service.ts
│   │   ├── dto/
│   │   │   ├── create-customer.dto.ts
│   │   │   ├── update-customer.dto.ts
│   │   │   └── customer-balance.dto.ts
│   │   └── interfaces/
│   │       └── customer.interface.ts
│   ├── performers/                # Модуль исполнителей
│   │   ├── performers.module.ts
│   │   ├── performers.controller.ts
│   │   ├── performers.service.ts
│   │   ├── dto/
│   │   │   ├── create-performer.dto.ts
│   │   │   ├── update-performer.dto.ts
│   │   │   ├── performer-tariff.dto.ts
│   │   │   └── performer-regions.dto.ts
│   │   └── interfaces/
│   │       └── performer.interface.ts
│   ├── orders/                    # Модуль заказов
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── dto/
│   │   │   ├── create-order.dto.ts
│   │   │   ├── update-order.dto.ts
│   │   │   ├── assign-order.dto.ts
│   │   │   └── order-filter.dto.ts
│   │   ├── interfaces/
│   │   │   └── order.interface.ts
│   │   └── jobs/                  # Фоновые задачи для заказов
│   │       ├── order-notification.job.ts
│   │       └── order-timeout.job.ts
│   ├── cars/                      # Модуль автомобилей
│   │   ├── cars.module.ts
│   │   ├── cars.controller.ts
│   │   ├── cars.service.ts
│   │   ├── dto/
│   │   │   ├── create-car.dto.ts
│   │   │   └── update-car.dto.ts
│   │   └── interfaces/
│   │       └── car.interface.ts
│   ├── regions/                   # Модуль регионов
│   │   ├── regions.module.ts
│   │   ├── regions.controller.ts
│   │   ├── regions.service.ts
│   │   ├── dto/
│   │   │   ├── create-region.dto.ts
│   │   │   └── update-region.dto.ts
│   │   └── interfaces/
│   │       └── region.interface.ts
│   ├── payments/                  # Модуль платежей
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── dto/
│   │   │   ├── create-payment.dto.ts
│   │   │   ├── payment-webhook.dto.ts
│   │   │   └── refund-payment.dto.ts
│   │   └── interfaces/
│   │       └── payment.interface.ts
│   ├── reports/                   # Модуль отчетов
│   │   ├── reports.module.ts
│   │   ├── reports.controller.ts
│   │   ├── reports.service.ts
│   │   ├── dto/
│   │   │   ├── create-report.dto.ts
│   │   │   └── report-filter.dto.ts
│   │   └── interfaces/
│   │       └── report.interface.ts
│   ├── notifications/             # Модуль уведомлений
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── dto/
│   │   │   ├── send-notification.dto.ts
│   │   │   └── push-notification.dto.ts
│   │   └── providers/
│   │       ├── email.provider.ts
│   │       └── push.provider.ts
│   ├── file-upload/               # Модуль загрузки файлов
│   │   ├── file-upload.module.ts
│   │   ├── file-upload.controller.ts
│   │   ├── file-upload.service.ts
│   │   ├── dto/
│   │   │   └── upload-file.dto.ts
│   │   └── interfaces/
│   │       └── file.interface.ts
│   └── admin/                     # Модуль администрирования
│       ├── admin.module.ts
│       ├── admin.controller.ts
│       ├── admin.service.ts
│       ├── dto/
│       │   ├── admin-stats.dto.ts
│       │   ├── user-management.dto.ts
│       │   └── system-settings.dto.ts
│       └── interfaces/
│           └── admin.interface.ts
├── external-services/             # Внешние сервисы
│   ├── external-services.module.ts
│   ├── payment-providers/         # Платежные системы
│   │   ├── payment-providers.module.ts
│   │   ├── tinkoff/
│   │   │   ├── tinkoff.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── tinkoff-payment.dto.ts
│   │   │   │   └── tinkoff-webhook.dto.ts
│   │   │   └── interfaces/
│   │   │       └── tinkoff.interface.ts
│   │   └── interfaces/
│   │       └── payment-provider.interface.ts
│   ├── maps/                      # Картографические сервисы
│   │   ├── maps.module.ts
│   │   ├── maps.service.ts
│   │   ├── dto/
│   │   │   ├── geocode.dto.ts
│   │   │   └── route.dto.ts
│   │   └── interfaces/
│   │       └── maps.interface.ts
│   └── sms/                       # SMS сервисы
│       ├── sms.module.ts
│       ├── sms.service.ts
│       ├── dto/
│       │   └── send-sms.dto.ts
│       └── interfaces/
│           └── sms.interface.ts
├── jobs/                          # Фоновые задачи
│   ├── jobs.module.ts
│   ├── processors/
│   │   ├── notification.processor.ts
│   │   ├── order-timeout.processor.ts
│   │   ├── payment.processor.ts
│   │   └── report.processor.ts
│   └── queues/
│       ├── notification.queue.ts
│       ├── order.queue.ts
│       ├── payment.queue.ts
│       └── report.queue.ts
├── websockets/                    # WebSocket модуль (для real-time обновлений)
│   ├── websockets.module.ts
│   ├── websockets.gateway.ts
│   ├── dto/
│   │   ├── websocket-message.dto.ts
│   │   └── room-join.dto.ts
│   └── interfaces/
│       └── websocket.interface.ts
├── health/                        # Health checks
│   ├── health.module.ts
│   ├── health.controller.ts
│   └── indicators/
│       ├── database.indicator.ts
│       └── redis.indicator.ts
├── swagger/                       # API документация
│   ├── swagger.config.ts
│   └── decorators/
│       ├── api-response.decorator.ts
│       └── api-pagination.decorator.ts
```

## Рекомендуемые пакеты для package.json

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "@nestjs/bull": "^11.0.0",
    "@nestjs/websockets": "^11.0.0",
    "@nestjs/platform-socket.io": "^11.0.0",
    "@nestjs/terminus": "^11.0.0",
    "@nestjs/axios": "^4.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@nestjs/cache-manager": "^2.0.0",
    "@nestjs/schedule": "^4.0.0",

    // База данных - Prisma
    "@prisma/client": "^6.0.0",
    "prisma": "^6.0.0",
    "pg": "^8.11.0",
    "@types/pg": "^8.10.0",

    // Redis и очереди
    "bull": "^4.16.0",
    "ioredis": "^5.6.0",
    "cache-manager-redis-store": "^3.0.0",

    // Аутентификация
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.0",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.0",
    "@types/bcrypt": "^5.0.0",

    // Валидация
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",

    // Утилиты
    "axios": "^1.6.0",
    "moment": "^2.29.0",
    "uuid": "^9.0.0",
    "@types/uuid": "^9.0.0",
    "multer": "^1.4.0",
    "@types/multer": "^1.4.0",

    // WebSockets
    "socket.io": "^4.7.0",
    "@types/socket.io": "^3.0.0",

    // Другие
    "rxjs": "^7.8.0",
    "reflect-metadata": "^0.2.0",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@types/express": "^4.17.0",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.1.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0"
  }
}
```

## Особенности архитектуры

### 1. Модульность

- Каждый модуль инкапсулирует свою логику
- Четкое разделение между контроллерами, сервисами и репозиториями
- Легкое тестирование и поддержка

### 2. Чистый API

- REST API для всех клиентских приложений
- WebSocket для real-time уведомлений
- Готовность к работе с любыми клиентами (веб, мобильные приложения, боты)

### 3. Безопасность

- JWT аутентификация
- Защита от CSRF, XSS
- Rate limiting
- Валидация данных на всех уровнях

### 4. Производительность

- Кэширование с Redis
- Фоновые задачи с Bull
- Пагинация
- Оптимизация запросов к БД через Prisma

### 5. Мониторинг

- Health checks
- Логирование
- Метрики производительности
- Error tracking

## База данных PostgreSQL с Prisma

### Основные таблицы:

- `users` - базовая информация о пользователях
- `customers` - данные заказчиков
- `performers` - данные исполнителей
- `orders` - заказы
- `cars` - автомобили исполнителей
- `regions` - регионы работы
- `payments` - платежи
- `reports` - отчеты и жалобы
- `notifications` - уведомления

### Работа с Prisma:

**Схема БД** описывается в `prisma/schema.prisma`:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  role      UserRole @default(CUSTOMER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  customer  Customer?
  performer Performer?
}

model Customer {
  id     Int  @id @default(autoincrement())
  userId Int  @unique
  user   User @relation(fields: [userId], references: [id])

  balance Decimal @default(0)
  orders  Order[]
}
```

**PrismaService** - основной сервис для работы с БД:

```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

**Использование в бизнес-сервисах** (без репозиториев):

```typescript
// modules/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: { customer: true, performer: true },
    });
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
      include: { customer: true },
    });
  }
}
```

### Преимущества подхода с Prisma:

1. **Нет репозиториев** - Prisma Client уже предоставляет все CRUD методы
2. **Типобезопасность** - автогенерация TypeScript типов
3. **Простота** - меньше кода, меньше абстракций
4. **Мощные запросы** - продвинутые include, select, where условия
5. **Автомиграции** - простое управление схемой

### Миграции:

Используйте Prisma CLI для управления миграциями:

```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

## API Endpoints

### Основные группы:

- `/api/auth/*` - аутентификация
- `/api/users/*` - управление пользователями
- `/api/customers/*` - функции заказчика
- `/api/performers/*` - функции исполнителя
- `/api/orders/*` - управление заказами
- `/api/cars/*` - управление автомобилями
- `/api/regions/*` - управление регионами
- `/api/payments/*` - платежи
- `/api/reports/*` - отчеты
- `/api/admin/*` - администрирование
- `/webhook/*` - webhooks для внешних сервисов

## WebSocket Events

### Для real-time обновлений:

- `order.created` - новый заказ
- `order.updated` - обновление заказа
- `order.assigned` - заказ принят
- `order.completed` - заказ выполнен
- `performer.location` - обновление местоположения
- `notification.new` - новое уведомление

## Deployment

### Docker Compose:

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: taxi_app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Переменные окружения

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taxi_app

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Payment providers
TINKOFF_TERMINAL_KEY=your-terminal-key
TINKOFF_SECRET_KEY=your-secret-key

# External services
MAPS_API_KEY=your-maps-api-key
SMS_API_KEY=your-sms-api-key

# App
PORT=3000
NODE_ENV=production
```

Эта структура обеспечивает чистый, масштабируемый API сервис с использованием Prisma ORM, готовый к работе с любыми клиентскими приложениями.
