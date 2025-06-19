# План реализации: NestJS + PostgreSQL + Prisma

## 📋 Обзор проекта

### Выбранный стек
- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Frontend Clients**: Telegram Bot + Telegram Mini App

### Уровень сложности: Level 4
- Разделение монолита
- Смена технологического стека  
- Миграция с NoSQL на SQL
- Создание новых клиентских приложений

## 🎯 Целевая архитектура

```mermaid
graph TB
    %% Клиенты
    TBot[🤖 Telegram Bot<br/>Node.js + telegraf] --> API
    MiniApp[📱 Mini App<br/>React + Telegram SDK] --> API
    
    %% Backend API
    API[🔧 NestJS Backend API<br/>Port: 3000]
    
    %% Модули NestJS
    API --> AuthModule[🔐 Auth Module<br/>JWT + Guards]
    API --> UserModule[👥 User Module<br/>CRUD + Roles]
    API --> OrderModule[📦 Order Module<br/>Lifecycle Management]
    API --> PaymentModule[💳 Payment Module<br/>Tinkoff Integration]
    API --> RegionModule[🗺️ Region Module<br/>Geography Logic]
    API --> NotificationModule[📨 Notification Module<br/>Queue Management]
    
    %% Сервисы
    AuthModule --> UserService[UserService]
    UserModule --> UserService
    OrderModule --> OrderService[OrderService]
    PaymentModule --> PaymentService[PaymentService]
    RegionModule --> RegionService[RegionService]
    NotificationModule --> NotificationService[NotificationService]
    
    %% База данных
    UserService --> Prisma[🔧 Prisma ORM]
    OrderService --> Prisma
    PaymentService --> Prisma
    RegionService --> Prisma
    NotificationService --> Prisma
    
    Prisma --> PostgreSQL[(🐘 PostgreSQL<br/>Port: 5432)]
    
    %% Внешние сервисы
    PaymentService --> TinkoffAPI[💳 Tinkoff API]
    NotificationService --> TelegramAPI[📱 Telegram API]
    NotificationService --> Redis[(🔴 Redis<br/>Message Queue)]
    
    %% Стили
    classDef client fill:#e3f2fd,stroke:#1976d2
    classDef api fill:#f3e5f5,stroke:#7b1fa2
    classDef module fill:#e8f5e8,stroke:#388e3c
    classDef service fill:#fff3e0,stroke:#f57c00
    classDef database fill:#fce4ec,stroke:#c2185b
    classDef external fill:#ffebee,stroke:#d32f2f
    
    class TBot,MiniApp client
    class API api
    class AuthModule,UserModule,OrderModule,PaymentModule,RegionModule,NotificationModule module
    class UserService,OrderService,PaymentService,RegionService,NotificationService service
    class Prisma,PostgreSQL,Redis database
    class TinkoffAPI,TelegramAPI external
```

## 📊 Схема базы данных PostgreSQL

