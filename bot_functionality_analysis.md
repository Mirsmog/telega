# Анализ функционала Telegram бота и рекомендации по архитектуре NestJS API

## 🎯 Основной функционал системы

### **Типы пользователей:**
1. **Customer (Заказчик)** - создает заявки на транспорт
2. **Performer (Исполнитель)** - выполняет заявки 
3. **Admin** - управляет системой

### **Типы заказов:**
1. **A_TO_B** - Перевозка груза из точки А в точку Б
2. **PLACE** - Работа спецтехники в одном месте  
3. **PEOPLE** - Перевозка пассажиров

## 🔍 Критический анализ полей из Python бота

### ✅ **КРИТИЧНО ВАЖНЫЕ поля (обязательны к переносу):**

#### **User (Пользователи):**
```typescript
// РЕАЛЬНО НУЖНЫЕ поля:
orderStats: { done: number, cancel: number }    // Статистика заказов - ВАЖНО для репутации
mainLimit: number                               // Лимит активных заказов - БИЗНЕС-ЛОГИКА  
settingLimit: number                            // Лимит настроек/создания - МОНЕТИЗАЦИЯ
logs: Array<{message: string, date: string}>    // История действий - АУДИТ
totalEarned: Decimal                            // Общий заработок - ФИНАНСЫ
hasTariff: boolean                              // Оплаченный тариф - МОНЕТИЗАЦИЯ
activeRegions: Json                             // Активные регионы работы - МАТЧИНГ
```

#### **Order (Заказы):**
```typescript  
// РЕАЛЬНО НУЖНЫЕ поля:
orderNumber: string                             // Номер заказа - КРИТИЧНО! (для UI/UX)
logs: Array<{message: string, date: string, user: string}>  // История изменений - АУДИТ
sendStatus: boolean                             // Отправлен исполнителям - ЛОГИКА РАССЫЛКИ
sendToAll: boolean                              // Массовая рассылка - ЛОГИКА РАССЫЛКИ  
regionNumber: string                            // Код региона - МАТЧИНГ с исполнителями
preRegion: string                               // Подрегион - ТОЧНЫЙ МАТЧИНГ
distance: Decimal                               // Расстояние - РАСЧЕТ СТОИМОСТИ
requirements: string                            // Требования - ВАЖНО для исполнителей
comment: string                                 // Комментарии - КОММУНИКАЦИЯ
```

### ⚠️ **УСЛОВНО ВАЖНЫЕ поля (нужно переосмыслить):**

#### **User:**
```typescript
// МОЖНО УЛУЧШИТЬ:
reports: Json → notifications/messages         // Заменить на систему уведомлений
sendReports: Json → messageHistory            // История сообщений  
cars: Json → отдельная модель Vehicle         // Вынести в отдельную таблицу
```

#### **Order:**
```typescript  
// МОЖНО ПЕРЕОСМЫСЛИТЬ:
typeTipCar: string → vehicleTypeId            // Связь с справочником
podTypeCar: string → vehicleSubtypeId         // Связь с справочником
createDate: DateTime → createdAt              // Уже есть в Prisma
regions: string → regionId                    // Нормализовать связи
```

### ❌ **НЕ НУЖНЫЕ поля (артефакты джуна):**

```typescript
// УБРАТЬ:
amountCar: number                             // Дублирует vehicleCount
typeTipCar + podTypeCar                       // Плохая нормализация - заменить на FK
viptarif: boolean                             // Дублирует систему тарифов  
tariff: boolean                               // Дублирует hasTariff
coment vs comment                             // Опечатка в названии
```

## 🏗️ **Рекомендуемая архитектура для NestJS:**

