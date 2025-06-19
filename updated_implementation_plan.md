# Обновленный детальный план реализации с полным админским функционалом

## 🎯 Цель: Backend API для Telega Logistics с полной админкой

### Критические изменения после анализа:
- **Ручная модерация заказов** админом
- **Управление настройками системы** и тарифами
- **CRUD справочников транспорта**
- **Массовые рассылки** пользователям
- **RabbitMQ интеграция** для внешних команд
- **Расширенное управление пользователями**

## 📦 Обновленные пакеты

### Дополнительные пакеты для админки
```bash
# RabbitMQ для очередей
amqplib
@types/amqplib

# File upload для рассылок с изображениями
@nestjs/platform-express
multer
@types/multer

# Cron jobs для автоматических задач
@nestjs/schedule

# Дополнительные утилиты
moment
@types/moment
```

## 🏗️ Обновленная структура проекта

```
telega-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   ├── tinkoff.config.ts
│   │   └── rabbitmq.config.ts        # НОВЫЙ
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── admin.decorator.ts    # НОВЫЙ
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── admin.guard.ts        # НОВЫЙ
│   │   └── enums/
│   │       ├── order-status.enum.ts
│   │       └── admin-actions.enum.ts # НОВЫЙ
│   │
│   ├── database/
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── migrations/
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── strategies/
│   │
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── dto/
│   │
│   ├── orders/
│   │   ├── orders.module.ts
│   │   ├── orders.service.ts
│   │   ├── orders.controller.ts
│   │   ├── order-matching.service.ts
│   │   └── dto/
│   │
│   ├── payments/
│   │   ├── payments.module.ts
│   │   ├── payments.service.ts
│   │   ├── payments.controller.ts
│   │   └── tinkoff/
│   │
│   ├── regions/
│   │   ├── regions.module.ts
│   │   ├── regions.service.ts
│   │   ├── regions.controller.ts
│   │   └── dto/
│   │
│   ├── vehicles/
│   │   ├── vehicles.module.ts
│   │   ├── vehicles.service.ts
│   │   ├── vehicles.controller.ts
│   │   └── dto/
│   │
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── processors/
│   │   └── dto/
│   │
│   ├── sessions/
│   │   ├── sessions.module.ts
│   │   ├── sessions.service.ts
│   │   ├── sessions.controller.ts
│   │   └── dto/
│   │
│   ├── admin/                       # НОВЫЙ МОДУЛЬ
│   │   ├── admin.module.ts
│   │   ├── controllers/
│   │   │   ├── admin-orders.controller.ts
│   │   │   ├── admin-users.controller.ts
│   │   │   ├── admin-config.controller.ts
│   │   │   ├── admin-vehicles.controller.ts
│   │   │   ├── admin-broadcast.controller.ts
│   │   │   └── admin-analytics.controller.ts
│   │   ├── services/
│   │   │   ├── admin-orders.service.ts
│   │   │   ├── admin-users.service.ts
│   │   │   ├── admin-config.service.ts
│   │   │   ├── admin-vehicles.service.ts
│   │   │   ├── admin-broadcast.service.ts
│   │   │   └── admin-analytics.service.ts
│   │   └── dto/
│   │       ├── approve-order.dto.ts
│   │       ├── reject-order.dto.ts
│   │       ├── broadcast-message.dto.ts
│   │       ├── update-config.dto.ts
│   │       └── vehicle-category.dto.ts
│   │
│   └── queues/                      # НОВЫЙ МОДУЛЬ
│       ├── queues.module.ts
│       ├── services/
│       │   ├── rabbitmq.service.ts
│       │   └── queue-consumer.service.ts
│       ├── processors/
│       │   ├── admin-commands.processor.ts
│       │   └── broadcast.processor.ts
│       └── dto/
│           └── queue-message.dto.ts
│
├── uploads/                         # НОВАЯ ПАПКА
│   └── broadcasts/                  # Изображения для рассылок
│
├── prisma/
│   ├── schema.prisma               # ОБНОВЛЕННАЯ СХЕМА
│   ├── seed.ts
│   └── migrations/
│
├── docker-compose.yml              # ОБНОВЛЕННЫЙ (+ RabbitMQ)
├── Dockerfile
├── .env.example
└── package.json
```