### Prisma Schema
```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Пользователи (унифицированная модель)
model User {
  id        Int      @id @default(autoincrement())
  userId    BigInt   @unique @map("user_id") // Telegram user_id
  username  String?
  name      String
  phone     String
  
  // Роли пользователя
  roles     UserRole[]
  
  // Финансы
  customerBalance  Decimal? @default(0) @map("customer_balance") @db.Decimal(10,2)
  performerBalance Decimal? @default(0) @map("performer_balance") @db.Decimal(10,2)
  
  // Метаданные
  rating       Int      @default(0)
  refCode      String?  @unique @map("ref_code")
  parentRefCode String? @map("parent_ref_code")
  
  // Лимиты (для заказчиков)
  mainLimit    Int?     @default(2) @map("main_limit")
  settingLimit Int?     @default(2) @map("setting_limit")
  
  // Временные метки
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  blockedAt DateTime? @map("blocked_at")
  
  // Связи
  createdOrders    Order[] @relation("CustomerOrders")
  performedOrders  Order[] @relation("PerformerOrders")
  transactions     Transaction[]
  vehicles         Vehicle[]
  userRegions      UserRegion[]
  sessions         UserSession[]
  referrals        User[] @relation("Referrals")
  referrer         User? @relation("Referrals", fields: [parentRefCode], references: [refCode])
  
  @@map("users")
}

// Роли пользователей
model UserRole {
  id     Int      @id @default(autoincrement())
  userId Int      @map("user_id")
  role   RoleType
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, role])
  @@map("user_roles")
}

enum RoleType {
  CUSTOMER
  PERFORMER
}

// Заказы (унифицированная модель)
model Order {
  id          Int      @id @default(autoincrement())
  orderNumber String   @unique @map("order_number")
  type        OrderEntityType @default(ORDER)
  parentOrderId Int?   @map("parent_order_id")
  
  // Основная информация
  orderType   OrderType @map("order_type")
  status      OrderStatus @default(CREATED)
  
  // Участники
  customerId  Int      @map("customer_id")
  performerId Int?     @map("performer_id")
  
  // Детали заказа
  vehicleType    String?  @map("vehicle_type")
  vehicleSubtype String?  @map("vehicle_subtype")
  vehicleAmount  Int?     @map("vehicle_amount")
  
  // Локация
  regionCode     String?  @map("region_code")
  subregionCode  String?  @map("subregion_code")
  address        String
  dropAddress    String?  @map("drop_address")
  distance       Int?     // в км
  
  // Дополнительные поля
  passengerCount Int?     @map("passenger_count")
  cargoInfo      String?  @map("cargo_info")
  requirements   String?
  
  // Финансы
  price          Decimal? @db.Decimal(10,2)
  
  // Временные данные
  scheduledDate  DateTime? @map("scheduled_date")
  scheduledTime  String?   @map("scheduled_time")
  
  // Временные метки
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Связи
  customer     User @relation("CustomerOrders", fields: [customerId], references: [id])
  performer    User? @relation("PerformerOrders", fields: [performerId], references: [id])
  parentOrder  Order? @relation("OrderHierarchy", fields: [parentOrderId], references: [id])
  subOrders    Order[] @relation("OrderHierarchy")
  region       Region? @relation(fields: [regionCode], references: [code])
  transactions Transaction[]
  history      OrderHistory[]
  
  @@map("orders")
}

enum OrderEntityType {
  ORDER
  SUBORDER
}

enum OrderType {
  A_B      // Перевозка А->Б
  PLACE    // Работа по месту  
  PEOPLE   // Перевозка пассажиров
}

enum OrderStatus {
  CREATED
  WAITING
  SEARCHING
  IN_WORK
  COMPLETED
  CANCELLED
}

// История заказов
model OrderHistory {
  id      Int      @id @default(autoincrement())
  orderId Int      @map("order_id")
  action  String
  details Json?
  createdAt DateTime @default(now()) @map("created_at")
  
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  @@map("order_history")
}

// Транзакции
model Transaction {
  id           Int             @id @default(autoincrement())
  userId       Int             @map("user_id")
  type         TransactionType
  amount       Decimal         @db.Decimal(10,2)
  currency     String          @default("RUB")
  status       TransactionStatus @default(PENDING)
  
  // Связанные объекты
  orderId      Int?            @map("order_id")
  externalId   String?         @unique @map("external_id")
  
  // Метаданные
  paymentMethod String?        @map("payment_method")
  description   String?
  metadata      Json?
  
  // Временные метки
  createdAt    DateTime        @default(now()) @map("created_at")
  processedAt  DateTime?       @map("processed_at")
  
  // Связи
  user  User   @relation(fields: [userId], references: [id])
  order Order? @relation(fields: [orderId], references: [id])
  
  @@map("transactions")
}

enum TransactionType {
  TOPUP
  ORDER_PAYMENT
  REFUND
  REFERRAL_BONUS
  COMMISSION
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

// Регионы
model Region {
  id       Int      @id @default(autoincrement())  
  code     String   @unique
  name     String
  
  // Подрегионы как JSON массив
  subregions Json   @default("[]")
  
  // Ценовая политика
  pricing  Json?
  
  // Временные метки
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Связи
  orders      Order[]
  userRegions UserRegion[]
  
  @@map("regions")
}

// Связь пользователей с регионами
model UserRegion {
  id           Int      @id @default(autoincrement())
  userId       Int      @map("user_id")
  regionCode   String   @map("region_code")
  subregions   Json     @default("[]") // активные подрегионы
  isActive     Boolean  @default(true) @map("is_active")
  
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  region Region @relation(fields: [regionCode], references: [code])
  
  @@unique([userId, regionCode])
  @@map("user_regions")
}

// Транспорт пользователей
model Vehicle {
  id       Int      @id @default(autoincrement())
  userId   Int      @map("user_id")
  
  // Характеристики
  category String
  type     String
  subtype  String
  brand    String?
  model    String?
  number   String
  
  // Статус
  isActive Boolean  @default(true) @map("is_active")
  
  // Связь с заказом (если занят)
  currentOrderId Int? @unique @map("current_order_id")
  
  // Временные метки
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("vehicles")
}

// Сессии пользователей (для состояний)
model UserSession {
  id         Int      @id @default(autoincrement())
  userId     Int      @map("user_id")
  clientType String   @map("client_type") // 'bot' | 'miniapp'
  
  // Данные состояния
  stateData  Json?    @map("state_data")
  
  // Время жизни
  expiresAt  DateTime @map("expires_at")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, clientType])
  @@map("user_sessions")
}

// Справочник категорий транспорта
model VehicleCategory {
  id       Int      @id @default(autoincrement())
  name     String   @unique
  types    VehicleType[]
  
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("vehicle_categories")
}

model VehicleType {
  id         Int      @id @default(autoincrement())
  categoryId Int      @map("category_id")
  name       String
  subtypes   VehicleSubtype[]
  
  category VehicleCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@unique([categoryId, name])
  @@map("vehicle_types")
}

model VehicleSubtype {
  id     Int    @id @default(autoincrement())
  typeId Int    @map("type_id")
  name   String
  
  type VehicleType @relation(fields: [typeId], references: [id], onDelete: Cascade)
  
  @@unique([typeId, name])
  @@map("vehicle_subtypes")
}
```

