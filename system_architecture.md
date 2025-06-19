# Архитектура системы Telega Logistics Bot

## Диаграмма компонентов

```mermaid
graph TB
    %% Пользователи
    User[👤 Пользователь Telegram] --> Bot[🤖 Telega Bot]
    
    %% Основные компоненты бота
    Bot --> Dispatcher[📋 Dispatcher]
    Bot --> FSM[🔄 FSM States]
    Bot --> Queue[📤 Message Queue]
    
    %% Handlers
    Dispatcher --> StartH[🚀 Start Handler]
    Dispatcher --> CustomerH[🛒 Customer Handler] 
    Dispatcher --> PerformerH[🚚 Performer Handler]
    Dispatcher --> OrderH[📦 Order Handler]
    Dispatcher --> AdminH[⚙️ Admin Handler]
    
    %% Keyboards
    StartH --> MainKB[⌨️ Main Keyboard]
    CustomerH --> CustomerKB[⌨️ Customer Keyboard]
    PerformerH --> PerformerKB[⌨️ Performer Keyboard]
    OrderH --> OrderKB[⌨️ Order Keyboard]
    
    %% Сервисы
    Queue --> SendService[📨 Send Message Service]
    OrderH --> OrderService[🔧 Order Setting Service]
    PerformerH --> RegionService[🗺️ Region Manager]
    
    %% База данных
    StartH --> UserDB[(👥 User DB)]
    CustomerH --> CustomerDB[(🛒 Customer DB)]
    PerformerH --> PerformerDB[(🚚 Performer DB)]
    OrderH --> OrderDB[(📦 Order DB)]
    OrderService --> PaymentDB[(💳 Payment DB)]
    RegionService --> RegionDB[(🗺️ Region DB)]
    
    %% Внешние интеграции
    PaymentDB --> TinkoffAPI[💳 Tinkoff API]
    SendService --> TelegramAPI[📱 Telegram API]
    
    %% MongoDB
    UserDB --> MongoDB[(🍃 MongoDB Atlas)]
    CustomerDB --> MongoDB
    PerformerDB --> MongoDB
    OrderDB --> MongoDB
    PaymentDB --> MongoDB
    RegionDB --> MongoDB
    
    %% Стили
    classDef user fill:#e1f5fe
    classDef bot fill:#f3e5f5
    classDef handler fill:#e8f5e8
    classDef service fill:#fff3e0
    classDef db fill:#fce4ec
    classDef external fill:#f1f8e9
    
    class User user
    class Bot,Dispatcher,FSM,Queue bot
    class StartH,CustomerH,PerformerH,OrderH,AdminH handler
    class SendService,OrderService,RegionService service
    class UserDB,CustomerDB,PerformerDB,OrderDB,PaymentDB,RegionDB,MongoDB db
    class TinkoffAPI,TelegramAPI external
```

## Бизнес-процессы

### 1. Регистрация пользователя
```mermaid
sequenceDiagram
    participant U as Пользователь
    participant B as Bot
    participant DB as Database
    
    U->>B: /start
    B->>DB: Проверка пользователя
    alt Новый пользователь
        B->>U: Выбор роли (Заказчик/Исполнитель)
        U->>B: Выбирает роль
        B->>U: Запрос имени
        U->>B: Вводит имя
        B->>U: Запрос телефона
        U->>B: Вводит телефон
        B->>DB: Сохранение пользователя
        B->>U: Главное меню
    else Существующий пользователь
        B->>U: Главное меню
    end
```

### 2. Создание заказа (Заказчик)
```mermaid
sequenceDiagram
    participant C as Заказчик
    participant B as Bot
    participant DB as Database
    participant P as Исполнитель
    
    C->>B: Создать заказ
    B->>DB: Проверка лимитов и баланса
    alt Недостаточно средств
        B->>C: Предложение пополнения
    else Все ОК
        B->>C: Выбор типа работы
        C->>B: A→B / Place / People
        B->>C: Выбор техники
        C->>B: Категория → Тип → Подтип
        B->>C: Выбор региона
        C->>B: Регион → Подрегион
        B->>C: Ввод адреса и деталей
        C->>B: Данные заказа
        B->>DB: Сохранение заказа
        B->>P: Уведомление о новом заказе
    end
```