## 📊 Обновленная схема базы данных

### Дополнительные таблицы для админки:

```prisma
// Добавляем роль ADMIN
enum RoleType {
  CUSTOMER
  PERFORMER
  ADMIN              // НОВАЯ РОЛЬ
}

// Обновляем статусы заказов
enum OrderStatus {
  CREATED            // Создан заказчиком
  PENDING_APPROVAL   // Ожидает модерации админа
  APPROVED           // Одобрен админом
  SEARCHING          // Ищем исполнителя
  IN_WORK           // В работе
  COMPLETED         // Завершен
  CANCELLED         // Отменен
  REJECTED          // Отклонен админом
}

// Настройки системы
model SystemConfig {
  id            Int      @id @default(autoincrement())
  key           String   @unique
  value         Json
  description   String?
  category      String   @default("general") // "tariffs", "links", "payment", etc
  updatedBy     Int?
  updatedAt     DateTime @updatedAt
  createdAt     DateTime @default(now())
  
  updater User? @relation(fields: [updatedBy], references: [id])
  
  @@map("system_config")
}

// Логи действий админа
model AdminAction {
  id         Int      @id @default(autoincrement())
  adminId    Int
  action     AdminActionType
  entityType String   // "ORDER", "USER", "CONFIG", "VEHICLE", "BROADCAST"
  entityId   String
  details    Json?
  createdAt  DateTime @default(now())
  
  admin User @relation(fields: [adminId], references: [id])
  
  @@map("admin_actions")
}

enum AdminActionType {
  APPROVE_ORDER
  REJECT_ORDER
  BLOCK_USER
  UNBLOCK_USER
  UPDATE_BALANCE
  UPDATE_CONFIG
  CREATE_BROADCAST
  UPDATE_VEHICLE_CATEGORY
  DELETE_VEHICLE_CATEGORY
}

// Массовые рассылки
model Broadcast {
  id          Int             @id @default(autoincrement())
  title       String
  message     String
  imageUrl    String?
  targetType  BroadcastTargetType @default(ALL_USERS)
  targetUsers Json?           // массив user_id или критерии
  sentCount   Int             @default(0)
  totalCount  Int             @default(0)
  status      BroadcastStatus @default(DRAFT)
  createdBy   Int
  createdAt   DateTime        @default(now())
  sentAt      DateTime?
  
  creator User @relation(fields: [createdBy], references: [id])
  
  @@map("broadcasts")
}

enum BroadcastStatus {
  DRAFT
  SENDING
  SENT
  FAILED
  CANCELLED
}

enum BroadcastTargetType {
  ALL_USERS
  CUSTOMERS_ONLY
  PERFORMERS_ONLY
  SPECIFIC_USERS
  BY_REGION
}

// Очереди сообщений (для мониторинга)
model QueueMessage {
  id          Int      @id @default(autoincrement())
  queueName   String
  messageType String
  payload     Json
  status      QueueMessageStatus @default(PENDING)
  attempts    Int      @default(0)
  maxAttempts Int      @default(3)
  error       String?
  createdAt   DateTime @default(now())
  processedAt DateTime?
  
  @@map("queue_messages")
}

enum QueueMessageStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  DEAD_LETTER
}
```

## 🚀 Обновленный план реализации по этапам

