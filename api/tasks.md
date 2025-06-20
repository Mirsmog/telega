# TASKS - Telega Logistics API

## КРАТКИЙ ОБЗОР ПРОЕКТА

**Цель**: Маркетплейс логистических услуг - связывает заказчиков и исполнителей через Telegram Bot.

**Бизнес-модель**:
- Заказчики: 70₽ за размещение заказа
- Исполнители: 200-350₽ за доступ к заказам (по регионам)
- Тарифы: "Разовый" и "Оптимальный" (от 2000₽)

**Типы заказов**: A→B (перевозка), Place (работа в месте), People (перевозка людей)

**Текущее состояние**: 
- ✅ Docker конфигурация готова
- ✅ Package.json с зависимостями настроен
- ✅ TypeScript конфигурация готова
- ✅ Переменные окружения настроены
- ✅ ESLint + Prettier конфигурация настроена
- ✅ Исходная структура NestJS создана
- ✅ Prisma схема создана и база данных настроена (15 моделей)
- ✅ База данных заполнена тестовыми данными
- ✅ Базовые конфигурационные модули созданы
- ✅ Общие компоненты (decorators, guards, enums) созданы
- ❌ Бизнес-модули приложения не созданы

**Уровень сложности**: LEVEL 4 (архитектурно сложный проект с множеством модулей и интеграций)

## АРХИТЕКТУРНЫЙ АНАЛИЗ

### Структура базы данных (15 моделей):
1. **User** - Пользователи с ролями и балансами
2. **Region** - Регионы с тарифами
3. **UserRegion** - Связь пользователей с регионами и тарифными планами
4. **VehicleCategory/Type/Subtype** - Каталог транспорта (3-уровневая иерархия)
5. **UserVehicle** - Транспорт пользователей
6. **Order** - Заказы с полной детализацией
7. **OrderResponse** - Отклики исполнителей
8. **Payment** - Платежи через Tinkoff
9. **PaymentTransaction** - Детализация операций
10. **Session** - Сессии пользователей для Telegram Bot/WebApp
11. **Notification** - Система уведомлений
12. **AdminAction** - Журнал админских действий
13. **Broadcast** - Массовые рассылки
14. **Config** - Системные настройки

### Компоненты, требующие Creative Mode:
1. **Алгоритм поиска исполнителей** - сложная логика матчинга по регионам, типам транспорта, расстоянию
2. **Архитектура платежной системы** - интеграция с Tinkoff, управление балансами
3. **Система уведомлений** - архитектура очередей с множественными каналами доставки
4. **RabbitMQ интеграция** - обработка внешних команд
5. **Аналитика и метрики** - сложные запросы и агрегации
6. **Система сессий** - поддержка Telegram Bot и WebApp

## ПЛАН РАБОТ ПО ЭТАПАМ

### ЭТАП 1: CORE FOUNDATION (5 дней) 🔵 ГОТОВ К СТАРТУ

#### 1.1 Система аутентификации (3 дня)
**Цель**: Создать полноценную систему авторизации с JWT и Telegram Bot

**Компоненты для создания**:
- `src/auth/auth.module.ts` - Основной модуль аутентификации
- `src/auth/auth.service.ts` - Сервис аутентификации
- `src/auth/auth.controller.ts` - 4 endpoint'а (/login, /refresh, /logout, /validate)
- `src/auth/strategies/jwt.strategy.ts` - JWT стратегия
- `src/auth/strategies/telegram.strategy.ts` - Telegram Bot стратегия
- `src/auth/dto/` - DTO для аутентификации

**Ключевые задачи**:
- [x] Реализовать JWT authentication с refresh токенами
- [x] Интеграция с Telegram Bot API для авторизации
- [x] Создать middleware для проверки ролей (Customer, Executor, Admin)
- [x] Настроить Guards для защиты endpoints

#### 1.2 Модуль пользователей (2 дня)
**Цель**: CRUD операции с пользователями и управление профилями

**Компоненты для создания**:
- `src/users/users.module.ts` - Модуль пользователей
- `src/users/users.service.ts` - Бизнес-логика пользователей
- `src/users/users.controller.ts` - 8 endpoint'ов
- `src/users/dto/` - DTO для операций с пользователями

**Endpoints**:
- GET /users/profile - получить профиль
- PUT /users/profile - обновить профиль
- GET /users/balance - получить баланс
- POST /users/vehicles - добавить транспорт
- GET /users/vehicles - список транспорта
- PUT /users/vehicles/:id - обновить транспорт
- DELETE /users/vehicles/:id - удалить транспорт
- GET /users/regions - регионы пользователя

### ЭТАП 2: BUSINESS CORE (8 дней) 🔵 ГОТОВ К СТАРТУ

#### 2.1 Модуль регионов и транспорта (3 дня)
**Цель**: Справочники для системы матчинга

**Компоненты для создания**:
- `src/regions/regions.module.ts` - Модуль регионов
- `src/regions/regions.service.ts` - Сервис регионов с тарифами
- `src/regions/regions.controller.ts` - 3 endpoint'а
- `src/vehicles/vehicles.module.ts` - Модуль транспорта
- `src/vehicles/vehicles.service.ts` - Каталог транспорта
- `src/vehicles/vehicles.controller.ts` - 4 endpoint'а