## 🏗️ Структура NestJS проекта

```
telega-api/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   │
│   ├── auth/                    # Аутентификация
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── jwt.strategy.ts
│   │   ├── guards/
│   │   └── dto/
│   │
│   ├── users/                   # Пользователи
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── orders/                  # Заказы
│   │   ├── orders.module.ts
│   │   ├── orders.service.ts
│   │   ├── orders.controller.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── payments/                # Платежи
│   │   ├── payments.module.ts
│   │   ├── payments.service.ts
│   │   ├── payments.controller.ts
│   │   ├── tinkoff/
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── regions/                 # Регионы
│   │   ├── regions.module.ts
│   │   ├── regions.service.ts
│   │   ├── regions.controller.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── notifications/           # Уведомления
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── queue/
│   │   ├── templates/
│   │   └── dto/
│   │
│   ├── vehicles/                # Транспорт
│   │   ├── vehicles.module.ts
│   │   ├── vehicles.service.ts
│   │   ├── vehicles.controller.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── common/                  # Общие компоненты
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   │
│   └── prisma/                  # Prisma настройки
│       ├── prisma.module.ts
│       ├── prisma.service.ts
│       └── migrations/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── clients/                     # Клиентские приложения
│   ├── telegram-bot/           # Telegram Bot
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── mini-app/               # Telegram Mini App
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── README.md
│
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```

## 📝 Детальный план реализации

### Phase 1: Инфраструктура и основы (2-3 недели)

#### 1.1 Настройка проекта
```bash
# Создание NestJS проекта
npm i -g @nestjs/cli
nest new telega-api

# Установка зависимостей
npm install @prisma/client prisma
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/config @nestjs/throttler
npm install class-validator class-transformer
npm install @nestjs/bull bull redis
npm install axios
```

#### 1.2 Настройка PostgreSQL + Prisma
```bash
# Инициализация Prisma
npx prisma init

# Создание миграций
npx prisma migrate dev --name init

# Генерация клиента
npx prisma generate
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
    image: redis:7
    ports:
      - "6379:6379"

  api:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/telega_db
      REDIS_URL: redis://redis:6379

volumes:
  postgres_data:
```

