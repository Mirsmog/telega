# Структура NestJS проекта

```
telega-api/
├── src/
│   ├── main.ts                     # Точка входа приложения
│   ├── app.module.ts               # Корневой модуль
│   │
│   ├── config/                     # Конфигурация
│   │   ├── database.config.ts      # Настройки PostgreSQL
│   │   ├── jwt.config.ts           # JWT конфигурация
│   │   ├── redis.config.ts         # Redis настройки
│   │   ├── tinkoff.config.ts       # Tinkoff API настройки
│   │   └── rabbitmq.config.ts      # RabbitMQ конфигурация
│   │
│   ├── common/                     # Общие компоненты
│   │   ├── decorators/
│   │   │   ├── user.decorator.ts   # @User() декоратор
│   │   │   ├── roles.decorator.ts  # @Roles() декоратор
│   │   │   └── admin.decorator.ts  # @Admin() декоратор
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts   # JWT аутентификация
│   │   │   ├── roles.guard.ts      # Проверка ролей
│   │   │   └── admin.guard.ts      # Админский доступ
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts
│   │   └── enums/
│   │       ├── order-status.enum.ts
│   │       └── admin-actions.enum.ts
│   │
│   ├── database/                   # База данных
│   │   ├── prisma.module.ts        # Prisma модуль
│   │   └── prisma.service.ts       # Prisma сервис
│   │
│   ├── auth/                       # Аутентификация
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts         # Логика аутентификации
│   │   ├── auth.controller.ts      # 4 endpoint'а
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts     # JWT стратегия
│   │   │   └── telegram.strategy.ts # Telegram стратегия
│   │   └── dto/
│   │       ├── telegram-auth.dto.ts
│   │       ├── refresh-token.dto.ts
│   │       └── auth-response.dto.ts
│   │
│   ├── users/                      # Пользователи
│   │   ├── users.module.ts
│   │   ├── users.service.ts        # CRUD пользователей
│   │   ├── users.controller.ts     # 8 endpoint'ов
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       ├── add-role.dto.ts
│   │       └── create-vehicle.dto.ts
│   │
│   ├── orders/                     # Заказы
│   │   ├── orders.module.ts
│   │   ├── orders.service.ts       # CRUD заказов
│   │   ├── orders.controller.ts    # 8 endpoint'ов
│   │   ├── order-matching.service.ts # Поиск исполнителей
│   │   └── dto/
│   │       ├── create-order.dto.ts
│   │       ├── update-order.dto.ts
│   │       ├── order-response.dto.ts
│   │       └── order-filter.dto.ts
│   │
│   ├── payments/                   # Платежи
│   │   ├── payments.module.ts
│   │   ├── payments.service.ts     # Логика платежей
│   │   ├── payments.controller.ts  # 6 endpoint'ов
│   │   ├── tinkoff/
│   │   │   ├── tinkoff.service.ts  # Tinkoff API клиент
│   │   │   └── tinkoff.types.ts    # Типы Tinkoff
│   │   └── dto/
│   │       ├── create-payment.dto.ts
│   │       ├── payment-webhook.dto.ts
│   │       └── add-balance.dto.ts
│   │
│   ├── regions/                    # Регионы
│   │   ├── regions.module.ts
│   │   ├── regions.service.ts      # Работа с регионами
│   │   ├── regions.controller.ts   # 3 endpoint'а
│   │   └── dto/
│   │       └── region-filter.dto.ts
│   │
│   ├── vehicles/                   # Транспорт
│   │   ├── vehicles.module.ts
│   │   ├── vehicles.service.ts     # Каталог транспорта
│   │   ├── vehicles.controller.ts  # 4 endpoint'а
│   │   └── dto/
│   │       └── vehicle-filter.dto.ts
│   │
│   ├── notifications/              # Уведомления
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts # Redis очереди
│   │   ├── notifications.controller.ts # 2 endpoint'а
│   │   ├── processors/
│   │   │   ├── telegram.processor.ts
│   │   │   └── email.processor.ts
│   │   └── dto/
│   │       └── notification.dto.ts
│   │
│   ├── sessions/                   # Сессии
│   │   ├── sessions.module.ts
│   │   ├── sessions.service.ts     # Redis сессии
│   │   ├── sessions.controller.ts  # 4 endpoint'а
│   │   └── dto/
│   │       ├── session-data.dto.ts
│   │       └── update-session.dto.ts
│   │
│   ├── utils/                      # Утилиты
│   │   ├── utils.module.ts
│   │   ├── utils.controller.ts     # 3 endpoint'а
│   │   └── upload/
│   │       └── upload.service.ts   # Загрузка файлов
│   │
│   ├── admin/                      # Админская панель
│   │   ├── admin.module.ts
│   │   ├── controllers/
│   │   │   ├── admin-orders.controller.ts    # 6 endpoint'ов
│   │   │   ├── admin-users.controller.ts     # 6 endpoint'ов
│   │   │   ├── admin-config.controller.ts    # 4 endpoint'а
│   │   │   ├── admin-vehicles.controller.ts  # 4 endpoint'а
│   │   │   ├── admin-broadcast.controller.ts # 3 endpoint'а
│   │   │   └── admin-analytics.controller.ts # 2 endpoint'а
│   │   ├── services/
│   │   │   ├── admin-orders.service.ts       # Модерация заказов
│   │   │   ├── admin-users.service.ts        # Управление пользователями
│   │   │   ├── admin-config.service.ts       # Настройки системы
│   │   │   ├── admin-vehicles.service.ts     # Каталог транспорта
│   │   │   ├── admin-broadcast.service.ts    # Рассылки
│   │   │   └── admin-analytics.service.ts    # Аналитика
│   │   └── dto/
│   │       ├── approve-order.dto.ts
│   │       ├── reject-order.dto.ts
│   │       ├── block-user.dto.ts
│   │       ├── update-balance.dto.ts
│   │       ├── broadcast-message.dto.ts
│   │       ├── update-config.dto.ts
│   │       └── vehicle-category.dto.ts
│   │
│   └── queues/                     # Очереди RabbitMQ
│       ├── queues.module.ts
│       ├── services/
│       │   ├── rabbitmq.service.ts         # Подключение к RabbitMQ
│       │   └── queue-consumer.service.ts   # Обработчик сообщений
│       ├── processors/
│       │   ├── admin-commands.processor.ts # Команды от админки
│       │   └── broadcast.processor.ts      # Обработка рассылок
│       └── dto/
│           └── queue-message.dto.ts
│
├── uploads/                        # Загруженные файлы
│   └── broadcasts/                 # Изображения для рассылок
│
├── prisma/                         # Prisma ORM
│   ├── schema.prisma               # Схема базы данных
│   ├── seed.ts                     # Начальные данные
│   └── migrations/                 # Миграции
│
├── test/                           # Тесты
│   ├── unit/                       # Unit тесты
│   ├── integration/                # Integration тесты
│   └── e2e/                        # E2E тесты
│
├── docker-compose.yml              # Docker окружение
├── Dockerfile                      # Docker образ API
├── .env.example                    # Пример переменных окружения
├── package.json                    # Зависимости
├── tsconfig.json                   # TypeScript конфигурация
├── nest-cli.json                   # NestJS CLI конфигурация
└── README.md                       # Документация проекта
```

## Ключевые файлы для разработчика

### 1. main.ts - Точка входа
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Валидация
  app.useGlobalPipes(new ValidationPipe());
  
  // CORS
  app.enableCors();
  
  // Swagger документация
  const config = new DocumentBuilder()
    .setTitle('Telega Logistics API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(3000);
}
bootstrap();
```

### 2. app.module.ts - Корневой модуль
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
    QueuesModule,
  ],
})
export class AppModule {}
```

### 3. Важные особенности структуры

#### Admin модуль отделен
- Все админские контроллеры в отдельной папке
- Специальные guards для админского доступа
- 25 endpoint'ов для полного управления системой

#### Queues модуль для RabbitMQ
- Обработка внешних команд
- Интеграция с существующими очередями
- Логирование всех сообщений

#### Database модуль
- Единый Prisma сервис для всех модулей
- Централизованное управление подключением

#### Common папка
- Переиспользуемые декораторы, guards, фильтры
- Единые enum'ы для всего проекта