**Ключевые задачи**:
- [x] CRUD регионов с тарифными планами
- [x] 3-уровневый каталог транспорта (категории → типы → подтипы)
- [x] API подключения исполнителей к регионам

#### 2.2 Базовый модуль заказов (5 дней)
**Цель**: Основной бизнес-объект системы

**Компоненты для создания**:
- `src/orders/orders.module.ts` - Модуль заказов
- `src/orders/orders.service.ts` - Бизнес-логика заказов
- `src/orders/orders.controller.ts` - 8 endpoint'ов
- `src/orders/dto/` - DTO для разных типов заказов
- `src/orders/entities/` - Entities для Prisma

**Endpoints**:
- POST /orders - создать заказ
- GET /orders - список заказов с фильтрами
- GET /orders/:id - детали заказа
- PUT /orders/:id - обновить заказ (только DRAFT)
- DELETE /orders/:id - удалить заказ
- POST /orders/:id/responses - откликнуться на заказ
- GET /orders/:id/responses - отклики на заказ
- PUT /orders/:id/status - изменить статус заказа

**Ключевые задачи**:
- [x] Валидация заказов разных типов (A→B, Place, People)
- [x] Система статусов заказов
- [x] API откликов исполнителей

### ЭТАП 3: ADVANCED BUSINESS LOGIC (12 дней) 🎨 CREATIVE PHASES

#### 3.1 Система поиска исполнителей (4 дня) 🎨 CREATIVE
**Цель**: Алгоритм матчинга заказчиков и исполнителей

**Компоненты для создания**:
- `src/orders/matching/order-matching.service.ts` - Алгоритм подбора
- `src/orders/matching/matching-criteria.interface.ts` - Критерии матчинга
- `src/orders/matching/distance-calculator.service.ts` - Расчет расстояний
- `src/orders/matching/notification-dispatcher.service.ts` - Рассылка уведомлений

**Алгоритм матчинга**:
1. Фильтрация по региону и подрегиону
2. Фильтрация по типу транспорта и характеристикам
3. Расчет расстояния от исполнителя до заказа
4. Рейтинг исполнителя и история выполнения
5. Активность и время последнего входа
6. Приоритизация по тарифному плану

#### 3.2 Админская модерация заказов (4 дня)
**Цель**: Система модерации для контроля качества

**Компоненты для создания**:
- `src/admin/moderation/moderation.module.ts` - Модуль модерации
- `src/admin/moderation/moderation.service.ts` - Логика модерации
- `src/admin/moderation/moderation.controller.ts` - 6 endpoint'ов
- `src/admin/moderation/dto/` - DTO для модерации

**Endpoints**:
- GET /admin/moderation/orders - заказы на модерации
- PUT /admin/moderation/orders/:id/approve - одобрить заказ
- PUT /admin/moderation/orders/:id/reject - отклонить заказ
- GET /admin/moderation/users - пользователи требующие проверки
- PUT /admin/moderation/users/:id/verify - верифицировать пользователя
- GET /admin/moderation/statistics - статистика модерации

#### 3.3 Интеграция платежей Tinkoff (4 дня) 🎨 CREATIVE
**Цель**: Полноценная платежная система

**Компоненты для создания**:
- `src/payments/payments.module.ts` - Модуль платежей
- `src/payments/payments.service.ts` - Основная логика платежей
- `src/payments/tinkoff/tinkoff.service.ts` - Интеграция с Tinkoff API
- `src/payments/payments.controller.ts` - 6 endpoint'ов
- `src/payments/webhook/tinkoff-webhook.controller.ts` - Webhook для уведомлений

**Endpoints**:
- POST /payments/create - создать платеж
- GET /payments/status/:id - статус платежа
- POST /payments/confirm - подтвердить платеж
- GET /payments/history - история платежей
- POST /payments/refund - возврат средств
- POST /payments/webhook/tinkoff - webhook от Tinkoff

### ЭТАП 4: COMMUNICATION & NOTIFICATIONS (8 дней) 🎨 CREATIVE PHASES

#### 4.1 Система уведомлений (4 дня) 🎨 CREATIVE
**Цель**: Многоканальная система уведомлений

**Компоненты для создания**:
- `src/notifications/notifications.module.ts` - Модуль уведомлений
- `src/notifications/notifications.service.ts` - Основная логика
- `src/notifications/channels/telegram.service.ts` - Telegram канал
- `src/notifications/channels/email.service.ts` - Email канал
- `src/notifications/channels/webapp.service.ts` - WebApp канал
- `src/notifications/queue/notification-queue.service.ts` - Redis очереди
- `src/notifications/notifications.controller.ts` - 2 endpoint'а

**Каналы уведомлений**:
1. Telegram Bot - основной канал
2. Telegram WebApp - для веб-интерфейса
3. Email - дополнительный канал

#### 4.2 Управление сессиями (2 дня)
**Цель**: Система сессий для Telegram Bot и WebApp