### Phase 2: Core Modules (3-4 недели)

#### 2.1 Auth Module
```typescript
// auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateTelegramUser(telegramData: any) {
    // Валидация Telegram данных
    // Создание/поиск пользователя
    // Генерация JWT токена
  }

  async generateTokens(userId: number) {
    const payload = { sub: userId };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
```

#### 2.2 Users Module
```typescript
// users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        roles: {
          create: createUserDto.roles.map(role => ({ role })),
        },
      },
      include: { roles: true },
    });
  }

  async findByTelegramId(userId: bigint) {
    return this.prisma.user.findUnique({
      where: { userId },
      include: {
        roles: true,
        userRegions: { include: { region: true } },
        vehicles: true,
      },
    });
  }

  async updateBalance(userId: number, amount: number, type: 'customer' | 'performer') {
    const updateData = type === 'customer' 
      ? { customerBalance: { increment: amount } }
      : { performerBalance: { increment: amount } };
      
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }
}
```

#### 2.3 Orders Module
```typescript
// orders/orders.service.ts
@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto) {
    const orderNumber = await this.generateOrderNumber();
    
    const order = await this.prisma.order.create({
      data: {
        ...createOrderDto,
        orderNumber,
        history: {
          create: {
            action: 'ORDER_CREATED',
            details: { ...createOrderDto },
          },
        },
      },
      include: { customer: true, region: true },
    });

    // Уведомляем подходящих исполнителей
    await this.notifyAvailablePerformers(order);

    return order;
  }

  async findAvailableOrders(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRegions: true },
    });

    const activeRegions = user.userRegions.map(ur => ur.regionCode);

    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.SEARCHING,
        regionCode: { in: activeRegions },
        performerId: null,
      },
      include: { customer: true, region: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### Phase 3: Интеграции (2-3 недели)

#### 3.1 Tinkoff Payment Integration
```typescript
// payments/tinkoff/tinkoff.service.ts
@Injectable()
export class TinkoffService {
  private readonly apiUrl = 'https://securepay.tinkoff.ru/v2';

  async initiatePayment(amount: number, userId: number): Promise<string> {
    const orderId = uuidv4();
    
    await this.prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.TOPUP,
        amount,
        status: TransactionStatus.PENDING,
        externalId: orderId,
        paymentMethod: 'tinkoff',
      },
    });

    const payload = {
      TerminalKey: process.env.TINKOFF_TERMINAL_KEY,
      Amount: amount * 100, // копейки
      OrderId: orderId,
    };

    payload['Token'] = this.generateSignature(payload);

    const response = await axios.post(`${this.apiUrl}/Init`, payload);
    return response.data.PaymentURL;
  }

  async handleWebhook(webhookData: any) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { externalId: webhookData.OrderId },
    });

    if (webhookData.Status === 'CONFIRMED') {
      await this.prisma.$transaction([
        this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { 
            status: TransactionStatus.COMPLETED,
            processedAt: new Date(),
          },
        }),
        this.prisma.user.update({
          where: { id: transaction.userId },
          data: { customerBalance: { increment: transaction.amount } },
        }),
      ]);
    }
  }
}
```

#### 3.2 Notification Service
```typescript
// notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async sendOrderNotification(order: Order, performerIds: number[]) {
    for (const performerId of performerIds) {
      await this.notificationQueue.add('order-available', {
        performerId,
        orderId: order.id,
        orderType: order.orderType,
        region: order.regionCode,
      });
    }
  }

  @Process('order-available')
  async handleOrderNotification(job: Job) {
    const { performerId, orderId } = job.data;
    
    const user = await this.prisma.user.findUnique({
      where: { id: performerId },
    });

    // Отправляем через Telegram Bot API
    await this.sendTelegramMessage(user.userId, {
      text: 'Новый заказ доступен!',
      reply_markup: {
        inline_keyboard: [[
          { text: 'Посмотреть', callback_data: `order_${orderId}` }
        ]]
      }
    });
  }
}
```

### Phase 4: Клиентские приложения (3-4 недели)

#### 4.1 Telegram Bot (refactored)
```typescript
// clients/telegram-bot/src/bot.service.ts
@Injectable()
export class BotService {
  private bot: Telegraf;

