# Активный контекст - Функциональный анализ Telega Logistics Bot

## Статус анализа: VAN MODE - Level 2

### Обнаруженные ключевые функции

## 1. СИСТЕМА РЕГИСТРАЦИИ И АУТЕНТИФИКАЦИИ

### Регистрация пользователей
- **Двойная роль**: Пользователь может быть как заказчиком, так и исполнителем
- **Реферальная система**: Поддержка пригласительных ссылок
- **Обязательные данные**: Имя, телефон
- **FSM состояния**: Управление процессом через конечные автоматы

### Схемы пользователей
```python
Customer:
- user_id, username, phone, name
- balance, rating, orders, order_all
- ref_code, parent_ref_code, referrals, ref_balance
- date_registered, date_blok, register, blok
- main_limit, setting_limit
- report, send_report, logs

Performer:
- Все поля Customer +
- cars (словарь автомобилей)
- all_regions (доступные регионы)
- tariff (тарифный план)
```

## 2. СИСТЕМА ЗАКАЗОВ

### Типы заказов
1. **"a_b"** - Перевозка из точки А в Б
   - Адрес загрузки и выгрузки
   - Расчет расстояния
   - Информация о грузе

2. **"place"** - Работа по месту
   - Один адрес выполнения
   - Без перемещения

3. **"people"** - Перевозка пассажиров
   - Количество пассажиров
   - Расстояние маршрута

### Схема заказа (Create_order)
```python
- order_number, type_order, create_date
- type_car, type_tip_car, podtype_car, amount_car
- date, time, address, drop_address
- regions, region_number, preregion
- customer, performer, status
- price, requirements, distance, amount_people
- tariff, viptarif, send_all, log
```

### Статусы заказов
- **create** - Создан
- **wait** - На модерации  
- **search** - Поиск исполнителя
- **in_work** - В работе
- **canceled** - Отменен
- **finish** - Завершен

## 3. СИСТЕМА ПЛАТЕЖЕЙ

### Интеграция с Tinkoff
- **Класс TinkoffPayment**: Инициация платежей
- **Хеширование**: SHA256 для подписи запросов
- **Webhook обработка**: Обновление статусов платежей
- **UUID заказов**: Уникальные идентификаторы

### Финансовая логика
- **Заказчики**: Пополняют баланс для размещения заявок (70₽ за заявку)
- **Исполнители**: Покупают доступ к заявкам (200-350₽ в зависимости от региона)
- **Тарифы**: "Разовый" и "Оптимальный" (от 2000₽)
- **Балансы**: Отдельное управление для каждого типа пользователя

## 4. ГЕОГРАФИЧЕСКАЯ СИСТЕМА

### Регионы
- **Иерархия**: Регион → Подрегион/Город
- **Коды регионов**: Численные коды (77-Москва, 33-Владимирская обл.)
- **Динамическое управление**: Автоматическое обновление регионов для исполнителей
- **Изображения**: Карта регионов для выбора

### Управление регионами
```python
format: {
  region_code: {
    "name": "Название региона",
    "subreg": {
      "подрегион1": True/False,
      "подрегион2": True/False
    }
  }
}
```

## 5. СИСТЕМА ТРАНСПОРТА

### Категории техники
- **Иерархия**: Категория → Тип → Подтип
- **База данных**: server_db содержит все категории
- **Привязка к пользователю**: Исполнители регистрируют свой транспорт
- **Данные автомобиля**: Марка, модель, номер, тип, подтип

## 6. СИСТЕМА УВЕДОМЛЕНИЙ

### Очереди сообщений
- **Priority Queue**: Высокоприоритетные сообщения
- **Broadcast Queue**: Массовые рассылки
- **Semaphore (29)**: Ограничение скорости отправки
- **Типы контента**: text, photo, document

### Anti-flood защита
- **Семафор**: Максимум 29 одновременных запросов
- **Приоритизация**: Приоритетные сообщения блокируют broadcast

## 7. СИСТЕМА СОСТОЯНИЙ (FSM)

### Группы состояний
- **Register_user**: Name, Phone
- **Создание заказа**: Многоэтапный процесс выбора
- **Управление заказами**: Обновление статусов
- **Платежи**: Обработка транзакций

## 8. БАЗА ДАННЫХ (MongoDB)

### Коллекции
```python
performer_db - исполнители
custumer_db - заказчики  
order_db - заказы
subid_db - подзаказы
user_db - общие пользовательские данные
payments_db - платежи
paymentinfo_db - информация о платежах
server_db - настройки сервера
region_db - регионы
car_db, type_db, podtype_db - справочники техники
```

### Подключение
- **MongoDB Atlas**: Облачная база данных
- **Motor**: Асинхронный драйвер
- **Индексация**: По user_id, order_number, статусам

## 9. БИЗНЕС-ЛОГИКА

### Лимиты пользователей
- **main_limit**: Основное ограничение заявок
- **setting_limit**: Настраиваемый лимит
- **Проверка баланса**: Перед созданием заявки

### Система рейтингов
- **Рейтинг пользователей**: Влияет на приоритет
- **Статистика заказов**: done/cancel соотношение
- **Блокировка**: Возможность блокировки пользователей

## 10. АДМИНИСТРАТИВНАЯ ПАНЕЛЬ

### Минимальная функциональность
- **admin.py**: Пустой файл
- **Управление через базу**: Прямые операции с MongoDB
- **Настройки сервера**: server_db коллекция 