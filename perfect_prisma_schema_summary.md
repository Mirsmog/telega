# Идеальная универсальная Prisma схема для Telegram Bot + Mini App

## 🎯 **Ключевые улучшения для универсального API:**

### **1. Поддержка разных типов клиентов:**
```prisma
enum ClientType {
  TELEGRAM_BOT      // Telegram Bot
  TELEGRAM_WEB_APP  // Telegram Mini App  
  WEB_BROWSER      // Веб-браузер (будущее)
  MOBILE_APP       // Мобильное приложение (будущее)
}

model Session {
  clientType        ClientType         // Тип клиента
  chatId            BigInt?            // Для Telegram Bot
  webAppInitData    String?            // Для Telegram Mini App
  userAgent         String?            // User Agent браузера
  deviceInfo        Json?              // Информация об устройстве
  timezone          String?            // Часовой пояс
  language          String?            // Язык интерфейса
}
```

### **2. UI-friendly названия полей:**
```prisma
// ❌ Старые названия (специфичные для бота)
mainLimit, settingLimit, regionNumber, fromAddress, toAddress

// ✅ Новые названия (универсальные для API)
orderLimit, createLimit, regionCode, pickupAddress, deliveryAddress
```

### **3. Поддержка Mini App функций:**
```prisma
model VehicleCategory {
  displayName       String             // Название для UI
  iconUrl           String?            // Иконка для Mini App
  sortOrder         Int                @default(0)
}

model UserVehicle {
  photos            Json               @default("[]")   // Фотографии
  documents         Json               @default("[]")   // Документы
  isVerified        Boolean            @default(false)  // Модерация
}

model Order {
  photos            Json               @default("[]")   // Фото груза
  documents         Json               @default("[]")   // Документы
  pickupLatitude    Decimal?           // Координаты для карт
  pickupLongitude   Decimal?
  deliveryLatitude  Decimal?
  deliveryLongitude Decimal?
}
```

### **4. Улучшенная система уведомлений:**
```prisma
model Notification {
  sendToTelegram    Boolean            @default(true)
  sendToEmail       Boolean            @default(false) 
  sendToWebApp      Boolean            @default(true)   // Для Mini App
  iconUrl           String?            // Иконка
  actionUrl         String?            // Ссылка для перехода
}
```

### **5. Расширенная система платежей:**
```prisma
model PaymentTransaction {
  type              String             // TOP_UP, WITHDRAWAL, ORDER_PAYMENT, PLAN_PAYMENT
  paymentMethod     String?            // TINKOFF, CARD, BALANCE
  externalId        String?            // ID в внешней системе
}
```

## 🚀 **API эндпоинты для разных клиентов:**

### **1. Универсальный эндпоинт создания заказа:**
```typescript
// POST /api/v1/orders
interface CreateOrderRequest {
  type: 'A_TO_B' | 'PLACE' | 'PEOPLE';
  title: string;
  description: string;
  
  // Адреса (универсальные названия)
  pickupAddress?: string;
  deliveryAddress?: string;
  workAddress?: string;
  
  // Координаты (для Mini App карт)
  pickupLatitude?: number;
  pickupLongitude?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  
  // Регион (критично для матчинга)
  regionCode: string;        // "01", "02"
  subRegion?: string;        // "Центр", "Север"
  
  // Бюджет (диапазон)
  budgetFrom?: number;
  budgetTo?: number;
  isPriceFixed?: boolean;
  
  // Груз/работа
  cargoDescription?: string;
  cargoWeight?: number;
  cargoVolume?: number;
  estimatedDistance?: number;
  passengerCount?: number;   // Для PEOPLE
  
  // Требования
  requirements?: string;
  needsRefrigerator?: boolean;
  needsLifting?: boolean;
  isFragile?: boolean;
  
  // Время
  scheduledDate?: string;
  scheduledTime?: string;    // "14:30"
  isUrgent?: boolean;
  
  // Фото (для Mini App)
  photos?: string[];         // Массив URL
  
  // Транспорт  
  vehicleSubtypeId?: string;
  
  // Контакты
  contactPhone?: string;
  contactName?: string;
  customerComment?: string;
}
```

