# API Endpoints - 52 endpoint'а

## Базовая конфигурация
- **Base URL**: `/api/v1`
- **Auth**: JWT Bearer Token
- **Content-Type**: `application/json`

## 🔐 Auth Module (4 endpoints)

### POST `/auth/telegram-bot`
Аутентификация Telegram Bot пользователя
```json
// Request: { "userId": 123456789, "username": "user123", "firstName": "Иван" }
// Response: { "user": {...}, "tokens": {...}, "isNewUser": false }
```

### POST `/auth/telegram-webapp`
Аутентификация Telegram Mini App
```json
// Request: { "initData": "query_id=AAHdF6IQ..." }
```

### POST `/auth/refresh`
Обновление токенов
```json
// Request: { "refreshToken": "..." }
```

### POST `/auth/logout`
Выход из системы

## 👥 Users Module (8 endpoints)

### GET `/users/me`
Профиль текущего пользователя

### PUT `/users/me`
Обновление профиля

### POST `/users/roles`
Добавление роли (CUSTOMER/PERFORMER)

### GET `/users/balance`
Баланс пользователя

### GET `/users/referrals`
Реферальная информация

### POST `/users/vehicles`
Добавление транспорта

### PUT `/users/vehicles/:id`
Обновление транспорта

### DELETE `/users/vehicles/:id`
Удаление транспорта

## 📦 Orders Module (8 endpoints)

### POST `/orders`
Создание заказа (статус CREATED)
```json
// Request: { "type": "A_TO_B", "title": "Перевозка", "fromAddress": "...", "price": 1000 }
```

### GET `/orders`
Список заказов с фильтрами

### GET `/orders/:id`
Детали заказа

### PUT `/orders/:id`
Обновление заказа (только CREATED)

### DELETE `/orders/:id`
Отмена заказа

### POST `/orders/:id/respond`
Отклик исполнителя на заказ

### PUT `/orders/:id/accept-response`
Принятие отклика заказчиком

### GET `/orders/my`
Мои заказы (созданные + отклики)

## 💳 Payments Module (6 endpoints)

### POST `/payments/create`
Создание платежа Tinkoff
```json
// Request: { "tariffType": "ONE_TIME", "regionId": 1 }
// Response: { "paymentId": "123", "paymentUrl": "https://..." }
```

### POST `/payments/webhook`
Webhook от Tinkoff

### GET `/payments/history`
История платежей

### GET `/payments/tariffs`
Доступные тарифы по регионам

### POST `/payments/balance/add`
Пополнение баланса

### GET `/payments/balance/history`
История операций с балансом

## 🏢 Regions Module (3 endpoints)

### GET `/regions`
Список всех регионов с тарифами

### GET `/regions/:id`
Детали региона

### GET `/regions/:id/tariffs`
Тарифы региона

## 🚗 Vehicles Module (4 endpoints)

### GET `/vehicles/categories`
Категории транспорта

### GET `/vehicles/types`
Типы транспорта по категории

### GET `/vehicles/subtypes`
Подтипы транспорта по типу

### GET `/vehicles/catalog`
Полный каталог транспорта

## 🔔 Notifications Module (2 endpoints)

### GET `/notifications`
Список уведомлений пользователя

### PUT `/notifications/:id/read`
Отметка уведомления как прочитанного

## 🎮 Sessions Module (4 endpoints)

### GET `/sessions/current`
Текущая сессия пользователя

### PUT `/sessions/current`
Обновление данных сессии

### DELETE `/sessions/current`
Очистка текущей сессии

### POST `/sessions/cleanup`
Очистка старых сессий

## 🔧 Utils Module (3 endpoints)

### GET `/utils/health`
Проверка здоровья API

### GET `/utils/version`
Версия API

### POST `/utils/upload`
Загрузка файлов

---

## 🛡️ Admin Module (25 endpoints)

### Admin Orders (6 endpoints)

#### GET `/admin/orders/pending`
Заказы на модерации (статус PENDING_APPROVAL)

#### POST `/admin/orders/:id/approve`
Одобрение заказа
```json
// Request: { "comment": "Заказ соответствует требованиям" }
```

#### POST `/admin/orders/:id/reject`
Отклонение заказа
```json
// Request: { "reason": "Некорректные данные", "comment": "..." }
```

#### GET `/admin/orders/moderated`
История модерации заказов

#### GET `/admin/orders/stats`
Статистика по заказам

#### POST `/admin/orders/bulk-action`
Массовые операции с заказами

### Admin Users (6 endpoints)

#### GET `/admin/users`
Список всех пользователей с фильтрами

#### GET `/admin/users/:id`
Детали пользователя

#### POST `/admin/users/:id/block`
Блокировка пользователя
```json
// Request: { "reason": "Нарушение правил", "duration": "permanent" }
```

#### POST `/admin/users/:id/unblock`
Разблокировка пользователя

#### PUT `/admin/users/:id/balance`
Изменение баланса пользователя
```json
// Request: { "amount": 1000, "type": "add", "comment": "Компенсация" }
```

#### GET `/admin/users/stats`
Статистика по пользователям

### Admin Config (4 endpoints)

#### GET `/admin/config`
Все настройки системы

#### PUT `/admin/config/:key`
Обновление настройки
```json
// Request: { "value": { "amount": 80 }, "comment": "Повышение цены заказа" }
```

#### GET `/admin/config/history`
История изменений настроек

#### POST `/admin/config/reset`
Сброс настроек к умолчанию

### Admin Vehicles (4 endpoints)

#### POST `/admin/vehicles/categories`
Создание категории транспорта

#### PUT `/admin/vehicles/categories/:id`
Обновление категории

#### DELETE `/admin/vehicles/categories/:id`
Удаление категории

#### GET `/admin/vehicles/management`
Управление каталогом транспорта

### Admin Broadcasts (3 endpoints)

#### POST `/admin/broadcasts`
Создание рассылки
```json
// Request: { "title": "Обновление", "message": "...", "targetType": "ALL_USERS", "image": "file" }
```

#### GET `/admin/broadcasts`
История рассылок

#### POST `/admin/broadcasts/:id/send`
Отправка рассылки

### Admin Analytics (2 endpoints)

#### GET `/admin/analytics/dashboard`
Основная аналитика (заказы, пользователи, платежи)

#### GET `/admin/analytics/reports`
Детальные отчеты с фильтрами

## Статусы ответов
- `200` - Успешно
- `201` - Создано
- `400` - Неверный запрос
- `401` - Не авторизован
- `403` - Нет доступа
- `404` - Не найдено
- `500` - Ошибка сервера

## Общий формат ответа
```json
{
  "success": true,
  "data": { /* данные */ },
  "message": "Операция выполнена успешно",
  "timestamp": "2024-01-01T00:00:00Z"
}
``` 