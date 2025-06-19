# API Endpoints Specification

## 🔧 NestJS API Design для Telega Logistics

### Базовая конфигурация
- **Base URL**: `https://api.telega-logistics.ru`
- **API Version**: `v1`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

## 🔐 Authentication Endpoints

### POST `/api/v1/auth/telegram-bot`
Аутентификация пользователя Telegram Bot

```typescript
// Request
{
  "userId": 123456789,
  "username": "user123",
  "firstName": "Иван",
  "lastName": "Петров"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "userId": 123456789,
      "username": "user123",
      "name": "Иван Петров",
      "phone": "+79123456789",
      "roles": ["CUSTOMER", "PERFORMER"],
      "customerBalance": "500.00",
      "performerBalance": "1000.00"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "isNewUser": false
  }
}
```

### POST `/api/v1/auth/telegram-webapp`
Аутентификация для Telegram Mini App

```typescript
// Request
{
  "initData": "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397..."
}

// Response
{
  "success": true,
  "data": {
    "user": { /* User object */ },
    "tokens": { /* Tokens object */ }
  }
}
```

### POST `/api/v1/auth/refresh`
Обновление токенов

```typescript
// Request
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 👥 Users Endpoints

### GET `/api/v1/users/me`
Получение профиля текущего пользователя

```typescript
// Headers: Authorization: Bearer {token}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 123456789,
    "username": "user123",
    "name": "Иван Петров",
    "phone": "+79123456789",
    "roles": ["CUSTOMER", "PERFORMER"],
    "customerBalance": "500.00",
    "performerBalance": "1000.00",
    "rating": 5,
    "refCode": "ABC123",
    "mainLimit": 2,
    "settingLimit": 2,
    "createdAt": "2024-01-01T00:00:00Z",
    "vehicles": [
      {
        "id": 1,
        "category": "Грузовой",
        "type": "Фургон",
        "subtype": "До 1.5т",
        "brand": "Ford",
        "model": "Transit",
        "number": "А123БВ77",
        "isActive": true
      }
    ],
    "regions": [
      {
        "regionCode": "77",
        "regionName": "Москва",
        "subregions": ["Центральный", "Северный"],
        "isActive": true
      }
    ]
  }
}
```

### PUT `/api/v1/users/me`
Обновление профиля пользователя

```typescript
// Request
{
  "name": "Иван Сидоров",
  "phone": "+79876543210"
}

// Response
{
  "success": true,
  "data": { /* Updated user object */ }
}
```

### POST `/api/v1/users/roles`
Добавление роли пользователю

```typescript
// Request
{
  "role": "PERFORMER" // или "CUSTOMER"
}

// Response
{
  "success": true,
  "data": {
    "roles": ["CUSTOMER", "PERFORMER"]
  }
}
```

### GET `/api/v1/users/balance`
Получение баланса пользователя

```typescript
// Response
{
  "success": true,
  "data": {
    "customerBalance": "500.00",
    "performerBalance": "1000.00",
    "currency": "RUB"
  }
}
```

### GET `/api/v1/users/referrals`
Получение реферальной информации

```typescript
// Response
{
  "success": true,
  "data": {
    "refCode": "ABC123",
    "referralsCount": 5,
    "referralBalance": "250.00",
    "totalEarned": "1250.00",
    "referrals": [
      {
        "name": "Алексей",
        "joinedAt": "2024-01-15T10:30:00Z",
        "earned": "50.00"
      }
    ]
  }
}
```

## 📦 Orders Endpoints

### POST `/api/v1/orders`
Создание нового заказа

```typescript
// Request
{
  "orderType": "A_B", // "A_B" | "PLACE" | "PEOPLE"
  "vehicleType": "Грузовой",
  "vehicleSubtype": "До 3.5т",
  "vehicleAmount": 1,
  "regionCode": "77",
  "subregionCode": "1",
  "address": "ул. Пушкина, д. 10",
  "dropAddress": "ул. Ленина, д. 5", // только для A_B
  "distance": 15, // в км
  "passengerCount": 2, // только для PEOPLE
  "cargoInfo": "Мебель", // описание груза
  "requirements": "Аккуратная погрузка",
  "price": "2500.00", // опционально
  "scheduledDate": "2024-02-01",
  "scheduledTime": "14:00"
}