  constructor(private apiClient: ApiClientService) {
    this.bot = new Telegraf(process.env.BOT_TOKEN);
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.start(async (ctx) => {
      const telegramUser = ctx.from;
      
      // Аутентификация через API
      const authResult = await this.apiClient.authenticateUser({
        userId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
      });

      if (authResult.isNewUser) {
        await ctx.reply('Добро пожаловать! Выберите роль:', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛒 Заказчик', callback_data: 'role_customer' }],
              [{ text: '🚚 Исполнитель', callback_data: 'role_performer' }]
            ]
          }
        });
      } else {
        await this.showMainMenu(ctx, authResult.user);
      }
    });

    this.bot.action(/^role_(.+)$/, async (ctx) => {
      const role = ctx.match[1];
      await this.apiClient.addUserRole(ctx.from.id, role);
      await ctx.reply('Роль добавлена! Теперь введите ваше имя:');
      // Сохраняем состояние через API
      await this.apiClient.setUserState(ctx.from.id, 'awaiting_name', { role });
    });
  }
}
```

#### 4.2 Telegram Mini App
```typescript
// clients/mini-app/src/App.tsx
import { useEffect, useState } from 'react';
import { WebApp } from '@twa-dev/sdk';

function App() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    WebApp.ready();
    
    // Аутентификация
    authenticate();
  }, []);

  const authenticate = async () => {
    const initData = WebApp.initData;
    
    const response = await fetch('/api/auth/telegram-webapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });

    const { user, token } = await response.json();
    setUser(user);
    
    // Сохраняем токен
    localStorage.setItem('token', token);
    
    // Загружаем заказы
    loadOrders();
  };

  const loadOrders = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const orders = await response.json();
    setOrders(orders.data);
  };

  return (
    <div className="app">
      <header>
        <h1>Telega Logistics</h1>
        {user && <span>Привет, {user.name}!</span>}
      </header>
      
      <main>
        <OrderList orders={orders} />
        <CreateOrderButton />
      </main>
    </div>
  );
}
```

### Phase 5: Миграция данных (2-3 недели)

#### 5.1 Миграционные скрипты
```typescript
// scripts/migrate-data.ts
export class DataMigrationService {
  async migrateUsers() {
    console.log('Migrating users...');
    
    // Получаем данные из MongoDB
    const oldUsers = await this.mongoDb.collection('users').find({}).toArray();
    const oldCustomers = await this.mongoDb.collection('custumer').find({}).toArray();
    const oldPerformers = await this.mongoDb.collection('performer').find({}).toArray();

    for (const oldUser of oldUsers) {
      const userData: any = {
        userId: BigInt(oldUser.user_id),
        createdAt: oldUser.register_date || new Date(),
      };

      const roles = [];
      
      // Собираем данные заказчика
      if (oldUser.custumer) {
        const customerData = oldCustomers.find(c => c.user_id === oldUser.user_id);
        if (customerData) {
          roles.push('CUSTOMER');
          userData.name = customerData.name;
          userData.phone = customerData.phone;
          userData.customerBalance = customerData.balance || 0;
          userData.mainLimit = customerData.main_limit || 2;
          userData.settingLimit = customerData.setting_limit || 2;
          userData.refCode = customerData.ref_code;
          userData.parentRefCode = customerData.parent_ref_code;
        }
      }

      // Собираем данные исполнителя
      if (oldUser.performer) {
        const performerData = oldPerformers.find(p => p.user_id === oldUser.user_id);
        if (performerData) {
          roles.push('PERFORMER');
          if (!userData.name) userData.name = performerData.name;
          if (!userData.phone) userData.phone = performerData.phone;
          userData.performerBalance = performerData.balance || 0;
          userData.rating = performerData.rating || 0;
        }
      }

      // Создаем пользователя в PostgreSQL
      await this.prisma.user.create({
        data: {
          ...userData,
          roles: {
            create: roles.map(role => ({ role })),
          },
        },
      });
    }
    
    console.log(`Migrated ${oldUsers.length} users`);
  }

