# Testing Strategy - Стратегия тестирования

## 🎯 Цель тестирования
Обеспечить 80%+ покрытие кода тестами и надежность всех критических функций API.

## 📊 Типы тестов

### Unit Tests (70% покрытия)
**Назначение**: Тестирование отдельных методов сервисов

**Структура**:
```
test/unit/
├── auth/
│   ├── auth.service.spec.ts
│   └── jwt.strategy.spec.ts
├── users/
│   └── users.service.spec.ts
├── orders/
│   ├── orders.service.spec.ts
│   └── order-matching.service.spec.ts
├── payments/
│   ├── payments.service.spec.ts
│   └── tinkoff.service.spec.ts
└── admin/
    ├── admin-orders.service.spec.ts
    ├── admin-users.service.spec.ts
    └── admin-config.service.spec.ts
```

**Пример Unit теста**:
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  describe('authenticateTelegramBot', () => {
    it('should create new user if not exists', async () => {
      // Arrange
      const authDto = {
        userId: 123456789,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      };

      prisma.user.findUnique = jest.fn().mockResolvedValue(null);
      prisma.user.create = jest.fn().mockResolvedValue({
        id: 1,
        telegramId: '123456789',
        roles: [{ role: 'CUSTOMER' }],
      });

      jwt.sign = jest.fn().mockReturnValue('mock-token');

      // Act
      const result = await service.authenticateTelegramBot(authDto);

      // Assert
      expect(result.isNewUser).toBe(true);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.tokens.accessToken).toBe('mock-token');
    });

    it('should throw error if user is blocked', async () => {
      // Arrange
      prisma.user.findUnique = jest.fn().mockResolvedValue({
        isBlocked: true,
      });

      // Act & Assert
      await expect(
        service.authenticateTelegramBot({ userId: 123 })
      ).rejects.toThrow('User is blocked');
    });
  });
});
```

### Integration Tests (20% покрытия)
**Назначение**: Тестирование взаимодействия между модулями

**Структура**:
```
test/integration/
├── auth-flow.spec.ts         # Полный flow аутентификации
├── order-creation.spec.ts    # Создание и модерация заказа
├── payment-flow.spec.ts      # Создание и обработка платежа
├── admin-moderation.spec.ts  # Админская модерация
└── external-integrations.spec.ts # Внешние интеграции
```

**Пример Integration теста**:
```typescript
describe('Order Creation Flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  it('should create order and require admin approval', async () => {
    // 1. Создаем пользователя
    const user = await prisma.user.create({
      data: {
        telegramId: '123456789',
        roles: { create: { role: 'CUSTOMER' } },
      },
    });

    // 2. Получаем JWT токен
    const authResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/telegram-bot')
      .send({ userId: 123456789 })
      .expect(201);

    const { accessToken } = authResponse.body.data.tokens;

    // 3. Создаем заказ
    const orderResponse = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'A_TO_B',
        title: 'Test Order',
        fromAddress: 'Moscow',
        toAddress: 'SPb',
        price: 1000,
        regionId: 1,
      })
      .expect(201);

    // 4. Проверяем статус заказа
    const order = await prisma.order.findUnique({
      where: { id: orderResponse.body.data.id },
    });

    expect(order.status).toBe('CREATED');
    
    // 5. Проверяем, что заказ появился в очереди на модерацию
    const pendingOrders = await request(app.getHttpServer())
      .get('/api/v1/admin/orders/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(pendingOrders.body.data).toHaveLength(1);
  });
});
```

### E2E Tests (10% покрытия)
**Назначение**: Тестирование полных пользовательских сценариев

**Структура**:
```
test/e2e/
├── customer-journey.spec.ts    # Полный путь заказчика
├── performer-journey.spec.ts   # Полный путь исполнителя
├── admin-workflow.spec.ts      # Админский workflow
└── payment-processing.spec.ts  # Обработка платежей
```

**Пример E2E теста**:
```typescript
describe('Customer Journey E2E', () => {
  it('should complete full customer journey', async () => {
    // 1. Регистрация через Telegram Bot
    const authResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/telegram-bot')
      .send({
        userId: 123456789,
        firstName: 'John',
        lastName: 'Doe',
      });

    const { accessToken } = authResponse.body.data.tokens;

    // 2. Создание заказа
    const orderResponse = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'A_TO_B',
        title: 'Delivery Test',
        price: 1500,
        regionId: 1,
      });

    const orderId = orderResponse.body.data.id;

    // 3. Админ одобряет заказ
    await request(app.getHttpServer())
      .post(`/api/v1/admin/orders/${orderId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comment: 'Order approved' });

    // 4. Исполнитель откликается
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/respond`)
      .set('Authorization', `Bearer ${performerToken}`)
      .send({ message: 'I can do this job' });

    // 5. Заказчик принимает отклик
    await request(app.getHttpServer())
      .put(`/api/v1/orders/${orderId}/accept-response`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ performerId: performerId });

    // 6. Проверяем финальный статус
    const finalOrder = await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(finalOrder.body.data.status).toBe('IN_WORK');
  });
});
```

## 🔧 Test Utilities

### Database Setup
```typescript
// test/utils/database.ts
export class TestDatabase {
  static async setupTestDb(): Promise<PrismaService> {
    const prisma = new PrismaService({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    });

    await prisma.$connect();
    await this.cleanDatabase(prisma);
    await this.seedTestData(prisma);
    
    return prisma;
  }