### 3. Выполнение заказа (Исполнитель)
```mermaid
sequenceDiagram
    participant P as Исполнитель
    participant B as Bot
    participant DB as Database
    participant C as Заказчик
    participant Pay as Платежная система
    
    P->>B: Просмотр доступных заказов
    B->>DB: Фильтр по регионам исполнителя
    B->>P: Список заказов
    P->>B: Выбор заказа
    B->>DB: Проверка баланса исполнителя
    alt Недостаточно средств
        B->>P: Предложение пополнения
        P->>Pay: Оплата доступа
        Pay->>DB: Подтверждение платежа
    end
    B->>DB: Списание за заказ
    B->>C: Уведомление о найденном исполнителе
    B->>P: Контакты заказчика
    P->>B: Обновление статуса (в работе)
    B->>C: Уведомление о начале работы
    P->>B: Завершение работы
    B->>C: Запрос подтверждения
    C->>B: Подтверждение
    B->>DB: Финальный статус заказа
```

### 4. Платежный процесс
```mermaid
sequenceDiagram
    participant U as Пользователь
    participant B as Bot
    participant DB as Database
    participant T as Tinkoff API
    
    U->>B: Пополнить баланс
    B->>U: Сумма пополнения
    U->>B: Указывает сумму
    B->>DB: Создание платежной заявки
    B->>T: Инициация платежа (Init API)
    T->>B: PaymentURL
    B->>U: Ссылка на оплату
    U->>T: Оплачивает
    T->>B: Webhook уведомление
    B->>DB: Обновление статуса платежа
    alt Успешная оплата
        B->>DB: Пополнение баланса
        B->>U: Уведомление об успехе
    else Неуспешная оплата
        B->>U: Уведомление об ошибке
    end
```

## Схема данных

### Пользователи
```mermaid
erDiagram
    USER {
        ObjectId _id
        int user_id
        string username
        bool register
        bool performer
        bool custumer
        datetime register_date
        string referal
    }
    
    CUSTOMER {
        ObjectId _id
        int user_id
        string username
        string name
        string phone
        float balance
        int rating
        dict orders
        dict order_all
        int main_limit
        datetime date_registered
        string ref_code
        list referrals
    }
    
    PERFORMER {
        ObjectId _id
        int user_id
        string username
        string name
        string phone
        float balance
        int rating
        dict cars
        dict all_regions
        bool tariff
        list orders
        datetime date_registered
    }
    
    USER ||--o{ CUSTOMER : "может_быть"
    USER ||--o{ PERFORMER : "может_быть"
```

### Заказы
```mermaid
erDiagram
    ORDER {
        ObjectId _id
        string order_number
        string type_order
        string type_car
        string status
        datetime date
        string address
        string regions
        dict customer
        dict performer
        float price
        list log
    }
    
    SUBORDER {
        ObjectId _id
        ObjectId parent_order
        string status
        dict performer
        datetime create_date
    }
    
    PAYMENT {
        ObjectId _id
        int user_id
        float amount
        string status
        string order_id
        datetime create_date
    }
    
    ORDER ||--o{ SUBORDER : "может_иметь"
    CUSTOMER ||--o{ ORDER : "создает"
    PERFORMER ||--o{ ORDER : "выполняет"
    USER ||--o{ PAYMENT : "совершает"
```

## Ключевые особенности архитектуры

### 1. Асинхронность
- **asyncio** основа всей системы
- **Motor** для неблокирующих операций с MongoDB
- **Queue** система для обработки сообщений
- **Semaphore** для rate limiting

### 2. FSM (Finite State Machine)
- Управление диалогами через состояния
- **aiogram** FSM с MemoryStorage
- Группы состояний для разных процессов

### 3. Модульность
- Разделение по функциональности
- Отдельные handlers для каждой роли
- Сервисный слой для бизнес-логики

### 4. Масштабируемость
- Очереди сообщений для обработки нагрузки
- MongoDB для горизонтального масштабирования
- Webhook архитектура для интеграций

### 5. Безопасность
- SHA256 подписи для платежей  
- Валидация входных данных
- Rate limiting защита 