### **1. Улучшенная модель User:**
```prisma
model User {
  id                String             @id @default(cuid()) 
  telegramId        BigInt             @unique
  username          String?
  firstName         String
  lastName          String?
  phone             String?
  role              RoleType           @default(CUSTOMER)
  
  // Финансы и лимиты (КРИТИЧНО)
  balance           Decimal            @default(0) @db.Decimal(10,2)
  frozenBalance     Decimal            @default(0) @db.Decimal(10,2)
  totalEarned       Decimal            @default(0) @db.Decimal(10,2)
  mainLimit         Int                @default(2)     // Лимит активных заказов
  settingLimit      Int                @default(2)     // Лимит создания заказов
  
  // Статистика (ВАЖНО для репутации)
  completedOrders   Int                @default(0)
  cancelledOrders   Int                @default(0)
  rating            Decimal            @default(0) @db.Decimal(3,2)
  
  // Подписка и регионы (БИЗНЕС-ЛОГИКА)
  hasActiveTariff   Boolean            @default(false)
  tariffExpiresAt   DateTime?
  
  // Аудит (ВАЖНО)
  activityLog       Json               @default("[]")  // [{message, date, action}]
  
  // Реферальная система  
  referralCode      String?            @unique
  referredBy        String?
  
  // Системные поля
  isActive          Boolean            @default(true)
  isBanned          Boolean            @default(false)
  lastSeen          DateTime?
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Связи
  vehicles          UserVehicle[]
  userRegions       UserRegion[]
  ordersAsCustomer  Order[]            @relation("CustomerOrders")
  ordersAsExecutor  Order[]            @relation("ExecutorOrders") 
  orderResponses    OrderResponse[]
  payments          Payment[]
  sessions          Session[]
  notifications     Notification[]
  
  @@map("users")
}
```

### **2. Улучшенная модель Order:**
```prisma
model Order {
  id                String             @id @default(cuid())
  orderNumber       String             @unique           // КРИТИЧНО!
  customerId        String
  executorId        String?
  regionId          String
  vehicleSubtypeId  String?
  
  // Основная информация
  type              OrderType
  title             String
  description       String
  
  // Адреса и геолокация
  fromAddress       String?
  toAddress         String?
  workAddress       String?            // Для типа PLACE
  fromLatitude      Decimal?           @db.Decimal(10,8)
  fromLongitude     Decimal?           @db.Decimal(11,8)
  toLatitude        Decimal?           @db.Decimal(10,8)
  toLongitude       Decimal?           @db.Decimal(11,8)
  
  // Региональная привязка (КРИТИЧНО для матчинга)
  regionNumber      String             // Код региона
  subRegion         String?            // Подрегион
  
  // Время и срочность
  scheduledDate     DateTime?
  scheduledTime     String?            // HH:MM
  deadlineDate      DateTime?
  isUrgent          Boolean            @default(false)
  
  // Финансы
  budget            Decimal?           @db.Decimal(10,2)
  proposedPrice     Decimal?           @db.Decimal(10,2)  // Цена от исполнителя
  finalPrice        Decimal?           @db.Decimal(10,2)  // Итоговая цена
  isFixedPrice      Boolean            @default(false)
  
  // Характеристики груза/работы
  cargoWeight       Decimal?           @db.Decimal(8,2)
  cargoVolume       Decimal?           @db.Decimal(8,2)
  cargoDescription  String?            // Что везем
  distance          Decimal?           @db.Decimal(8,2)   // ВАЖНО для расчетов
  peopleCount       Int?               // Для перевозки людей
  
  // Требования
  requirements      String?            // Требования к перевозке
  needsRefrigerator Boolean            @default(false)
  needsLifting      Boolean            @default(false)
  isFragile         Boolean            @default(false)
  
  // Статус и модерация
  status            OrderStatus        @default(DRAFT)
  moderationComment String?
  
  // Логика рассылки (ВАЖНО)
  isSentToExecutors Boolean           @default(false)
  sentToAllRegions  Boolean           @default(false)
  viewsCount        Int               @default(0)
  responsesCount    Int               @default(0)
  
  // Контакты
  contactPhone      String?
  contactName       String?
  
  // Аудит (КРИТИЧНО)
  activityLog       Json              @default("[]")  // История изменений
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Связи
  customer          User              @relation("CustomerOrders", fields: [customerId], references: [id])
  executor          User?             @relation("ExecutorOrders", fields: [executorId], references: [id])
  region            Region            @relation(fields: [regionId], references: [id])
  vehicleSubtype    VehicleSubtype?   @relation(fields: [vehicleSubtypeId], references: [id])
  responses         OrderResponse[]
  
  @@map("orders")
}
```

