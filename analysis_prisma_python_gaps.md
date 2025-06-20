# Анализ расхождений между Prisma схемой и Python приложением

## Критические упущения в Prisma схеме

### 1. Недостающие поля в модели User

```prisma
model User {
  // ... существующие поля ...
  
  // ДОБАВИТЬ:
  mainLimit         Int                @default(2)        // main_limit из Python
  settingLimit      Int                @default(2)        // setting_limit  
  orderStats        Json               @default("{\"done\": 0, \"cancel\": 0}") // order_all
  reports           Json               @default("[]")     // report
  sendReports       Json               @default("[]")     // send_report  
  logs              Json               @default("[]")     // logs
  totalEarned       Decimal            @default(0) @db.Decimal(10,2) // total_earned
  
  // Для исполнителей:
  hasTariff         Boolean            @default(false)    // tariff из Performer
  cars              Json               @default("{}")     // cars
  activeRegions     Json               @default("{}")     // all_regions
}
```

### 2. Недостающие поля в модели Order

```prisma
model Order {
  // ... существующие поля ...
  
  // ДОБАВИТЬ:
  orderNumber       String             @unique            // order_number - КРИТИЧНО!
  typeTipCar        String?                              // type_tip_car
  podTypeCar        String?                              // podtype_car  
  amountCar         Int?                                 // amount_car
  createDate        DateTime           @default(now())   // create_date
  logs              Json               @default("[]")    // log
  sendStatus        Boolean            @default(false)   // send_status
  regions           String?                              // regions
  regionNumber      String?                              // region_number
  preRegion         String?                              // preregion
  requirements      String?                              // requirements
  distance          Decimal?           @db.Decimal(8,2)  // distance
  hasTariff         Boolean            @default(false)   // tariff
  hasVipTariff      Boolean            @default(false)   // viptarif
  sendToAll         Boolean            @default(false)   // send_all
  comment           String?                              // coment
  
  // Связи с подзаказами
  subOrders         SubOrder[]
}
```

### 3. Недостающие модели

#### SubOrder (подзаказы)
```prisma
model SubOrder {
  id                String             @id @default(cuid())
  parentOrderId     String
  executorId        String?
  
  status            OrderStatus        @default(PENDING)
  sendStatus        Boolean            @default(false)
  sendToAll         Boolean            @default(false)
  
  parentOrder       Order              @relation(fields: [parentOrderId], references: [id], onDelete: Cascade)
  executor          User?              @relation(fields: [executorId], references: [id])
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  @@map("sub_orders")
}
```

#### PreOrder (предварительные заказы)
```prisma
model PreOrder {
  id                String             @id @default(cuid())
  customerId        String
  
  // Данные для создания основного заказа
  orderData         Json
  status            String             @default("draft")
  
  customer          User               @relation(fields: [customerId], references: [id])
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  @@map("pre_orders")
}
```

#### PaymentInfo (детальная информация платежей)
```prisma
model PaymentInfo {
  id                String             @id @default(cuid())
  userId            String
  orderId           String?
  
  comment           String
  operation         String             // Тип операции
  amount            Decimal            @db.Decimal(10,2)
  status            String
  who               String             // Кто инициировал
  
  user              User               @relation(fields: [userId], references: [id])
  
  createdAt         DateTime           @default(now())
  
  @@map("payment_info")
}
```

#### CarType (типы машин)
```prisma
model CarType {
  id                String             @id @default(cuid())
  name              String             @unique
  description       String?
  
  subTypes          CarSubType[]
  
  @@map("car_types")
}

model CarSubType {
  id                String             @id @default(cuid())
  typeId            String
  name              String
  description       String?
  
  type              CarType            @relation(fields: [typeId], references: [id])
  
  @@unique([typeId, name])
  @@map("car_sub_types")
}
```

### 4. Доработка модели Region

```prisma
model Region {
  // ... существующие поля ...
  
  // ДОБАВИТЬ:
  regionNumber      Int                @unique            // region_number
  subRegions        Json               @default("{}")     // region (подрегионы)
}
```

### 5. Дополнительные служебные модели

```prisma
model ServerInfo {
  id                String             @id @default(cuid())
  key               String             @unique
  value             String
  description       String?
  
  @@map("server_info")
}

model ManageData {
  id                String             @id @default(cuid())
  type              String
  data              Json
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  @@map("manage_data")
}
```

## Миграционные соображения

1. **Разделение пользователей**: В Python отдельные коллекции `custumer_db` и `performer_db`, в Prisma - единая таблица с полем `role`
2. **JSON поля**: Многие сложные структуры Python (logs, cars, regions) нужно хранить как JSON
3. **Номера заказов**: Критически важно добавить `orderNumber` - это ключевое поле для бизнес-логики
4. **Подзаказы**: Система `subid_db` требует отдельной модели SubOrder

## Рекомендации по реализации

1. **Поэтапная миграция**: Сначала добавить критичные поля (orderNumber, logs, etc.)
2. **JSON поля**: Использовать для сложных структур (cars, regions, logs)  
3. **Индексы**: Добавить индексы на orderNumber, regionNumber, userId
4. **Валидация**: Добавить проверки на уровне Prisma для критичных полей 