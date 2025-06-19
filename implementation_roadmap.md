# Детальный план реализации NestJS API

## 🎯 Цель: Backend API для Telega Logistics

### Основные требования:
- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT для Telegram
- **Payments**: Tinkoff API интеграция
- **Notifications**: Queue-based система

## 📦 Необходимые пакеты

### Core NestJS пакеты
```bash
# Основа NestJS
@nestjs/core
@nestjs/common
@nestjs/platform-express

# Configuration
@nestjs/config

# Database & ORM
@prisma/client
prisma

# Authentication & Security
@nestjs/jwt
@nestjs/passport
passport
passport-jwt
bcrypt
@types/bcrypt

# Validation
class-validator
class-transformer

# Redis & Queues
@nestjs/bull
bull
redis
ioredis

# HTTP клиент
@nestjs/axios
axios

# Utilities
uuid
@types/uuid
crypto

# Swagger документация
@nestjs/swagger
swagger-ui-express

# Rate limiting
@nestjs/throttler

# Logging
@nestjs/common (встроенный Logger)

# Testing
@nestjs/testing
jest
supertest
@types/jest
@types/supertest
```

### Дополнительные пакеты
```bash
# Environment variables
dotenv

# CORS
@nestjs/common (встроенный)

# Health checks
@nestjs/terminus

# Validation pipes
@nestjs/common (встроенный)

# Decimal numbers
decimal.js

# Date utilities
date-fns
```

## 🏗️ Структура проекта

```
telega-api/
├── src/
│   ├── main.ts                     # Entry point
│   ├── app.module.ts               # Root module
│   ├── app.controller.ts           # Health check
│   ├── app.service.ts              # App utilities
│   │
│   ├── config/                     # Configuration
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── tinkoff.config.ts
│   │
│   ├── common/                     # Shared utilities
│   │   ├── decorators/
│   │   │   ├── user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts
│   │   └── utils/
│   │       ├── crypto.util.ts
│   │       └── pagination.util.ts
│   │
│   ├── database/                   # Prisma configuration
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── migrations/
│   │
│   ├── auth/                       # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── dto/
│   │       ├── telegram-auth.dto.ts
│   │       └── refresh-token.dto.ts
│   │
│   ├── users/                      # Users module
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── add-role.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   │
│   ├── orders/                     # Orders module
│   │   ├── orders.module.ts
│   │   ├── orders.service.ts
│   │   ├── orders.controller.ts
│   │   ├── order-matching.service.ts
│   │   ├── dto/
│   │   │   ├── create-order.dto.ts
│   │   │   ├── update-order.dto.ts
│   │   │   └── order-filter.dto.ts
│   │   └── entities/
│   │       └── order.entity.ts
│   │
│   ├── payments/                   # Payments module
│   │   ├── payments.module.ts
│   │   ├── payments.service.ts
│   │   ├── payments.controller.ts
│   │   ├── tinkoff/
│   │   │   └── tinkoff.service.ts
│   │   ├── dto/
│   │   │   ├── init-payment.dto.ts
│   │   │   └── webhook.dto.ts
│   │   └── entities/
│   │       └── transaction.entity.ts
│   │
│   ├── regions/                    # Regions module
│   │   ├── regions.module.ts
│   │   ├── regions.service.ts
│   │   ├── regions.controller.ts
│   │   ├── dto/
│   │   │   └── update-regions.dto.ts
│   │   └── entities/
│   │       └── region.entity.ts
│   │
│   ├── vehicles/                   # Vehicles module
│   │   ├── vehicles.module.ts
│   │   ├── vehicles.service.ts
│   │   ├── vehicles.controller.ts
│   │   ├── dto/
│   │   │   ├── create-vehicle.dto.ts
│   │   │   └── update-vehicle.dto.ts
│   │   └── entities/
│   │       └── vehicle.entity.ts
│   │
│   ├── notifications/              # Notifications module
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── processors/
│   │   │   └── notification.processor.ts
│   │   └── dto/
│   │       └── send-notification.dto.ts
│   │
│   └── sessions/                   # Sessions module
│       ├── sessions.module.ts
│       ├── sessions.service.ts
│       ├── sessions.controller.ts
│       └── dto/
│           ├── set-state.dto.ts
│           └── get-state.dto.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── test/                           # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

## 🚀 План реализации по этапам

### Этап 1: Настройка проекта (1-2 дня)

#### 1.1 Инициализация NestJS проекта
```bash
# Создание проекта
npm i -g @nestjs/cli
nest new telega-api

# Переход в папку
cd telega-api

# Установка основных зависимостей
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @prisma/client prisma class-validator class-transformer
npm install @nestjs/bull bull redis ioredis @nestjs/axios axios
npm install uuid @types/uuid bcrypt @types/bcrypt
npm install @nestjs/swagger swagger-ui-express @nestjs/throttler

