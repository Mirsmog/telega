import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedisTokenService } from './services/redis-token.service';
import { TelegramAuthService } from './services/telegram-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // JWT Module with async configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
          issuer: configService.get<string>('JWT_ISSUER', 'telega-logistics'),
          audience: configService.get<string>('JWT_AUDIENCE', 'telega-logistics-users'),
        },
      }),
      inject: [ConfigService],
    }),

    // Passport Module
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),

    // Dependencies
    ConfigModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RedisTokenService, TelegramAuthService],
  exports: [
    AuthService,
    JwtStrategy,
    RedisTokenService,
    TelegramAuthService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
