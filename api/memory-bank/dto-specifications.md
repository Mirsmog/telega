# DTO Specifications - Валидация данных

## 🔐 Auth DTOs

### TelegramAuthDto
```typescript
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class TelegramAuthDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
```

### RefreshTokenDto
```typescript
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
```

## 👥 Users DTOs

### UpdateUserDto
```typescript
import { IsOptional, IsString, IsPhoneNumber } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber('RU')
  phone?: string;
}
```

### AddRoleDto
```typescript
import { IsEnum } from 'class-validator';
import { RoleType } from '@prisma/client';

export class AddRoleDto {
  @IsEnum(RoleType)
  role: RoleType;
}
```

### CreateVehicleDto
```typescript
import { IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateVehicleDto {
  @IsNumber()
  vehicleSubtypeId: number;

  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsString()
  number: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
```

## 📦 Orders DTOs

### CreateOrderDto
```typescript
import { IsEnum, IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { OrderType } from '@prisma/client';

export class CreateOrderDto {
  @IsEnum(OrderType)
  type: OrderType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsString()
  toAddress?: string;

  @IsOptional()
  @IsString()
  workAddress?: string;

  @IsNumber()
  @Min(1)
  price: number;

  @IsNumber()
  regionId: number;

  @IsOptional()
  @IsNumber()
  vehicleSubtypeId?: number;
}
```

### OrderFilterDto
```typescript
import { IsOptional, IsEnum, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderType, OrderStatus } from '@prisma/client';

export class OrderFilterDto {
  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  regionId?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  vehicleSubtypeId?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  maxPrice?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}
```

### OrderResponseDto
```typescript
export class OrderResponseDto {
  @IsOptional()
  @IsString()
  message?: string;
}
```

## 💳 Payments DTOs

### CreatePaymentDto
```typescript
import { IsEnum, IsNumber } from 'class-validator';
import { TariffType } from '@prisma/client';

export class CreatePaymentDto {
  @IsEnum(TariffType)
  tariffType: TariffType;

  @IsNumber()
  regionId: number;
}
```

### PaymentWebhookDto
```typescript
export class PaymentWebhookDto {
  @IsString()
  TerminalKey: string;

  @IsString()
  OrderId: string;

  @IsString()
  Success: string;

  @IsString()
  Status: string;

  @IsString()
  PaymentId: string;

  @IsString()
  ErrorCode: string;

  @IsNumber()
  Amount: number;

  @IsString()
  Token: string;
}
```

### AddBalanceDto
```typescript
export class AddBalanceDto {
  @IsNumber()
  @Min(1)
  amount: number;
}
```

## 🛡️ Admin DTOs

### ApproveOrderDto
```typescript
export class ApproveOrderDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
```

### RejectOrderDto
```typescript
export class RejectOrderDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
```

### BlockUserDto
```typescript
export class BlockUserDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  duration?: string = 'permanent';
}
```

### UpdateBalanceDto
```typescript
export class UpdateBalanceDto {
  @IsNumber()
  amount: number;

  @IsEnum(['add', 'subtract', 'set'])
  type: 'add' | 'subtract' | 'set';

  @IsOptional()
  @IsString()
  comment?: string;
}
```

### BroadcastMessageDto
```typescript
import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { BroadcastTargetType } from '@prisma/client';

export class BroadcastMessageDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  image?: Express.Multer.File;

  @IsEnum(BroadcastTargetType)
  targetType: BroadcastTargetType;

  @IsOptional()
  @IsArray()
  targetUsers?: number[];

  @IsOptional()
  @IsArray()
  targetRegions?: number[];
}
```

### UpdateConfigDto
```typescript
export class UpdateConfigDto {
  @IsString()
  key: string;

  value: any; // JSON value

  @IsOptional()
  @IsString()
  comment?: string;
}
```

### VehicleCategoryDto
```typescript
export class VehicleCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
```

### VehicleTypeDto
```typescript
export class VehicleTypeDto {
  @IsNumber()
  categoryId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
```

### VehicleSubtypeDto
```typescript
export class VehicleSubtypeDto {
  @IsNumber()
  typeId: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
```

## 🎮 Sessions DTOs

### SessionDataDto
```typescript
export class SessionDataDto {
  data: Record<string, any>;
}
```

### UpdateSessionDto
```typescript
export class UpdateSessionDto {
  @IsOptional()
  data?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  ttl?: number; // seconds
}
```

## 🔧 Общие Response DTOs

### ApiResponseDto
```typescript
export class ApiResponseDto<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
  errors?: string[];
}
```

### PaginatedResponseDto
```typescript
export class PaginatedResponseDto<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### ErrorResponseDto
```typescript
export class ErrorResponseDto {
  success: false;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
  statusCode: number;
}
```

## Валидационные правила

### Общие правила
- Все обязательные поля должны быть помечены соответствующими декораторами
- Номера телефонов валидируются для России (`@IsPhoneNumber('RU')`)
- Числовые значения имеют минимальные ограничения где необходимо
- Enum'ы строго типизированы через Prisma
- Пагинация имеет значения по умолчанию (page=1, limit=20)

### Трансформации
- Query параметры автоматически преобразуются в числа через `@Transform`
- Булевые значения поддерживают строковые представления ('true', 'false')
- Даты автоматически парсятся в ISO формат 