### **3. Система регионов (КРИТИЧНО для матчинга):**
```prisma
model Region {
  id                String             @id @default(cuid())
  name              String             @unique
  code              String             @unique         // "MSK", "SPB"
  regionNumber      String             @unique         // "01", "02" 
  
  // Подрегионы
  subRegions        Json               @default("[]")  // Список подрегионов
  
  // Тарифы для исполнителей
  oneTimeTariff     Decimal            @db.Decimal(10,2)
  optimalTariff     Decimal            @db.Decimal(10,2)
  
  isActive          Boolean            @default(true)
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Связи
  orders            Order[]
  userRegions       UserRegion[]
  
  @@map("regions")
}

model UserRegion {
  id                String             @id @default(cuid())
  userId            String
  regionId          String
  regionNumber      String             // Дублируем для быстрого поиска
  
  // Активные подрегионы для исполнителя
  activeSubRegions  Json               @default("[]")  // Список активных подрегионов
  
  tariffType        TariffType
  paidUntil         DateTime?
  
  user              User               @relation(fields: [userId], references: [id])
  region            Region             @relation(fields: [regionId], references: [id])
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  @@unique([userId, regionId])
  @@map("user_regions")
}
```

## 🎯 **Ключевые бизнес-процессы для API:**

### **1. Создание заказа:**
```typescript
// POST /api/orders
{
  type: "A_TO_B" | "PLACE" | "PEOPLE",
  vehicleSubtypeId: string,
  fromAddress: string,
  toAddress?: string,
  regionNumber: string,        // КРИТИЧНО для матчинга
  subRegion: string,           // Точный матчинг
  scheduledDate?: string,
  budget?: number,
  requirements?: string,
  // ... остальные поля
}
```

### **2. Матчинг заказов с исполнителями:**
```sql
-- Поиск подходящих исполнителей
SELECT DISTINCT u.* FROM users u
JOIN user_regions ur ON u.id = ur.userId  
JOIN user_vehicles uv ON u.id = uv.userId
WHERE ur.regionNumber = :orderRegionNumber
  AND JSON_CONTAINS(ur.activeSubRegions, :orderSubRegion)
  AND uv.subtypeId = :orderVehicleSubtypeId
  AND u.role = 'EXECUTOR'
  AND u.hasActiveTariff = true
  AND u.isActive = true
```

### **3. Система лимитов:**
```typescript
// Проверка лимитов перед созданием заказа
const activeOrdersCount = await prisma.order.count({
  where: {
    customerId: userId,
    status: { in: ['ACTIVE', 'IN_PROGRESS'] }
  }
});

if (activeOrdersCount >= user.mainLimit) {
  throw new BadRequestException('Превышен лимит активных заказов');
}
```

## 🚀 **План миграции:**

### **Фаза 1: Критичные поля**
1. Добавить `orderNumber` в Order
2. Добавить `activityLog` в User и Order  
3. Добавить лимиты в User
4. Настроить систему регионов

### **Фаза 2: Бизнес-логика**
1. Система матчинга заказов
2. Логика рассылки (`isSentToExecutors`, `sentToAllRegions`)
3. Система тарифов и оплаты доступа к регионам

### **Фаза 3: Оптимизация**
1. Замена JSON полей на нормализованные связи где возможно
2. Индексы для поиска заказов
3. Кэширование частых запросов

## ✅ **Итоговые рекомендации:**

1. **ОБЯЗАТЕЛЬНО добавить:** `orderNumber`, лимиты пользователя, `activityLog`, систему регионов
2. **Переосмыслить:** JSON поля заменить на нормализованные связи где возможно  
3. **Убрать:** дублирующие поля, опечатки в названиях, избыточные поля
4. **Акцент на бизнес-логику:** матчинг, лимиты, монетизация, аудит

Главное - не потерять критичный функционал (номера заказов, лимиты, систему регионов), но избавиться от технического долга джуниорской разработки. 