// Response
{
  "success": true,
  "data": {
    "id": 123,
    "orderNumber": "ORD-2024-001",
    "orderType": "A_B",
    "status": "CREATED",
    "customerId": 1,
    "vehicleType": "Грузовой",
    "vehicleSubtype": "До 3.5т",
    "regionCode": "77",
    "address": "ул. Пушкина, д. 10",
    "dropAddress": "ул. Ленина, д. 5",
    "distance": 15,
    "cargoInfo": "Мебель",
    "requirements": "Аккуратная погрузка",
    "price": "2500.00",
    "scheduledDate": "2024-02-01T14:00:00Z",
    "createdAt": "2024-01-20T10:30:00Z",
    "customer": {
      "name": "Иван Петров",
      "phone": "+79123456789",
      "rating": 5
    }
  }
}
```

### GET `/api/v1/orders`
Получение списка заказов

```typescript
// Query params:
// ?page=1&limit=20&status=SEARCHING&region=77&orderType=A_B&sortBy=createdAt&sortOrder=desc

// Response
{
  "success": true,
  "data": [
    {
      "id": 123,
      "orderNumber": "ORD-2024-001",
      "orderType": "A_B",
      "status": "SEARCHING",
      "regionCode": "77",
      "address": "ул. Пушкина, д. 10",
      "price": "2500.00",
      "createdAt": "2024-01-20T10:30:00Z",
      "customer": {
        "name": "Иван П.",
        "rating": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET `/api/v1/orders/:id`
Получение детальной информации о заказе

```typescript
// Response
{
  "success": true,
  "data": {
    "id": 123,
    "orderNumber": "ORD-2024-001",
    "orderType": "A_B",
    "status": "IN_WORK",
    "customerId": 1,
    "performerId": 2,
    "vehicleType": "Грузовой",
    "vehicleSubtype": "До 3.5т",
    "regionCode": "77",
    "address": "ул. Пушкина, д. 10",
    "dropAddress": "ул. Ленина, д. 5",
    "distance": 15,
    "cargoInfo": "Мебель",
    "requirements": "Аккуратная погрузка",
    "price": "2500.00",
    "scheduledDate": "2024-02-01T14:00:00Z",
    "createdAt": "2024-01-20T10:30:00Z",
    "customer": {
      "name": "Иван Петров",
      "phone": "+79123456789",
      "rating": 5
    },
    "performer": {
      "name": "Алексей Сидоров",
      "phone": "+79876543210",
      "rating": 4,
      "vehicle": {
        "brand": "Ford",
        "model": "Transit",
        "number": "А123БВ77"
      }
    },
    "history": [
      {
        "action": "ORDER_CREATED",
        "createdAt": "2024-01-20T10:30:00Z",
        "details": { "status": "CREATED" }
      },
      {
        "action": "PERFORMER_ASSIGNED",
        "createdAt": "2024-01-20T11:15:00Z",
        "details": { "performerId": 2 }
      }
    ]
  }
}
```

### POST `/api/v1/orders/:id/take`
Взятие заказа исполнителем

```typescript
// Request
{
  "vehicleId": 1,
  "proposedPrice": "2000.00" // опционально
}

// Response
{
  "success": true,
  "data": {
    "status": "IN_WORK",
    "performerId": 2,
    "message": "Заказ успешно взят"
  }
}
```

### PUT `/api/v1/orders/:id/status`
Обновление статуса заказа

```typescript
// Request
{
  "status": "COMPLETED",
  "comment": "Заказ выполнен успешно"
}

// Response
{
  "success": true,
  "data": {
    "status": "COMPLETED",
    "updatedAt": "2024-01-20T16:30:00Z"
  }
}
```

### POST `/api/v1/orders/:id/cancel`
Отмена заказа

```typescript
// Request
{
  "reason": "Изменились планы",
  "refund": true
}

// Response
{
  "success": true,
  "data": {
    "status": "CANCELLED",
    "refundAmount": "70.00",
    "message": "Заказ отменен, средства возвращены"
  }
}
```

### GET `/api/v1/orders/available`
Получение доступных заказов для исполнителя

```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": 125,
      "orderNumber": "ORD-2024-003",
      "orderType": "A_B",
      "status": "SEARCHING",
      "regionCode": "77",
      "subregionCode": "1",
      "address": "ул. Тверская, д. 15",
      "dropAddress": "ул. Арбат, д. 20",
      "distance": 8,
      "cargoInfo": "Коробки",
      "vehicleType": "Грузовой",
      "vehicleSubtype": "До 1.5т",
      "price": "1500.00",
      "scheduledDate": "2024-02-02T09:00:00Z",
      "createdAt": "2024-01-21T08:15:00Z",
      "customer": {
        "name": "Мария С.",
        "rating": 5
      },
      "distance_from_me": 3.2 // расстояние до исполнителя в км
    }
  ],
  "pagination": { /* ... */ }
}
```

### GET `/api/v1/orders/my`
Получение заказов пользователя

```typescript
// Query: ?role=customer&status=IN_WORK

// Response
{
  "success": true,
  "data": {
    "as_customer": [
      {
        "id": 123,
        "orderNumber": "ORD-2024-001",
        "status": "IN_WORK",
        "orderType": "A_B",
        "address": "ул. Пушкина, д. 10",
        "price": "2500.00",
        "createdAt": "2024-01-20T10:30:00Z",
        "performer": {
          "name": "Алексей С.",
          "phone": "+79876543210"
        }
      }
    ],
    "as_performer": [
      {
        "id": 124,
        "orderNumber": "ORD-2024-002",
        "status": "COMPLETED",
        "orderType": "PLACE",
        "address": "ул. Ленина, д. 25",
        "price": "1800.00",
        "createdAt": "2024-01-19T14:20:00Z",
        "customer": {
          "name": "Анна П.",
          "phone": "+79111111111"
        }
      }
    ]
  }
}
```

## 💳 Payments Endpoints

### POST `/api/v1/payments/init`
Инициация платежа

```typescript
// Request
{
  "amount": "1000.00",
  "type": "TOPUP", // "TOPUP" | "ORDER_PAYMENT"
  "orderId": 123 // опционально, только для ORDER_PAYMENT
}

// Response
{
  "success": true,
  "data": {
    "transactionId": 456,
    "paymentUrl": "https://securepay.tinkoff.ru/...",
    "externalId": "uuid-string",
    "amount": "1000.00",
    "status": "PENDING"
  }
}
```

### POST `/api/v1/payments/webhook`
Webhook для обработки уведомлений от Tinkoff

```typescript
// Request от Tinkoff
{
  "TerminalKey": "1234567890",
  "OrderId": "uuid-string",
  "Success": true,
  "Status": "CONFIRMED",
  "PaymentId": "12345",
  "ErrorCode": "0",
  "Amount": 100000,
  "Token": "signature"
}

// Response
{
  "success": true
}
```

### GET `/api/v1/payments/history`
История платежей пользователя

```typescript
// Query: ?page=1&limit=20&type=TOPUP&status=COMPLETED

// Response
{
  "success": true,
  "data": [
    {
      "id": 456,
      "type": "TOPUP",
      "amount": "1000.00",
      "status": "COMPLETED",
      "paymentMethod": "tinkoff",
      "description": "Пополнение баланса",
      "createdAt": "2024-01-20T09:15:00Z",
      "processedAt": "2024-01-20T09:16:30Z"
    },
    {
      "id": 457,
      "type": "ORDER_PAYMENT",
      "amount": "-200.00",
      "status": "COMPLETED",
      "orderId": 123,
      "description": "Оплата за доступ к заказу ORD-2024-001",
      "createdAt": "2024-01-20T11:00:00Z",
      "processedAt": "2024-01-20T11:00:01Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

### GET `/api/v1/payments/:id`
Получение информации о платеже

```typescript
// Response
{
  "success": true,
  "data": {
    "id": 456,
    "type": "TOPUP",
    "amount": "1000.00",
    "status": "COMPLETED",
    "paymentMethod": "tinkoff",
    "externalId": "uuid-string",
    "description": "Пополнение баланса",
    "metadata": {
      "terminal_key": "1234567890",
      "payment_id": "12345"
    },
    "createdAt": "2024-01-20T09:15:00Z",
    "processedAt": "2024-01-20T09:16:30Z"
  }
}
```

## 🗺️ Regions Endpoints

### GET `/api/v1/regions`
Получение списка всех регионов

```typescript
// Response
{
  "success": true,
  "data": [
    {
      "code": "77",
      "name": "Москва",
      "subregions": [
        "Центральный административный округ",
        "Северный административный округ",
        "Южный административный округ"
      ],
      "pricing": {
        "single_tariff": "300.00",
        "optimal_tariff": "200.00"
      }
    },
    {
      "code": "33",
      "name": "Владимирская область",
      "subregions": [
        "г. Владимир",
        "Петушинский район",
        "Суздальский район"
      ],
      "pricing": {
        "single_tariff": "250.00",
        "optimal_tariff": "170.00"
      }
    }
  ]
}
```

### GET `/api/v1/regions/:code`
Получение информации о регионе

```typescript
// Response
{
  "success": true,
  "data": {
    "code": "77",
    "name": "Москва",
    "subregions": [
      "Центральный административный округ",
      "Северный административный округ",
      "Южный административный округ"
    ],
    "pricing": {
      "single_tariff": "300.00",
      "optimal_tariff": "200.00"
    }
  }
}
```

### PUT `/api/v1/users/regions`
Обновление активных регионов пользователя

```typescript
// Request
{
  "regions": [
    {
      "regionCode": "77",
      "subregions": ["Центральный", "Северный"],
      "isActive": true
    },
    {
      "regionCode": "33",
      "subregions": ["г. Владимир"],
      "isActive": true
    }
  ]
}

// Response
{
  "success": true,
  "data": {
    "regions": [
      {
        "regionCode": "77",
        "regionName": "Москва",
        "subregions": ["Центральный", "Северный"],
        "isActive": true
      },
      {
        "regionCode": "33",
        "regionName": "Владимирская область",
        "subregions": ["г. Владимир"],
        "isActive": true
      }
    ]
  }
}
```

## 🚗 Vehicles Endpoints

### POST `/api/v1/vehicles`
Добавление транспорта

```typescript
// Request
{
  "category": "Грузовой",
  "type": "Фургон",
  "subtype": "До 3.5т",
  "brand": "Ford",
  "model": "Transit",
  "number": "А123БВ77"
}

// Response
{
  "success": true,
  "data": {
    "id": 1,
    "category": "Грузовой",
    "type": "Фургон",
    "subtype": "До 3.5т",
    "brand": "Ford",
    "model": "Transit",
    "number": "А123БВ77",
    "isActive": true,
    "createdAt": "2024-01-20T12:00:00Z"
  }
}
```

### GET `/api/v1/vehicles`
Получение списка транспорта пользователя

```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category": "Грузовой",
      "type": "Фургон",
      "subtype": "До 3.5т",
      "brand": "Ford",
      "model": "Transit",
      "number": "А123БВ77",
      "isActive": true,
      "currentOrderId": null,
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ]
}
```

### PUT `/api/v1/vehicles/:id`
Обновление информации о транспорте

```typescript
// Request
{
  "brand": "Mercedes",
  "model": "Sprinter",
  "isActive": false
}

// Response
{
  "success": true,
  "data": { /* Updated vehicle object */ }
}
```

### DELETE `/api/v1/vehicles/:id`
Удаление транспорта

```typescript
// Response
{
  "success": true,
  "message": "Транспорт удален"
}
```

### GET `/api/v1/vehicles/categories`
Получение справочника категорий транспорта

```typescript
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Грузовой",
      "types": [
        {
          "id": 1,
          "name": "Фургон",
          "subtypes": [
            { "id": 1, "name": "До 1.5т" },
            { "id": 2, "name": "До 3.5т" },
            { "id": 3, "name": "До 5т" }
          ]
        },
        {
          "id": 2,
          "name": "Бортовой",
          "subtypes": [
            { "id": 4, "name": "До 10т" },
            { "id": 5, "name": "До 20т" }
          ]
        }
      ]
    },
    {
      "id": 2,
      "name": "Пассажирский",
      "types": [
        {
          "id": 3,
          "name": "Легковой",
          "subtypes": [
            { "id": 6, "name": "Эконом" },
            { "id": 7, "name": "Комфорт" }
          ]
        }
      ]
    }
  ]
}
```

## 📨 Notifications Endpoints

### POST `/api/v1/notifications/send`
Отправка уведомления (внутренний endpoint)

```typescript
// Request
{
  "userId": 123456789,
  "type": "ORDER_AVAILABLE",
  "message": "Новый заказ доступен!",
  "data": {
    "orderId": 123,
    "orderNumber": "ORD-2024-001"
  }
}

