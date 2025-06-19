# Технический стек

## Основной стек
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Cache**: Redis 7.x
- **Message Queue**: RabbitMQ 3.12+

## Ключевые зависимости

### NestJS модули
```json
{
  "@nestjs/core": "^10.0.0",
  "@nestjs/common": "^10.0.0",
  "@nestjs/platform-express": "^10.0.0",
  "@nestjs/config": "^3.0.0",
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "@nestjs/microservices": "^10.0.0",
  "@nestjs/swagger": "^7.0.0"
}
```

### База данных и ORM
```json
{
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0"
}
```

### Валидация и трансформация
```json
{
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.0"
}
```

### Аутентификация
```json
{
  "passport": "^0.6.0",
  "passport-jwt": "^4.0.0",
  "passport-local": "^1.0.0",
  "bcryptjs": "^2.4.3"
}
```

### Redis и RabbitMQ
```json
{
  "ioredis": "^5.3.0",
  "amqplib": "^0.10.0",
  "@nestjs/bull": "^10.0.0",
  "bull": "^4.10.0"
}
```

### HTTP клиенты
```json
{
  "axios": "^1.4.0"
}
```

### Файлы и утилиты
```json
{
  "multer": "^1.4.5",
  "uuid": "^9.0.0",
  "date-fns": "^2.30.0"
}
```

## Переменные окружения

### База данных
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/telega"
```

### Redis
```env
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
```

### RabbitMQ
```env
RABBITMQ_URL="amqp://localhost:5672"
RABBITMQ_QUEUE_ACEPT_TG="acept_tg"
RABBITMQ_QUEUE_TELEGRAM="telegram_queue"
```

### JWT
```env
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
```

### Tinkoff
```env
TINKOFF_TERMINAL_KEY="your-terminal-key"
TINKOFF_SECRET_KEY="your-secret-key"
TINKOFF_API_URL="https://securepay.tinkoff.ru/v2/"
```

### Telegram
```env
TELEGRAM_BOT_TOKEN="your-bot-token"
```

## Структура портов
- **API Server**: 3000
- **PostgreSQL**: 5432
- **Redis**: 6379
- **RabbitMQ**: 5672 (AMQP), 15672 (Management)

## Docker конфигурация
Все сервисы запускаются через docker-compose:
- api (NestJS)
- postgres
- redis
- rabbitmq 