  static async cleanDatabase(prisma: PrismaService) {
    const tables = [
      'order_responses',
      'orders',
      'payments',
      'user_roles',
      'users',
      'admin_actions',
      'broadcasts',
    ];

    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    }
  }

  static async seedTestData(prisma: PrismaService) {
    // Создаем тестовые регионы
    await prisma.region.createMany({
      data: [
        { name: 'Moscow', oneTimeRate: 350, optimalRate: 2000 },
        { name: 'SPb', oneTimeRate: 300, optimalRate: 1800 },
      ],
    });

    // Создаем тестовые категории транспорта
    const category = await prisma.vehicleCategory.create({
      data: { name: 'Легковые' },
    });

    const type = await prisma.vehicleType.create({
      data: { categoryId: category.id, name: 'Седан' },
    });

    await prisma.vehicleSubtype.create({
      data: { typeId: type.id, name: 'Эконом' },
    });
  }
}
```

### Mock Services
```typescript
// test/mocks/tinkoff.mock.ts
export const mockTinkoffService = {
  createPayment: jest.fn().mockResolvedValue({
    PaymentId: 'test-payment-id',
    PaymentURL: 'https://test-payment-url.com',
  }),
  
  validateWebhook: jest.fn().mockReturnValue(true),
  
  getPaymentStatus: jest.fn().mockResolvedValue({
    Status: 'CONFIRMED',
    Amount: 35000, // 350 рублей в копейках
  }),
};
```

### Test Fixtures
```typescript
// test/fixtures/users.fixture.ts
export const createTestUser = async (
  prisma: PrismaService,
  overrides: Partial<User> = {}
): Promise<User> => {
  return prisma.user.create({
    data: {
      telegramId: Math.random().toString(),
      firstName: 'Test',
      lastName: 'User',
      referralCode: 'TEST123',
      roles: {
        create: { role: 'CUSTOMER' },
      },
      ...overrides,
    },
    include: { roles: true },
  });
};

export const createTestAdmin = async (
  prisma: PrismaService
): Promise<User> => {
  return createTestUser(prisma, {
    roles: {
      create: { role: 'ADMIN' },
    },
  });
};
```

## 📋 Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.enum.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 30000,
};
```

### Test Environment
```typescript
// test/setup.ts
import { config } from 'dotenv';

// Загружаем тестовые переменные окружения
config({ path: '.env.test' });

// Глобальные моки
jest.mock('../src/integrations/tinkoff.service', () => ({
  TinkoffService: jest.fn().mockImplementation(() => mockTinkoffService),
}));

// Увеличиваем timeout для интеграционных тестов
jest.setTimeout(30000);
```

## 🚀 Запуск тестов

### NPM Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:ci": "jest --coverage --ci --watchAll=false"
  }
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: telega_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run test:ci
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## 📊 Coverage Goals

| Тип модуля | Минимальное покрытие |
|------------|---------------------|
| Services | 90% |
| Controllers | 80% |
| Guards | 85% |
| Utilities | 95% |
| Integration | 70% |

## 🔍 Testing Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **Descriptive test names**: `should create user when valid data provided`
3. **One assertion per test**: Фокус на одной проверке
4. **Mock external dependencies**: Не зависим от внешних сервисов
5. **Clean test data**: Очищаем БД после каждого теста
6. **Test edge cases**: Проверяем граничные случаи
7. **Performance tests**: Тестируем производительность критических операций 