  async migrateOrders() {
    console.log('Migrating orders...');
    
    const oldOrders = await this.mongoDb.collection('orde').find({}).toArray();
    
    for (const oldOrder of oldOrders) {
      const orderData = {
        orderNumber: oldOrder.order_number,
        orderType: this.mapOrderType(oldOrder.type_order),
        status: this.mapOrderStatus(oldOrder.status),
        customerId: await this.getUserIdByTelegramId(oldOrder.customer?.user_id),
        performerId: oldOrder.performer ? await this.getUserIdByTelegramId(Object.keys(oldOrder.performer)[0]) : null,
        
        vehicleType: oldOrder.type_car,
        vehicleSubtype: oldOrder.type_tip_car,
        vehicleAmount: oldOrder.amount_car,
        
        regionCode: oldOrder.region_number?.toString(),
        subregionCode: oldOrder.preregion?.toString(),
        address: oldOrder.address,
        dropAddress: oldOrder.drop_address,
        distance: oldOrder.distance,
        
        passengerCount: oldOrder.amount_people,
        cargoInfo: oldOrder.info,
        requirements: oldOrder.requirements,
        
        price: oldOrder.price ? parseFloat(oldOrder.price) : null,
        scheduledDate: oldOrder.date,
        scheduledTime: oldOrder.time,
        
        createdAt: oldOrder.create_date || new Date(),
      };

      const newOrder = await this.prisma.order.create({ data: orderData });

      // Создаем записи истории
      if (oldOrder.log && Array.isArray(oldOrder.log)) {
        for (const logEntry of oldOrder.log) {
          await this.prisma.orderHistory.create({
            data: {
              orderId: newOrder.id,
              action: 'LEGACY_LOG',
              details: logEntry,
              createdAt: new Date(),
            },
          });
        }
      }
    }
    
    console.log(`Migrated ${oldOrders.length} orders`);
  }
}
```

## 🚀 Порядок выполнения

### Приоритеты разработки

1. **КРИТИЧЕСКИЙ ПУТЬ**
   - Phase 1: Инфраструктура → 3 недели
   - Phase 2: Core API → 4 недели  
   - Phase 3: Интеграции → 3 недели
   - **ИТОГО: 10 недель до MVP**

2. **ПАРАЛЛЕЛЬНАЯ РАЗРАБОТКА**
   - Phase 4: Клиенты (после Phase 2)
   - Phase 5: Миграция (после Phase 3)

3. **ТЕСТИРОВАНИЕ И ДЕПЛОЙ**
   - Unit тесты на каждом этапе
   - Integration тесты после Phase 3
   - E2E тесты в Phase 4
   - Staging деплой в Phase 4
   - Production миграция в Phase 5

### Команда и роли

```yaml
Backend Developer (NestJS/Prisma):
  - Core API разработка
  - Database design
  - Integration с внешними API

Frontend Developer (React/Telegram):
  - Mini App разработка
  - UI/UX дизайн
  - Telegram WebApp интеграция

DevOps Engineer:
  - Docker containerization
  - CI/CD pipeline
  - Infrastructure setup

QA Engineer:
  - Test planning
  - Automated testing
  - Performance testing
```

## 🔄 Стратегия миграции без даунтайма

### Этап 1: Подготовка
- Развертываем новый API параллельно
- Настраиваем синхронизацию данных
- Тестируем на staging

### Этап 2: Постепенный переход
- 10% пользователей на новый API
- Мониторинг производительности
- Исправление найденных проблем

### Этап 3: Полный переход
- 100% трафика на новый API
- Отключение старого монолита
- Финальная проверка системы

## 📊 Метрики успеха

- **Performance**: API response time < 200ms
- **Availability**: 99.9% uptime
- **Data Integrity**: 0% потерь данных при миграции
- **User Experience**: Время загрузки < 3 секунд 