### **2. Эндпоинт для матчинга (Bot + Mini App):**
```typescript
// GET /api/v1/orders/available?clientType=TELEGRAM_WEB_APP
interface AvailableOrdersResponse {
  orders: Array<{
    id: string;
    orderNumber: string;       // Для отображения в UI
    type: OrderType;
    title: string;
    description: string;
    
    // Адреса с координатами (для карт в Mini App)
    pickupAddress: string;
    pickupLatitude?: number;
    pickupLongitude?: number;
    deliveryAddress?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    
    // Финансы
    budgetFrom?: number;
    budgetTo?: number;
    
    // Время
    scheduledDate?: string;
    scheduledTime?: string;
    isUrgent: boolean;
    
    // Фото (для Mini App)
    photos: string[];
    
    // Статистика
    viewsCount: number;
    responsesCount: number;
    
    // Заказчик
    customer: {
      firstName: string;
      averageRating: number;
      completedOrders: number;
    };
  }>;
  
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
}
```

### **3. Универсальная система сессий:**
```typescript
// POST /api/v1/auth/session
interface CreateSessionRequest {
  clientType: 'TELEGRAM_BOT' | 'TELEGRAM_WEB_APP';
  
  // Для Bot
  chatId?: number;
  
  // Для Mini App
  webAppInitData?: string;
  
  // Общие
  timezone?: string;
  language?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    userAgent?: string;
  };
}
```

### **4. Мультиканальные уведомления:**
```typescript
// POST /api/v1/notifications/send
interface SendNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: 'ORDER_UPDATE' | 'PAYMENT' | 'SYSTEM' | 'PROMO';
  
  // Каналы доставки
  channels: {
    telegram?: boolean;      // Отправить в Telegram
    webApp?: boolean;        // Показать в Mini App
    email?: boolean;         // Email (будущее)
  };
  
  // Для Mini App
  iconUrl?: string;          // Иконка уведомления
  actionUrl?: string;        // Ссылка для перехода
  
  metadata?: any;            // Дополнительные данные
}
```

## 📱 **Специфичные возможности для Mini App:**

### **1. Геолокация и карты:**
```typescript
// GET /api/v1/regions/{regionCode}/map-data
interface RegionMapData {
  centerLatitude: number;
  centerLongitude: number;
  subRegions: Array<{
    name: string;
    boundaries?: number[][];   // Полигон границ
    isActive: boolean;
  }>;
}
```

### **2. Фото и документы:**
```typescript
// POST /api/v1/upload/photos
interface UploadPhotosResponse {
  urls: string[];              // URL загруженных фото
}

// GET /api/v1/vehicles/categories
interface VehicleCategoriesResponse {
  categories: Array<{
    id: string;
    displayName: string;       // "Грузовики"
    iconUrl: string;           // URL иконки
    sortOrder: number;
    types: Array<{
      id: string;
      displayName: string;     // "Фургоны"
      iconUrl: string;
      subtypes: Array<{
        id: string; 
        displayName: string;   // "До 1.5 тонн"
        iconUrl: string;
      }>;
    }>;
  }>;
}
```

### **3. Статистика и аналитика:**
```typescript
// GET /api/v1/users/{userId}/dashboard
interface UserDashboard {
  stats: {
    completedOrders: number;
    cancelledOrders: number;
    averageRating: number;
    totalEarned: number;
    currentBalance: number;
  };
  
  limits: {
    orderLimit: number;        // Лимит активных заказов
    createLimit: number;       // Лимит создания
    usedOrders: number;        // Использовано заказов
    usedCreates: number;       // Использовано создания
  };
  
  plan: {
    hasActivePlan: boolean;
    planExpiresAt?: string;
    availableRegions: string[]; // Доступные регионы
  };
}
```

## ✅ **Итоговые преимущества универсальной схемы:**

1. **🔄 Универсальность**: Одно API для Bot и Mini App
2. **📱 Mini App готовность**: Фото, карты, координаты, UI-friendly поля
3. **🌐 Масштабируемость**: Готовность к веб-версии и мобильным приложениям
4. **📊 Аналитика**: Детальная статистика по каналам доставки
5. **🔔 Мультиканальность**: Уведомления в разные каналы
6. **🎨 UI/UX**: displayName, iconUrl, sortOrder для красивого интерфейса
7. **📍 Геолокация**: Координаты для карт и геопозиционирования

**Схема готова к развертыванию полноценного API для экосистемы Telegram!** 