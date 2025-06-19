# Memory Bank для API разработчика

## 🎯 Цель
Реализация NestJS Backend API для Telega Logistics с полным админским функционалом.

## 📋 Ключевая информация
- **Стек**: NestJS + PostgreSQL + Prisma + Redis + RabbitMQ
- **Сложность**: Level 4 (разделение монолита + смена стека + полная админка)
- **Время**: 65 дней (3 месяца)
- **Endpoints**: 52 API endpoint'а

## 📁 Структура Memory Bank

### 🏗️ Архитектура и планирование
- `project-overview.md` - Обзор проекта и бизнес-логика
- `technical-stack.md` - Технический стек и зависимости
- `implementation-roadmap.md` - 17 этапов реализации
- `database-schema.md` - Полная Prisma схема
- `project-structure.md` - Структура NestJS проекта

### 🔗 API спецификация
- `api-endpoints.md` - Все 52 endpoint'а с примерами
- `dto-specifications.md` - DTO и валидация
- `auth-system.md` - JWT аутентификация и guards

### 🔧 Реализация модулей
- `core-modules/` - Users, Orders, Payments, Auth
- `admin-modules/` - Полный админский функционал
- `integration-modules/` - RabbitMQ, Tinkoff, Redis

### 🧪 Тестирование и деплой
- `testing-strategy.md` - Unit, Integration, E2E тесты
- `deployment-config.md` - Docker, Environment variables

## ⚠️ Критически важные особенности

### 1. Ручная модерация заказов
Каждый заказ проходит через админа: `CREATED → PENDING_APPROVAL → APPROVED/REJECTED → SEARCHING`

### 2. Система настроек
Динамические настройки в БД (тарифы, ссылки, конфиг) - используется в 15+ местах

### 3. RabbitMQ интеграция
Внешние системы отправляют команды через очереди `acept_tg` и `telegram_queue`

### 4. Массовые рассылки
Админ может отправлять сообщения с изображениями всем пользователям

## 🚀 Начало работы
1. Читай `project-overview.md` для понимания бизнес-логики
2. Изучи `implementation-roadmap.md` для последовательности разработки
3. Используй `database-schema.md` для настройки Prisma
4. Следуй `api-endpoints.md` для реализации endpoints

## 📞 Важные детали
- Никакой обратной совместимости с MongoDB
- Фокус только на Backend (без frontend)
- Простота и минимализм в реализации
- Все архитектурные решения уже приняты 