**Компоненты для создания**:
- `src/sessions/sessions.module.ts` - Модуль сессий
- `src/sessions/sessions.service.ts` - Логика сессий
- `src/sessions/sessions.controller.ts` - 4 endpoint'а
- `src/sessions/redis/session-storage.service.ts` - Redis хранилище

#### 4.2 Массовые рассылки (2 дня)
**Цель**: Система рассылок от администрации

**Компоненты для создания**:
- `src/admin/broadcasts/broadcasts.module.ts` - Модуль рассылок
- `src/admin/broadcasts/broadcasts.service.ts` - Логика рассылок
- `src/admin/broadcasts/broadcasts.controller.ts` - 3 endpoint'а

### ЭТАП 5: EXTERNAL INTEGRATIONS (6 дней) 🎨 CREATIVE PHASES

#### 5.1 RabbitMQ интеграция (4 дня) 🎨 CREATIVE
**Цель**: Интеграция с внешними системами

**Компоненты для создания**:
- `src/queues/queues.module.ts` - Модуль очередей
- `src/queues/consumers/order-commands.consumer.ts` - Обработка заказов
- `src/queues/consumers/user-commands.consumer.ts` - Обработка пользователей
- `src/queues/producers/events.producer.ts` - Отправка событий
- `src/queues/dto/` - DTO для команд

#### 5.2 Utility и мониторинг (2 дня)
**Цель**: Служебные компоненты системы

**Компоненты для создания**:
- `src/utils/utils.module.ts` - Утилиты
- `src/utils/health/health.controller.ts` - Health checks
- `src/utils/upload/upload.controller.ts` - Загрузка файлов
- `src/utils/version/version.controller.ts` - Версионирование

### ЭТАП 6: ADMIN PANEL (10 дней)

#### 6.1 Управление пользователями (3 дня)
**Компоненты для создания**:
- `src/admin/users/admin-users.module.ts`
- `src/admin/users/admin-users.service.ts`
- `src/admin/users/admin-users.controller.ts` - 6 endpoint'ов

#### 6.2 Управление конфигурацией (2 дня)
**Компоненты для создания**:
- `src/admin/config/admin-config.module.ts`
- `src/admin/config/admin-config.service.ts`
- `src/admin/config/admin-config.controller.ts` - 4 endpoint'а

#### 6.3 Управление каталогом транспорта (2 дня)
**Компоненты для создания**:
- `src/admin/vehicles/admin-vehicles.module.ts`
- `src/admin/vehicles/admin-vehicles.service.ts`
- `src/admin/vehicles/admin-vehicles.controller.ts` - 4 endpoint'а

#### 6.4 Аналитика и отчеты (3 дня) 🎨 CREATIVE
**Компоненты для создания**:
- `src/admin/analytics/analytics.module.ts`
- `src/admin/analytics/analytics.service.ts`
- `src/admin/analytics/analytics.controller.ts` - 2 endpoint'а
- `src/admin/analytics/reports/` - Генераторы отчетов

### ЭТАП 7: DEPLOYMENT & DOCUMENTATION (5 дней)

#### 7.1 Production конфигурация (2 дня)
- Docker multi-stage build
- Environment configurations
- Security configurations

#### 7.2 API документация (2 дня)
- Swagger документация для всех 52 endpoint'ов
- Postman коллекции
- Integration examples

#### 7.3 CI/CD и README (1 день)
- GitHub Actions
- Deployment scripts
- Comprehensive README

## ИТОГО: 54 дня (2.5 месяца)

## DEPENDENCIES И INTEGRATION POINTS

### Внешние зависимости:
1. **Tinkoff API** - платежи и webhook'и
2. **Telegram Bot API** - авторизация и уведомления
3. **Redis** - сессии и очереди уведомлений
4. **RabbitMQ** - внешние команды
5. **PostgreSQL** - основное хранилище данных

### Критические интеграционные точки:
1. **Auth ↔ Users** - система ролей и доступов
2. **Orders ↔ Matching** - алгоритм поиска исполнителей
3. **Payments ↔ Orders** - финансовые операции
4. **Notifications ↔ All modules** - система уведомлений
5. **Admin ↔ All modules** - централизованное управление

## КОМПОНЕНТЫ ТРЕБУЮЩИЕ CREATIVE MODE 🎨

1. **Алгоритм поиска исполнителей** (Этап 3.1) - сложная логика матчинга по множественным критериям
2. **Архитектура платежной системы** (Этап 3.3) - интеграция с Tinkoff, управление балансами, webhook'и
3. **Система уведомлений** (Этап 4.1) - архитектура очередей с множественными каналами доставки
4. **RabbitMQ интеграция** (Этап 5.1) - обработка внешних команд и событий
5. **Аналитика и метрики** (Этап 6.4) - сложные запросы и агрегации для отчетов

## СЛЕДУЮЩИЙ РЕЖИМ: 
- **CREATIVE MODE** для компонентов, помеченных 🎨
- **IMPLEMENT MODE** для стандартных CRUD операций

## ТЕКУЩИЙ СТАТУС: 
📋 **READY FOR IMPLEMENT MODE** - Этап 1 (Core Foundation) 