### ЭТАП 1: Базовая инфраструктура (2-3 дня)
```bash
# Создание проекта и установка пакетов
npm i -g @nestjs/cli
nest new telega-api

# Основные зависимости
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @prisma/client prisma class-validator class-transformer
npm install @nestjs/bull bull redis ioredis @nestjs/axios axios
npm install uuid @types/uuid bcrypt @types/bcrypt
npm install @nestjs/swagger swagger-ui-express @nestjs/throttler

# Админские зависимости
npm install amqplib @types/amqplib @nestjs/schedule
npm install @nestjs/platform-express multer @types/multer
npm install moment @types/moment

# Docker setup с RabbitMQ
```

### ЭТАП 2: Database & Prisma с админскими таблицами (2-3 дня)
```bash
# Обновленная схема Prisma с админскими таблицами
npx prisma generate
npx prisma migrate dev --name admin_functionality
npx prisma db seed
```

### ЭТАП 3: Authentication + Admin Guards (2-3 дня)
```typescript
// Добавляем роль ADMIN и соответствующие guards
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user.roles.some(role => role.role === 'ADMIN');
  }
}
```

### ЭТАП 4: Users Module с админским управлением (3-4 дня)
```typescript
// Расширенный UsersService с админскими функциями
class UsersService {
  async blockUser(userId: number, adminId: number) { }
  async unblockUser(userId: number, adminId: number) { }
  async updateUserBalance(userId: number, amount: number, adminId: number) { }
  async getUsersForAdmin(filters: any) { }
}
```

### ЭТАП 5: Orders Module с модерацией (4-5 дней)
```typescript
// Обновленный OrdersService с модерацией
class OrdersService {
  async createOrder() {
    // Статус: PENDING_APPROVAL (вместо SEARCHING)
  }
  
  async approveOrder(orderId: number, adminId: number) {
    // PENDING_APPROVAL → APPROVED → запуск поиска исполнителей
  }
  
  async rejectOrder(orderId: number, adminId: number, reason: string) {
    // PENDING_APPROVAL → REJECTED + уведомление заказчику
  }
  
  async getPendingOrders() {
    // Заказы для модерации
  }
}
```

### ЭТАП 6: Admin Orders Management (3-4 дня)
```typescript
// Новые админские endpoints для заказов
POST   /api/v1/admin/orders/:id/approve     # Одобрить заказ
POST   /api/v1/admin/orders/:id/reject      # Отклонить заказ
GET    /api/v1/admin/orders/pending         # Заказы на модерации
GET    /api/v1/admin/orders/history         # История модерации
PUT    /api/v1/admin/orders/:id/status      # Принудительно изменить статус
GET    /api/v1/admin/orders/analytics       # Аналитика по заказам
```

### ЭТАП 7: System Configuration Management (3-4 дня)
```typescript
// Управление настройками системы
GET    /api/v1/admin/config                 # Все настройки
PUT    /api/v1/admin/config/:key            # Обновить настройку
GET    /api/v1/admin/config/tariffs         # Тарифные планы
PUT    /api/v1/admin/config/tariffs         # Обновить тарифы
GET    /api/v1/admin/config/links           # Ссылки на клиентов
PUT    /api/v1/admin/config/links           # Обновить ссылки
GET    /api/v1/admin/config/payments        # Настройки платежей
PUT    /api/v1/admin/config/payments        # Обновить настройки платежей
```

### ЭТАП 8: Vehicle Catalog Management (3-4 дня)
```typescript
// CRUD для справочников транспорта
POST   /api/v1/admin/vehicles/categories    # Создать категорию
GET    /api/v1/admin/vehicles/categories    # Список категорий
PUT    /api/v1/admin/vehicles/categories/:id # Обновить категорию
DELETE /api/v1/admin/vehicles/categories/:id # Удалить категорию

POST   /api/v1/admin/vehicles/types         # Создать тип
GET    /api/v1/admin/vehicles/types         # Список типов
PUT    /api/v1/admin/vehicles/types/:id     # Обновить тип
DELETE /api/v1/admin/vehicles/types/:id     # Удалить тип

POST   /api/v1/admin/vehicles/subtypes      # Создать подтип
GET    /api/v1/admin/vehicles/subtypes      # Список подтипов
PUT    /api/v1/admin/vehicles/subtypes/:id  # Обновить подтип
DELETE /api/v1/admin/vehicles/subtypes/:id  # Удалить подтип
```