// Response
{
  "success": true,
  "data": {
    "messageId": "msg_456",
    "status": "SENT"
  }
}
```

### GET `/api/v1/notifications/templates`
Получение шаблонов уведомлений

```typescript
// Response
{
  "success": true,
  "data": [
    {
      "type": "ORDER_AVAILABLE",
      "template": "🆕 Новый заказ доступен!\n📍 {{address}}\n💰 {{price}} руб.\n\n📝 {{description}}",
      "buttons": [
        { "text": "Посмотреть", "callback_data": "order_{{orderId}}" },
        { "text": "Взять заказ", "callback_data": "take_{{orderId}}" }
      ]
    },
    {
      "type": "ORDER_TAKEN",
      "template": "✅ Ваш заказ №{{orderNumber}} взят!\n👤 Исполнитель: {{performerName}}\n📞 {{performerPhone}}",
      "buttons": [
        { "text": "Связаться", "url": "tel:{{performerPhone}}" }
      ]
    }
  ]
}
```

## 📊 Analytics & Admin Endpoints

### GET `/api/v1/admin/stats`
Получение статистики системы (только для админов)

```typescript
// Response
{
  "success": true,
  "data": {
    "users": {
      "total": 15420,
      "customers": 12350,
      "performers": 8970,
      "new_today": 45
    },
    "orders": {
      "total": 45680,
      "created_today": 125,
      "in_progress": 89,
      "completed_today": 156
    },
    "financial": {
      "total_revenue": "2456789.50",
      "revenue_today": "15680.00",
      "pending_payments": "45230.00"
    }
  }
}
```

### GET `/api/v1/sessions/state`
Получение состояния пользователя (для FSM)

```typescript
// Query: ?clientType=bot

