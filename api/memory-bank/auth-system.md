# Система аутентификации

## JWT Configuration

### JWT Strategy
```typescript
// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      telegramId: payload.telegramId,
      roles: payload.roles,
    };
  }
}
```

### JWT Module Configuration
```typescript
// src/auth/auth.module.ts
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { 
      expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') 
    },
  }),
})
```

## Guards System

### JwtAuthGuard
```typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### RolesGuard
```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => 
      user.roles?.some((userRole) => userRole.role === role)
    );
  }
}
```

### AdminGuard
```typescript
// src/common/guards/admin.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RoleType } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return user?.roles?.some(role => role.role === RoleType.ADMIN) ?? false;
  }
}
```

## Decorators

### User Decorator
```typescript
// src/common/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

### Roles Decorator
```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@prisma/client';

export const Roles = (...roles: RoleType[]) => SetMetadata('roles', roles);
```

### Admin Decorator
```typescript
// src/common/decorators/admin.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

export function Admin() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, AdminGuard),
  );
}
```

## Authentication Service

```typescript
// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async authenticateTelegramBot(authDto: TelegramAuthDto) {
    // Поиск или создание пользователя
    let user = await this.prisma.user.findUnique({
      where: { telegramId: authDto.userId.toString() },
      include: { roles: true },
    });

    const isNewUser = !user;

    if (!user) {
      // Создание нового пользователя
      user = await this.prisma.user.create({
        data: {
          telegramId: authDto.userId.toString(),
          username: authDto.username,
          firstName: authDto.firstName,
          lastName: authDto.lastName,
          referralCode: this.generateReferralCode(),
          roles: {
            create: { role: 'CUSTOMER' }, // По умолчанию заказчик
          },
        },
        include: { roles: true },
      });
    }

    // Проверка блокировки
    if (user.isBlocked) {
      throw new UnauthorizedException('User is blocked');
    }

    // Генерация токенов
    const tokens = await this.generateTokens(user);

    return {
      user: this.transformUser(user),
      tokens,
      isNewUser,
    };
  }

  async authenticateTelegramWebApp(initData: string) {
    // Валидация Telegram Mini App данных
    const userData = this.validateTelegramWebAppData(initData);
    
    // Аналогично authenticateTelegramBot
    return this.authenticateTelegramBot({
      userId: userData.id,
      username: userData.username,
      firstName: userData.first_name,
      lastName: userData.last_name,
    });
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { roles: true },
      });

      if (!user || user.isBlocked) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      telegramId: user.telegramId,
      roles: user.roles.map(r => r.role),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return { accessToken, refreshToken };
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private validateTelegramWebAppData(initData: string): any {
    // Валидация подписи Telegram WebApp
    // Реализация проверки hash согласно документации Telegram
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Проверка подписи...
    
    return JSON.parse(urlParams.get('user') || '{}');
  }

  private transformUser(user: any) {
    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles: user.roles.map(r => r.role),
      balance: user.balance,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
    };
  }
}
```

## Controller Usage Examples

### Basic Authentication
```typescript
@Controller('auth')
export class AuthController {
  @Post('telegram-bot')
  async telegramBot(@Body() authDto: TelegramAuthDto) {
    return this.authService.authenticateTelegramBot(authDto);
  }

  @Post('refresh')
  async refresh(@Body() { refreshToken }: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshToken);
  }
}
```

### Protected Endpoints
```typescript
@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@User() user: any) {
    return this.usersService.findById(user.id);
  }

  @Post('roles')
  @UseGuards(JwtAuthGuard)
  @Roles(RoleType.CUSTOMER, RoleType.PERFORMER)
  async addRole(@User() user: any, @Body() dto: AddRoleDto) {
    return this.usersService.addRole(user.id, dto.role);
  }
}
```

### Admin Endpoints
```typescript
@Controller('admin')
export class AdminController {
  @Get('users')
  @Admin()
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('orders/:id/approve')
  @Admin()
  async approveOrder(@Param('id') id: number, @User() admin: any) {
    return this.adminService.approveOrder(id, admin.id);
  }
}
```

## Token Structure

### Access Token Payload
```json
{
  "sub": 123,              // User ID
  "telegramId": "123456789",
  "roles": ["CUSTOMER", "PERFORMER"],
  "iat": 1640995200,       // Issued at
  "exp": 1641600000        // Expires at
}
```

### Environment Variables
```env
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

## Security Features

1. **JWT Tokens**: Stateless authentication
2. **Role-based Access**: Customer, Performer, Admin roles
3. **Refresh Tokens**: Long-lived tokens for token renewal
4. **User Blocking**: Blocked users cannot authenticate
5. **Telegram Validation**: Proper validation of Telegram data
6. **Guard Composition**: Flexible guard system for different access levels 