# Dev зависимости
npm install -D @types/passport-jwt @types/bcrypt @types/uuid
```

#### 1.2 Настройка базовой конфигурации
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS
  app.enableCors();
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // API prefix
  app.setGlobalPrefix('api/v1');
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Telega Logistics API')
    .setDescription('Backend API for Telega Logistics platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(3000);
}
bootstrap();
```

#### 1.3 Docker окружение
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: telega_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Этап 2: Database & Prisma (1-2 дня)

#### 2.1 Настройка Prisma
```bash
# Инициализация Prisma
npx prisma init

# Генерация схемы из файла (уже готова из Creative Phase)
npx prisma generate

# Создание и применение миграций
npx prisma migrate dev --name init

# Seed данные
npx prisma db seed
```

#### 2.2 Prisma Service
```typescript
// src/database/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// src/database/prisma.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Этап 3: Authentication Module (2-3 дня)

#### 3.1 JWT Strategy
```typescript
// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, userId: payload.userId };
  }
}
```

#### 3.2 Auth Service
```typescript
// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async authenticateTelegramUser(telegramAuthDto: TelegramAuthDto) {
    // Логика аутентификации Telegram пользователя
    // Создание или поиск пользователя
    // Генерация JWT токенов
  }

  async generateTokens(userId: number, telegramUserId: bigint) {
    const payload = { sub: userId, userId: telegramUserId };
    
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
```

#### 3.3 Auth Endpoints
```typescript
// Endpoints для Auth модуля:
POST /api/v1/auth/telegram-bot      # Аутентификация через Telegram Bot
POST /api/v1/auth/telegram-webapp   # Аутентификация через Telegram Mini App
POST /api/v1/auth/refresh           # Обновление токенов
POST /api/v1/auth/logout            # Выход (очистка токенов)
```

### Этап 4: Users Module (2-3 дня)

#### 4.1 Users Service
```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByTelegramId(userId: bigint) {
    return this.prisma.user.findUnique({
      where: { userId },
      include: {
        roles: true,
        userRegions: { include: { region: true } },
        vehicles: { where: { isActive: true } },
      },
    });
  }

  async updateProfile(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async addRole(userId: number, role: 'CUSTOMER' | 'PERFORMER') {
    return this.prisma.userRole.create({
      data: { userId, role },
    });
  }

  async getBalance(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { customerBalance: true, performerBalance: true },
    });
    
    return {
      customerBalance: user.customerBalance,
      performerBalance: user.performerBalance,
      currency: 'RUB',
    };
  }
}
```

#### 4.2 Users Endpoints
```typescript
// Endpoints для Users модуля:
GET    /api/v1/users/me             # Профиль текущего пользователя
PUT    /api/v1/users/me             # Обновление профиля
POST   /api/v1/users/roles          # Добавление роли
GET    /api/v1/users/balance        # Баланс пользователя
GET    /api/v1/users/referrals      # Реферальная информация
PUT    /api/v1/users/regions        # Обновление активных регионов
```

### Этап 5: Orders Module (3-4 дня)

#### 5.1 Orders Service + Matching
```typescript
// src/orders/orders.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrderMatchingService } from './order-matching.service';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private orderMatching: OrderMatchingService,
  ) {}

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        ...createOrderDto,
        customerId: userId,
        orderNumber: await this.generateOrderNumber(),
        status: 'CREATED',
      },
    });

    // Асинхронно запускаем поиск исполнителей
    this.orderMatching.processNewOrder(order).catch(console.error);

    return order;
  }

  async getAvailableOrders(userId: number, filters: any) {
    // Получение доступных заказов для исполнителя
    // с учетом его регионов и типов транспорта
  }

  async takeOrder(orderId: number, performerId: number, vehicleId: number) {
    // Взятие заказа исполнителем
  }

  async updateOrderStatus(orderId: number, status: string, userId: number) {
    // Обновление статуса заказа
  }
}
```

#### 5.2 Orders Endpoints
```typescript
// Endpoints для Orders модуля:
POST   /api/v1/orders               # Создание заказа
GET    /api/v1/orders               # Список заказов с фильтрами
GET    /api/v1/orders/:id           # Детали заказа
POST   /api/v1/orders/:id/take      # Взятие заказа исполнителем
PUT    /api/v1/orders/:id/status    # Обновление статуса
POST   /api/v1/orders/:id/cancel    # Отмена заказа
GET    /api/v1/orders/available     # Доступные заказы для исполнителя
GET    /api/v1/orders/my            # Мои заказы (как заказчик и исполнитель)
```

### Этап 6: Payments Module (2-3 дня)

#### 6.1 Payment Service
```typescript
// src/payments/payments.service.ts (из Creative Phase)
// Уже спроектирован - реализуем по готовому дизайну
```

#### 6.2 Payments Endpoints
```typescript
// Endpoints для Payments модуля:
POST   /api/v1/payments/init        # Инициация платежа
POST   /api/v1/payments/webhook     # Webhook от Tinkoff
GET    /api/v1/payments/history     # История платежей
GET    /api/v1/payments/:id         # Информация о платеже
```

### Этап 7: Regions & Vehicles Modules (1-2 дня)

#### 7.1 Regions Endpoints
```typescript
GET    /api/v1/regions              # Список всех регионов
GET    /api/v1/regions/:code        # Информация о регионе
```

#### 7.2 Vehicles Endpoints
```typescript
POST   /api/v1/vehicles             # Добавление транспорта
GET    /api/v1/vehicles             # Список транспорта пользователя
PUT    /api/v1/vehicles/:id         # Обновление транспорта
DELETE /api/v1/vehicles/:id         # Удаление транспорта
GET    /api/v1/vehicles/categories  # Справочник категорий
```

### Этап 8: Notifications & Sessions (2-3 дня)

#### 8.1 Notifications Service
```typescript
// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async sendOrderNotification(telegramUserId: bigint, orderData: any) {
    await this.notificationQueue.add('order-available', {
      telegramUserId,
      orderData,
    });
  }
}
```

#### 8.2 Sessions Service (из Creative Phase)
```typescript
// src/sessions/sessions.service.ts (уже спроектирован)
```

#### 8.3 Sessions Endpoints
```typescript
GET    /api/v1/sessions/state       # Получение состояния пользователя
PUT    /api/v1/sessions/state       # Обновление состояния
DELETE /api/v1/sessions/state       # Очистка состояния
```

### Этап 9: Utility Endpoints (1 день)

```typescript
GET    /api/v1/health               # Health check
GET    /api/v1/version              # Версия API
GET    /api/v1/admin/stats          # Статистика (для админов)
```

## 📊 Полный список API endpoints (25 основных)

### Authentication (4)
- `POST /auth/telegram-bot`
- `POST /auth/telegram-webapp`
- `POST /auth/refresh`
- `POST /auth/logout`

### Users (6)
- `GET /users/me`
- `PUT /users/me`
- `POST /users/roles`
- `GET /users/balance`
- `GET /users/referrals`
- `PUT /users/regions`

### Orders (8)
- `POST /orders`
- `GET /orders`
- `GET /orders/:id`
- `POST /orders/:id/take`
- `PUT /orders/:id/status`
- `POST /orders/:id/cancel`
- `GET /orders/available`
- `GET /orders/my`

### Payments (4)
- `POST /payments/init`
- `POST /payments/webhook`
- `GET /payments/history`
- `GET /payments/:id`

### Vehicles (5)
- `POST /vehicles`
- `GET /vehicles`
- `PUT /vehicles/:id`
- `DELETE /vehicles/:id`
- `GET /vehicles/categories`

### Regions (2)
- `GET /regions`
- `GET /regions/:code`

### Sessions (3)
- `GET /sessions/state`
- `PUT /sessions/state`
- `DELETE /sessions/state`

### Utilities (3)
- `GET /health`
- `GET /version`
- `GET /admin/stats`

## ⏱️ Временная оценка

- **Этап 1**: Настройка проекта - 2 дня
- **Этап 2**: Database & Prisma - 2 дня
- **Этап 3**: Authentication - 3 дня
- **Этап 4**: Users Module - 3 дня
- **Этап 5**: Orders Module - 4 дня
- **Этап 6**: Payments Module - 3 дня
- **Этап 7**: Regions & Vehicles - 2 дня
- **Этап 8**: Notifications & Sessions - 3 дня
- **Этап 9**: Utilities - 1 день

**Общее время: 23 рабочих дня (1 месяц)**

## 🧪 Тестирование

### Unit тесты (параллельно с разработкой)
- Каждый сервис покрыт unit тестами
- Моки для внешних зависимостей (Prisma, Redis)
- Coverage минимум 80%

### Integration тесты
- Тестирование API endpoints
- Тестирование интеграций (Tinkoff, Redis)
- E2E тесты основных сценариев

### Инструменты
- Jest для unit тестов
- Supertest для HTTP тестов
- Test containers для integration тестов

## 🚀 Деплой

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/telega_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# Tinkoff
TINKOFF_TERMINAL_KEY=your-terminal-key
TINKOFF_PASSWORD=your-password

# App
PORT=3000
NODE_ENV=production
```

## ✅ Готовность к реализации

Все компоненты спроектированы и готовы к реализации:
- ✅ Структура проекта определена
- ✅ Пакеты и зависимости выбраны
- ✅ API endpoints спроектированы
- ✅ Архитектурные решения приняты (Creative Phase)
- ✅ Временные оценки сделаны

### ⏭️ Следующий этап: **IMPLEMENT MODE**
Можно начинать реализацию с Этапа 1: Настройка проекта. 