### ЭТАП 9: Mass Communication System (4-5 дней)
```typescript
// Система массовых рассылок
POST   /api/v1/admin/broadcast              # Создать рассылку
POST   /api/v1/admin/broadcast/:id/send     # Отправить рассылку
GET    /api/v1/admin/broadcast              # История рассылок
GET    /api/v1/admin/broadcast/:id          # Детали рассылки
DELETE /api/v1/admin/broadcast/:id          # Удалить рассылку
POST   /api/v1/admin/broadcast/upload       # Загрузить изображение
GET    /api/v1/admin/users/for-broadcast    # Пользователи для рассылки
```

### ЭТАП 10: RabbitMQ Integration (3-4 дня)
```typescript
// Интеграция с RabbitMQ для внешних команд
@Injectable()
export class RabbitMQService {
  async setupQueues() {
    // acept_tg - команды модерации
    // telegram_queue - массовые рассылки
  }
  
  async consumeAdminCommands() {
    // Обработка команд из внешних систем
  }
}

GET    /api/v1/admin/queues/status          # Статус очередей
POST   /api/v1/admin/queues/message         # Отправить сообщение в очередь
GET    /api/v1/admin/queues/history         # История сообщений
```

### ЭТАП 11: Admin User Management (2-3 дня)
```typescript
// Расширенное управление пользователями
GET    /api/v1/admin/users                  # Список пользователей с фильтрами
GET    /api/v1/admin/users/:id              # Детали пользователя
PUT    /api/v1/admin/users/:id/block        # Заблокировать пользователя
PUT    /api/v1/admin/users/:id/unblock      # Разблокировать пользователя
PUT    /api/v1/admin/users/:id/balance      # Изменить баланс
GET    /api/v1/admin/users/analytics        # Аналитика по пользователям
GET    /api/v1/admin/users/export           # Экспорт пользователей
```

### ЭТАП 12: Payments Module (3-4 дня)
```typescript
// Базовый функционал платежей (без изменений)
```

### ЭТАП 13: Regions & Basic Vehicles (2-3 дня)
```typescript
// Базовые endpoints регионов и транспорта
```

### ЭТАП 14: Notifications & Sessions (3-4 дня)
```typescript
// Система уведомлений с поддержкой админских рассылок
```

### ЭТАП 15: Admin Analytics & Reporting (3-4 дня)
```typescript
// Расширенная аналитика для админов
GET    /api/v1/admin/analytics/dashboard    # Главная панель
GET    /api/v1/admin/analytics/orders       # Аналитика заказов
GET    /api/v1/admin/analytics/users        # Аналитика пользователей
GET    /api/v1/admin/analytics/revenue      # Финансовая аналитика
GET    /api/v1/admin/analytics/performance  # Производительность системы
GET    /api/v1/admin/analytics/export       # Экспорт отчетов
```

### ЭТАП 16: Admin Action Logging (2-3 дня)
```typescript
// Логирование всех действий админов
GET    /api/v1/admin/actions                # История действий
GET    /api/v1/admin/actions/:adminId       # Действия конкретного админа
GET    /api/v1/admin/actions/export         # Экспорт логов
```

### ЭТАП 17: Testing & Documentation (3-4 дня)
```typescript
// Comprehensive testing всех админских функций
// Swagger документация для всех endpoints
// E2E тесты админских сценариев
```

## 📊 Полный список API endpoints (50+ endpoints)

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

### Admin Orders (6)
- `POST /admin/orders/:id/approve`
- `POST /admin/orders/:id/reject`
- `GET /admin/orders/pending`
- `GET /admin/orders/history`
- `PUT /admin/orders/:id/status`
- `GET /admin/orders/analytics`