// Response
{
  "success": true,
  "data": {
    "state": "AWAITING_NAME",
    "data": {
      "role": "CUSTOMER",
      "step": 1
    },
    "expiresAt": "2024-01-20T18:00:00Z"
  }
}
```

### PUT `/api/v1/sessions/state`
Обновление состояния пользователя

```typescript
// Request
{
  "clientType": "bot",
  "state": "AWAITING_PHONE",
  "data": {
    "role": "CUSTOMER",
    "name": "Иван Петров",
    "step": 2
  },
  "ttl": 3600 // секунды
}

// Response
{
  "success": true,
  "data": {
    "state": "AWAITING_PHONE",
    "expiresAt": "2024-01-20T18:00:00Z"
  }
}
```

## 🔧 Utility Endpoints

### GET `/api/v1/health`
Health check endpoint

```typescript
// Response
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2024-01-20T15:30:00Z",
    "uptime": 86400,
    "version": "1.0.0",
    "services": {
      "database": "OK",
      "redis": "OK",
      "tinkoff_api": "OK"
    }
  }
}
```

### GET `/api/v1/version`
Получение версии API

```typescript
// Response
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "build": "2024.01.20-1543",
    "environment": "production"
  }
}
```

## 🚨 Error Responses

### Стандартный формат ошибок

```typescript
// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "phone",
      "reason": "Invalid phone number format"
    }
  },
  "meta": {
    "timestamp": "2024-01-20T15:30:00Z",
    "requestId": "req_123456789"
  }
}

// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}

// 403 Forbidden
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Order not found"
  }
}

// 429 Too Many Requests
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "limit": 100,
      "window": "1 hour",
      "retryAfter": 3600
    }
  }
}

// 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```

## 📝 DTO Validation Examples

### NestJS DTO с валидацией

```typescript
// CreateOrderDto
export class CreateOrderDto {
  @IsEnum(OrderType)
  @ApiProperty({ enum: OrderType })
  orderType: OrderType;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @ApiProperty()
  vehicleType: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @ApiProperty()
  vehicleSubtype: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @ApiProperty()
  vehicleAmount: number;

  @IsString()
  @Length(2, 2)
  @ApiProperty()
  regionCode: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  address: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty({ required: false })
  dropAddress?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @ApiProperty({ required: false })
  distance?: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  @ApiProperty({ required: false })
  price?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  scheduledDate?: string;

  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  @ApiProperty({ required: false })
  scheduledTime?: string;
}
```