# Integration Modules - Интеграционные модули

## 📁 Структура integration modules

```
integration-modules/
├── rabbitmq-integration.md    # RabbitMQ интеграция
├── tinkoff-integration.md     # Tinkoff Payments API
├── redis-integration.md       # Redis для сессий и очередей
├── telegram-integration.md    # Telegram Bot API
└── README.md                 # Этот файл
```

## 🔗 Внешние интеграции

### RabbitMQ Integration
**Назначение**: Интеграция с внешними системами через очереди сообщений

**Ключевые особенности**:
- Подключение к существующим очередям `acept_tg` и `telegram_queue`
- Consumer для обработки внешних команд
- Логирование всех сообщений в БД
- Retry механизм для failed сообщений

**Конфигурация**:
```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'acept_tg',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
})
export class QueuesModule {}
```

### Tinkoff Integration
**Назначение**: Интеграция с Tinkoff Acquiring API для платежей

**Ключевые особенности**:
- Создание платежей через Tinkoff API
- Webhook обработка статусов платежей
- Автоматическое обновление балансов
- Проверка подписи webhook'ов

**API методы**:
```typescript
class TinkoffService {
  async createPayment(amount: number, orderId: string): Promise<PaymentResponse>
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus>
  async validateWebhook(data: any, token: string): boolean
}
```

### Redis Integration
**Назначение**: Кеширование и управление сессиями пользователей

**Ключевые особенности**:
- Сессии для Telegram Bot состояний
- Очереди уведомлений
- Кеширование частых запросов
- TTL для автоматической очистки

**Использование**:
```typescript
// Сохранение сессии
await this.redis.setex(`session:${userId}`, 3600, JSON.stringify(sessionData));

// Получение сессии
const sessionData = await this.redis.get(`session:${userId}`);

// Очистка сессии
await this.redis.del(`session:${userId}`);
```

### Telegram Integration
**Назначение**: Интеграция с Telegram Bot API для уведомлений

**Ключевые особенности**:
- Отправка уведомлений пользователям
- Массовые рассылки через админку
- Валидация Telegram WebApp данных
- Rate limiting для избежания блокировок

## 🔧 Общие принципы интеграций

### Error Handling
Все интеграции используют единую систему обработки ошибок:
```typescript
try {
  const result = await this.externalService.call();
  return result;
} catch (error) {
  this.logger.error('External service error', error);
  throw new ServiceUnavailableException('External service temporarily unavailable');
}
```

### Retry Mechanism
Для критических интеграций реализован retry механизм:
```typescript
@Retryable({
  attempts: 3,
  delay: 1000,
  backoff: 'exponential',
})
async callExternalService() {
  // Вызов внешнего сервиса
}
```

### Logging
Все внешние вызовы логируются:
```typescript
this.logger.log(`Calling external service: ${serviceName}`, {
  method: 'POST',
  url: apiUrl,
  payload: sanitizedPayload,
});
```

### Health Checks
Каждая интеграция имеет health check:
```typescript
@Get('health/tinkoff')
async checkTinkoffHealth() {
  try {
    await this.tinkoffService.ping();
    return { status: 'healthy', service: 'tinkoff' };
  } catch (error) {
    return { status: 'unhealthy', service: 'tinkoff', error: error.message };
  }
}
```

## 📊 Мониторинг интеграций

### Метрики
- Количество успешных/неуспешных вызовов
- Время ответа внешних сервисов
- Размер очередей сообщений
- Количество retry попыток

### Алерты
- Недоступность внешних сервисов
- Превышение времени ответа
- Накопление сообщений в очередях
- Критические ошибки интеграций

## 🔐 Безопасность интеграций

### API Keys Management
Все API ключи хранятся в переменных окружения:
```env
TINKOFF_TERMINAL_KEY=your-terminal-key
TINKOFF_SECRET_KEY=your-secret-key
TELEGRAM_BOT_TOKEN=your-bot-token
RABBITMQ_URL=amqp://user:pass@localhost:5672
```

### Webhook Validation
Все webhook'и валидируются:
```typescript
private validateWebhookSignature(data: any, signature: string): boolean {
  const expectedSignature = this.generateSignature(data);
  return signature === expectedSignature;
}
```

### Rate Limiting
Для внешних API применяется rate limiting:
```typescript
@Throttle(100, 60) // 100 requests per minute
async sendTelegramMessage() {
  // Отправка сообщения
}
```

## 🚀 Deployment Considerations

### Environment Variables
```env
# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE_ACEPT_TG=acept_tg
RABBITMQ_QUEUE_TELEGRAM=telegram_queue

# Tinkoff
TINKOFF_TERMINAL_KEY=your-terminal-key
TINKOFF_SECRET_KEY=your-secret-key
TINKOFF_API_URL=https://securepay.tinkoff.ru/v2/

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_API_URL=https://api.telegram.org/bot
```

### Docker Services
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
```

### Network Configuration
- Все внешние сервисы должны быть доступны из production сети
- Webhook endpoints должны быть доступны извне
- Rate limiting на nginx уровне для webhook'ов 