### Admin Config (8)
- `GET /admin/config`
- `PUT /admin/config/:key`
- `GET /admin/config/tariffs`
- `PUT /admin/config/tariffs`
- `GET /admin/config/links`
- `PUT /admin/config/links`
- `GET /admin/config/payments`
- `PUT /admin/config/payments`

### Admin Vehicles (9)
- `POST /admin/vehicles/categories`
- `GET /admin/vehicles/categories`
- `PUT /admin/vehicles/categories/:id`
- `DELETE /admin/vehicles/categories/:id`
- `POST /admin/vehicles/types`
- `PUT /admin/vehicles/types/:id`
- `DELETE /admin/vehicles/types/:id`
- `POST /admin/vehicles/subtypes`
- `PUT /admin/vehicles/subtypes/:id`

### Admin Broadcast (6)
- `POST /admin/broadcast`
- `POST /admin/broadcast/:id/send`
- `GET /admin/broadcast`
- `GET /admin/broadcast/:id`
- `DELETE /admin/broadcast/:id`
- `POST /admin/broadcast/upload`

### Admin Users (7)
- `GET /admin/users`
- `GET /admin/users/:id`
- `PUT /admin/users/:id/block`
- `PUT /admin/users/:id/unblock`
- `PUT /admin/users/:id/balance`
- `GET /admin/users/analytics`
- `GET /admin/users/export`

### Admin Analytics (6)
- `GET /admin/analytics/dashboard`
- `GET /admin/analytics/orders`
- `GET /admin/analytics/users`
- `GET /admin/analytics/revenue`
- `GET /admin/analytics/performance`
- `GET /admin/analytics/export`

### Admin Queues (3)
- `GET /admin/queues/status`
- `POST /admin/queues/message`
- `GET /admin/queues/history`

### Admin Actions (3)
- `GET /admin/actions`
- `GET /admin/actions/:adminId`
- `GET /admin/actions/export`

### Utilities (3)
- `GET /health`
- `GET /version`
- `GET /admin/stats`

**ИТОГО: 52 endpoint'а**

## ⏱️ Обновленная временная оценка

### Детальная разбивка:
- **Этап 1**: Инфраструктура - 3 дня
- **Этап 2**: Database + Admin схема - 3 дня
- **Этап 3**: Auth + Admin Guards - 3 дня
- **Этап 4**: Users + Admin Management - 4 дня
- **Этап 5**: Orders + Moderation - 5 дней
- **Этап 6**: Admin Orders - 4 дня
- **Этап 7**: System Config - 4 дня
- **Этап 8**: Vehicle Catalog - 4 дня
- **Этап 9**: Mass Communication - 5 дней
- **Этап 10**: RabbitMQ Integration - 4 дня
- **Этап 11**: Admin User Management - 3 дня
- **Этап 12**: Payments - 4 дня
- **Этап 13**: Regions & Vehicles - 3 дня
- **Этап 14**: Notifications & Sessions - 4 дня
- **Этап 15**: Admin Analytics - 4 дня
- **Этап 16**: Action Logging - 3 дня
- **Этап 17**: Testing & Docs - 4 дня

**ИТОГО: 65 рабочих дней (3 месяца)**

## 🔄 Docker Compose с RabbitMQ

```yaml
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
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    ports:
      - "5672:5672"   # AMQP port
      - "15672:15672" # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

## ✅ Готовность к реализации

Обновленный план учитывает:
- ✅ Полный админский функционал
- ✅ Ручную модерацию заказов
- ✅ Управление настройками системы
- ✅ CRUD справочников транспорта
- ✅ Массовые рассылки
- ✅ RabbitMQ интеграцию
- ✅ Расширенную аналитику
- ✅ Логирование действий админов

**Новая реалистичная оценка: 65 дней (3 месяца) для полной реализации** 