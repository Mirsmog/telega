# Database Schema - Полная Prisma схема

## Основные enum'ы

```prisma
enum RoleType {
  CUSTOMER
  PERFORMER
  ADMIN
}

enum OrderType {
  A_TO_B    // Перевозка груза
  PLACE     // Работа в месте
  PEOPLE    // Перевозка людей
}

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

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum TariffType {
  ONE_TIME    // Разовый
  OPTIMAL     // Оптимальный
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

enum QueueMessageStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  DEAD_LETTER
}
```

## Основные таблицы

```prisma
// Пользователи
model User {
  id                Int      @id @default(autoincrement())
  telegramId        String   @unique
  username          String?
  firstName         String?
  lastName          String?
  phone             String?
  isBlocked         Boolean  @default(false)
  balance           Float    @default(0)
  referralCode      String   @unique
  referredBy        Int?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Связи
  roles             UserRole[]
  referrer          User?     @relation("UserReferrals", fields: [referredBy], references: [id])
  referrals         User[]    @relation("UserReferrals")
  orders            Order[]
  orderResponses    OrderResponse[]
  payments          Payment[]
  sessions          UserSession[]
  adminActions      AdminAction[]
  broadcasts        Broadcast[]
  configUpdates     SystemConfig[]

  @@map("users")
}

// Роли пользователей
model UserRole {
  id     Int      @id @default(autoincrement())
  userId Int
  role   RoleType

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
  @@map("user_roles")
}

// Регионы
model Region {
  id          Int     @id @default(autoincrement())
  name        String  @unique
  isActive    Boolean @default(true)
  oneTimeRate Float   // Стоимость разового тарифа
  optimalRate Float   // Стоимость оптимального тарифа

  orders Order[]

  @@map("regions")
}

// Категории транспорта
model VehicleCategory {
  id       Int    @id @default(autoincrement())
  name     String @unique
  isActive Boolean @default(true)

  types VehicleType[]

  @@map("vehicle_categories")
}

// Типы транспорта
model VehicleType {
  id         Int    @id @default(autoincrement())
  categoryId Int
  name       String
  isActive   Boolean @default(true)

  category VehicleCategory @relation(fields: [categoryId], references: [id])
  subtypes VehicleSubtype[]

  @@unique([categoryId, name])
  @@map("vehicle_types")
}

// Подтипы транспорта
model VehicleSubtype {
  id     Int    @id @default(autoincrement())
  typeId Int
  name   String
  isActive Boolean @default(true)

  type   VehicleType @relation(fields: [typeId], references: [id])
  orders Order[]

  @@unique([typeId, name])
  @@map("vehicle_subtypes")
}

// Заказы
model Order {
  id              Int         @id @default(autoincrement())
  customerId      Int
  type            OrderType
  title           String
  description     String?
  fromAddress     String?
  toAddress       String?
  workAddress     String?
  price           Float
  regionId        Int
  vehicleSubtypeId Int?
  status          OrderStatus @default(CREATED)
  rejectionReason String?
  moderatedBy     Int?
  moderatedAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Связи
  customer        User              @relation(fields: [customerId], references: [id])
  region          Region            @relation(fields: [regionId], references: [id])
  vehicleSubtype  VehicleSubtype?   @relation(fields: [vehicleSubtypeId], references: [id])
  responses       OrderResponse[]

  @@map("orders")
}

// Отклики на заказы
model OrderResponse {
  id          Int      @id @default(autoincrement())
  orderId     Int
  performerId Int
  message     String?
  isAccepted  Boolean  @default(false)
  createdAt   DateTime @default(now())

  order     Order @relation(fields: [orderId], references: [id])
  performer User  @relation(fields: [performerId], references: [id])

  @@unique([orderId, performerId])
  @@map("order_responses")
}

// Платежи
model Payment {
  id            Int           @id @default(autoincrement())
  userId        Int
  amount        Float
  tariffType    TariffType
  regionId      Int?
  status        PaymentStatus @default(PENDING)
  tinkoffId     String?       @unique
  paymentUrl    String?
  createdAt     DateTime      @default(now())
  completedAt   DateTime?

  user User @relation(fields: [userId], references: [id])

  @@map("payments")
}

// Сессии пользователей (Redis backup)
model UserSession {
  id        String   @id
  userId    Int
  data      Json
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@map("user_sessions")
}
```

## Админские таблицы

```prisma
// Настройки системы
model SystemConfig {
  id          Int      @id @default(autoincrement())
  key         String   @unique
  value       Json
  description String?
  category    String   @default("general")
  updatedBy   Int?
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())

  updater User? @relation(fields: [updatedBy], references: [id])

  @@map("system_config")
}

// Логи действий админа
model AdminAction {
  id         Int             @id @default(autoincrement())
  adminId    Int
  action     AdminActionType
  entityType String
  entityId   String
  details    Json?
  createdAt  DateTime        @default(now())

  admin User @relation(fields: [adminId], references: [id])

  @@map("admin_actions")
}

// Массовые рассылки
model Broadcast {
  id          Int                 @id @default(autoincrement())
  title       String
  message     String
  imageUrl    String?
  targetType  BroadcastTargetType @default(ALL_USERS)
  targetUsers Json?
  sentCount   Int                 @default(0)
  totalCount  Int                 @default(0)
  status      BroadcastStatus     @default(DRAFT)
  createdBy   Int
  createdAt   DateTime            @default(now())
  sentAt      DateTime?

  creator User @relation(fields: [createdBy], references: [id])

  @@map("broadcasts")
}

// Очереди сообщений
model QueueMessage {
  id          Int                @id @default(autoincrement())
  queueName   String
  messageType String
  payload     Json
  status      QueueMessageStatus @default(PENDING)
  attempts    Int                @default(0)
  maxAttempts Int                @default(3)
  error       String?
  createdAt   DateTime           @default(now())
  processedAt DateTime?

  @@map("queue_messages")
}
```

## Seed данные

```typescript
// Базовые регионы
const regions = [
  { name: 'Москва', oneTimeRate: 350, optimalRate: 2000 },
  { name: 'СПб', oneTimeRate: 300, optimalRate: 1800 },
  { name: 'Другие', oneTimeRate: 200, optimalRate: 1500 }
];

// Категории транспорта
const vehicleCategories = [
  {
    name: 'Легковые',
    types: [
      {
        name: 'Седан',
        subtypes: ['Эконом', 'Комфорт', 'Бизнес']
      },
      {
        name: 'Универсал',
        subtypes: ['Стандарт', 'Увеличенный']
      }
    ]
  },
  {
    name: 'Грузовые',
    types: [
      {
        name: 'Малотоннажные',
        subtypes: ['До 1.5т', '1.5-3т']
      },
      {
        name: 'Среднетоннажные',
        subtypes: ['3-7т', '7-12т']
      }
    ]
  }
];

// Системные настройки
const systemConfig = [
  { key: 'order_price', value: { amount: 70 }, category: 'pricing' },
  { key: 'telegram_bot_link', value: { url: 'https://t.me/yourbot' }, category: 'links' },
  { key: 'mini_app_link', value: { url: 'https://app.example.com' }, category: 'links' }
];
``` 