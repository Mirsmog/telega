# Прогресс анализа - Технические детали для миграции

## Статус: VAN MODE - Детальный анализ завершен

### Архитектурные паттерны

#### 1. Асинхронная архитектура
```python
# Основа на asyncio + aiogram
- FSM управление состояниями
- Queue-based сообщения
- Semaphore для rate limiting
- Motor для MongoDB
```

#### 2. Модульная структура
```
handlers/ - обработчики событий
├── start.py - регистрация
├── custumer.py - функции заказчика  
├── performer.py - функции исполнителя
├── create_order.py - создание заказов
├── manage_order.py - управление заказами
└── admin.py - админ функции

keyboard/ - клавиатуры интерфейса
├── main_kb.py - основные
├── custumer_kb.py - заказчик
├── performer_kb.py - исполнитель
└── order_kb.py - заказы

database/ - операции с БД
├── user_db.py - пользователи
├── custumer_db.py - заказчики
├── performer_db.py - исполнители
├── order_db.py - заказы
└── payments_db.py - платежи

service/ - бизнес-логика
├── send_message_service/ - отправка
├── tinkiff/ - платежи
├── valid/ - валидация
├── order_setting.py - настройки заказов
└── manage_region.py - регионы
```

### Критические интеграции

#### 1. Telegram Bot API
- **aiogram** библиотека
- **Webhook** vs Polling
- **FSM** через MemoryStorage
- **Inline клавиатуры** + **Reply клавиатуры**

#### 2. Tinkoff Payments
```python
class TinkoffPayment:
    - terminal_key, token
    - SHA256 подписи
    - Init API endpoint
    - UUID order_id
    - Webhook callbacks
```

#### 3. MongoDB Atlas
```python
# Подключение
url = "mongodb+srv://admin:***@cluster0.mongodb.net/"
motor_client = AsyncIOMotorClient(url)

# Коллекции
bot.performer, bot.custumer  # пользователи
main.orde, main.suborder     # заказы  
main.users, main.manage      # управление
setting.payments             # платежи
tech.car, tech.type          # справочники
maps.region                  # география
```

### Ключевые алгоритмы

#### 1. Matching заказов и исполнителей
```python
async def find_available_orders(active_regions):
    # Поиск по региону + подрегиону
    # Статус "search"
    # Фильтрация по типу техники
```

#### 2. Ценообразование по регионам
```python
# Москва [77]: 300₽/200₽ (разовый/оптимальный)
# Владимирская [33]: 250₽/170₽  
# Краснодарский [23]: 350₽/220₽
# Остальные: 200₽/150₽
```

#### 3. Система лимитов
```python
async def check_order_amount(user_id):
    # Проверка main_limit
    # Проверка баланса (70₽ за заявку)
    # return "go_send"/"buy"/"insufficient"
```

### Состояния данных

#### Жизненный цикл заказа
```
create → wait → search → in_work → finish
                     ↓
                  canceled
```

#### Жизненный цикл платежа  
```
create → CONFIRMED → success
              ↓
           failure
```

### Требования к миграции

#### Обязательные функции
1. **Двойные роли пользователей** (Customer/Performer)
2. **FSM управление диалогами**
3. **Асинхронная обработка сообщений**
4. **Интеграция с платежной системой**
5. **Географическая система регионов**
6. **Система лимитов и балансов**
7. **Реферальная программа**
8. **Anti-flood защита**

#### Бизнес-критичные данные
- **Пользователи**: 2 типа + общие данные
- **Заказы**: 3 типа с подтипами
- **Платежи**: История + статусы
- **Регионы**: Иерархия + настройки пользователей
- **Транспорт**: Справочники + привязка к пользователям

#### API совместимость
- **Telegram Bot API**: Webhooks + методы
- **Tinkoff API**: Init + подписи + callbacks
- **MongoDB**: Запросы + агрегации + индексы

### Рекомендации по стеку

#### Подходящие технологии
**Node.js**: 
- ✅ Асинхронность из коробки
- ✅ Telegram Bot libraries (telegraf, node-telegram-bot-api)
- ✅ MongoDB drivers (mongoose)
- ✅ Crypto для подписей платежей

**Python FastAPI**:
- ✅ Async/await поддержка  
- ✅ Pydantic для валидации
- ✅ Motor для MongoDB
- ✅ Миграция логики 1:1

**Go**:
- ✅ Горутины для конкурентности
- ✅ Telegram Bot библиотеки
- ✅ MongoDB drivers
- ❌ Более сложная миграция FSM логики

#### Критичные моменты
1. **FSM состояния**: Нужно сохранить логику переходов
2. **Rate limiting**: Telegram API ограничения  
3. **Подписи платежей**: Точная имплементация алгоритма
4. **Географическая логика**: Сложная структура регионов
5. **Бизнес-правила**: Тарифы, лимиты, комиссии 