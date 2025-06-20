import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot({
      ttl: 60, // seconds
      limit: 10, // requests per ttl
    }),

    // Database
    PrismaModule,

    // User Management
    UserModule,

    // Authentication
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
